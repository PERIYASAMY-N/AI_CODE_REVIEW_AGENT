import json
import re
import logging
from typing import cast, Iterable
from fastapi import HTTPException
from groq import AsyncGroq, APIConnectionError, APIStatusError, RateLimitError, GroqError
from groq.types.chat import ChatCompletionMessageParam
from groq.types.chat.completion_create_params import ResponseFormat
from app.core.config import settings
from app.utils.prompt_builder import build_review_messages
from app.schemas.review_request import ReviewRequest, SUPPORTED_MODELS, DEFAULT_MODEL

logger = logging.getLogger(__name__)

# Initialize Groq async client
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# Models that support Groq's JSON mode (response_format={"type":"json_object"}).
# All others fall back to text-based parsing — no response_format is sent.
_JSON_MODE_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
}

# Groq error codes that indicate a model is gone / invalid — trigger auto-fallback
_MODEL_GONE_CODES = {
    "model_decommissioned",
    "model_not_found",
    "invalid_request_error",
}

# Default empty structure — returned on graceful fallback
_EMPTY_RESULT: dict = {
    "bugs": [],
    "security_issues": [],
    "best_practices": [],
    "optimizations": [],
    "root_cause": [],
    "corrected_code": "",
    "summary": "",
    "overall_score": 0,
    "risk_level": "UNKNOWN",
}

_REQUIRED_KEYS: list[str] = list(_EMPTY_RESULT.keys())


def _parse_content(content: str) -> dict:
    """
    Robustly extract and parse JSON from the model response.
    Handles:
      - <think> reasoning blocks (qwen-qwq style)
      - ```json ... ``` fenced code blocks
      - Bare JSON objects in the response
    """
    # 1. Strip <think> chain-of-thought blocks
    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()

    # 2. Try fenced ```json block first
    match_codeblock = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
    json_str: str = match_codeblock.group(1) if match_codeblock else content

    # 3. If no fenced block found, grab the outermost { ... }
    if not match_codeblock:
        match_braces = re.search(r"\{.*\}", content, re.DOTALL)
        json_str = match_braces.group(0) if match_braces else content

    parsed: dict = json.loads(json_str)

    # 4. Guarantee all required keys exist
    for key in _REQUIRED_KEYS:
        if key not in parsed:
            parsed[key] = _EMPTY_RESULT[key]

    return parsed


def _is_model_gone_error(exc: APIStatusError) -> bool:
    """Return True when the Groq error indicates the model no longer exists."""
    error_code = getattr(exc, "code", "") or ""
    error_body = str(getattr(exc, "body", "") or "")
    for marker in _MODEL_GONE_CODES:
        if marker in error_code or marker in error_body:
            return True
    return False


async def _call_groq(model_name: str, messages: list) -> str:
    """
    Single Groq API call for the given model.
    Returns the raw content string.
    Raises Groq exceptions on failure — caller handles retries.
    """
    create_kwargs: dict = {
        "model": model_name,
        "messages": cast(Iterable[ChatCompletionMessageParam], messages),
    }
    if model_name in _JSON_MODE_MODELS:
        create_kwargs["response_format"] = cast(ResponseFormat, {"type": "json_object"})

    response = await client.chat.completions.create(**create_kwargs)
    return response.choices[0].message.content or ""


async def review_code(request: ReviewRequest) -> dict:
    """
    Call the Groq API to analyse source code and return a structured JSON response.

    Auto-fallback logic:
      - If the requested model is decommissioned / not found, automatically
        retry with the next model in SUPPORTED_MODELS.
      - Only one retry attempt is made to avoid long hang times.
    """
    if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.startswith("gsk_"):
        raise HTTPException(status_code=500, detail="Groq API Key is missing or invalid.")

    requested_model: str = request.model_name or settings.AI_MODEL

    # Build the ordered list of models to try: requested first, then fallbacks
    fallback_chain: list[str] = [requested_model] + [
        m for m in SUPPORTED_MODELS if m != requested_model
    ]

    messages = build_review_messages(request.language, request.source_code)
    last_error: Exception | None = None

    for attempt, model_name in enumerate(fallback_chain):
        try:
            if attempt > 0:
                logger.warning(
                    "Model '%s' unavailable. Retrying with fallback '%s'.",
                    fallback_chain[attempt - 1],
                    model_name,
                )

            content = await _call_groq(model_name, messages)

            try:
                return _parse_content(content)
            except (json.JSONDecodeError, ValueError, TypeError):
                snippet = content[:150] + ("..." if len(content) > 150 else "")
                fallback_result = dict(_EMPTY_RESULT)
                fallback_result["summary"] = f"AI returned invalid JSON. Raw snippet: {snippet}"
                return fallback_result

        except RateLimitError as e:
            raise HTTPException(status_code=429, detail="Groq Error: Rate limit exceeded.")

        except APIConnectionError:
            raise HTTPException(status_code=503, detail="Groq Error: Network connection error.")

        except APIStatusError as e:
            if _is_model_gone_error(e):
                # Log and try next model in fallback chain
                logger.error(
                    "Model '%s' is decommissioned or invalid (HTTP %s). Will try fallback.",
                    model_name,
                    e.status_code,
                )
                last_error = e
                continue  # next iteration picks the next fallback model

            # Any other API error — surface immediately
            raise HTTPException(
                status_code=e.status_code,
                detail=f"Groq Error: {e.message}",
            )

        except GroqError as e:
            raise HTTPException(status_code=500, detail=f"Groq Error: {str(e)}")

        except IndexError:
            raise HTTPException(
                status_code=500,
                detail="Invalid AI Response: No choices returned.",
            )

    # All models in the fallback chain failed
    logger.error("All Groq fallback models exhausted. Last error: %s", last_error)
    raise HTTPException(
        status_code=502,
        detail=(
            "All configured AI models are currently unavailable. "
            "Please try again later or contact support."
        ),
    )
