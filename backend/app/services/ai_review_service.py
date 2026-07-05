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

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

_JSON_MODE_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
}

_MODEL_GONE_CODES = {
    "model_decommissioned",
    "model_not_found",
    "invalid_request_error",
}

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


# ---------------------------------------------------------------------------
# JSON repair: handle raw (unescaped) newlines inside string values
# ---------------------------------------------------------------------------

def _repair_json_newlines(raw: str) -> str:
    """
    Some LLM responses contain raw newline characters inside JSON string values,
    which is invalid JSON (the spec requires them as the two-char escape \\n).

    json.loads() throws JSONDecodeError: "Invalid control character at: ..."
    for these responses.

    Strategy:
    - Walk the raw string character by character, tracking whether we are
      inside a JSON string (between unescaped double-quotes).
    - When inside a string, replace bare \\n / \\r / \\t with their JSON
      escape equivalents so the result passes json.loads().
    - This preserves the structure of the JSON document; only string content
      is modified.

    Returns the repaired string, ready for json.loads().
    """
    chars = []
    in_string = False
    i = 0

    while i < len(raw):
        ch = raw[i]

        # Track string boundaries, respecting backslash escapes
        if ch == '\\' and in_string:
            # Consume the escape sequence as-is (already escaped)
            chars.append(ch)
            i += 1
            if i < len(raw):
                chars.append(raw[i])
                i += 1
            continue

        if ch == '"':
            in_string = not in_string
            chars.append(ch)
            i += 1
            continue

        # Inside a string: escape bare control characters
        if in_string:
            if ch == '\n':
                chars.append('\\n')
            elif ch == '\r':
                chars.append('\\r')
            elif ch == '\t':
                chars.append('\\t')
            else:
                chars.append(ch)
        else:
            chars.append(ch)

        i += 1

    return ''.join(chars)


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> str:
    """
    Extract the outermost JSON object from a raw LLM response.

    Priority:
    1. Fenced ```json ... ``` block
    2. Fenced ``` ... ``` block (no language tag)
    3. Brace-count scan from first { to matching }
    """
    # Strip <think> reasoning blocks (QwQ / DeepSeek)
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()

    # 1. Try ```json fence
    m = re.search(r"```json\s*(\{.*\})\s*```", raw, re.DOTALL)
    if m:
        return m.group(1)

    # 2. Try any fence
    m = re.search(r"```\s*(\{.*\})\s*```", raw, re.DOTALL)
    if m:
        return m.group(1)

    # 3. Brace-count scan — robust even when the model adds text around JSON
    start = raw.find("{")
    if start == -1:
        return raw

    depth = 0
    in_string = False
    escape_next = False
    end = start

    for i in range(start, len(raw)):
        ch = raw[i]

        if escape_next:
            escape_next = False
            continue

        if ch == "\\" and in_string:
            escape_next = True
            continue

        if ch == '"':
            in_string = not in_string
            continue

        if not in_string:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break

    return raw[start: end + 1]


# ---------------------------------------------------------------------------
# corrected_code post-processing
# ---------------------------------------------------------------------------

def _normalise_corrected_code(cc: str) -> str:
    """
    Convert corrected_code to a clean, multiline string for the frontend.

    After json.loads() (or after JSON repair + json.loads()), the string is
    already decoded — \\n in the JSON became a real newline in Python.
    This function handles any remaining edge cases:

    A. Literal two-char sequences \\n still in the string (rare, double-escaped)
       → replace with real newlines FIRST, before fence stripping
    B. Markdown fences inside the value   ```java\\n...\\n```
       → strip after unescaping so the fence regex sees real newlines
    C. CRLF → LF normalisation
    D. Trim surrounding blank lines only
    """
    if not cc:
        return cc

    # A. Unescape any remaining literal \\n / \\t sequences — UNCONDITIONAL
    cc = cc.replace("\\n", "\n").replace("\\t", "\t").replace("\\r", "")

    # B. Strip markdown fences (now newlines are real chars)
    cc = re.sub(r'^```[\w\-]*[ \t]*\n?', '', cc)
    cc = re.sub(r'\n?```[ \t]*$', '', cc)

    # C. Normalise CRLF → LF
    cc = cc.replace("\r\n", "\n").replace("\r", "\n")

    # D. Trim surrounding blank lines, preserve internal indentation
    cc = cc.strip("\n")

    return cc


# ---------------------------------------------------------------------------
# Main parse entry point
# ---------------------------------------------------------------------------

def _parse_content(raw_content: str) -> dict:
    """
    Parse the raw LLM response string into a validated Python dict.

    Two-pass strategy:
    Pass 1 — try json.loads() directly (fast path, works when model behaves)
    Pass 2 — if that fails with JSONDecodeError, run _repair_json_newlines()
             then try json.loads() again (handles real newlines inside strings)
    """
    logger.info("RAW LLM (first 400 chars): %r", raw_content[:400])

    json_str = _extract_json(raw_content)
    logger.info("EXTRACTED JSON (first 400 chars): %r", json_str[:400])

    # Pass 1: direct parse
    parsed = None
    try:
        parsed = json.loads(json_str)
        logger.info("JSON parsed OK on pass 1")
    except json.JSONDecodeError as e1:
        logger.warning("Pass 1 JSONDecodeError: %s — attempting JSON repair", e1)

        # Pass 2: repair raw newlines inside string values then re-parse
        try:
            repaired = _repair_json_newlines(json_str)
            logger.info("REPAIRED JSON (first 400 chars): %r", repaired[:400])
            parsed = json.loads(repaired)
            logger.info("JSON parsed OK on pass 2 (after repair)")
        except json.JSONDecodeError as e2:
            logger.error(
                "Pass 2 JSONDecodeError: %s\nFull raw response:\n%s",
                e2, raw_content
            )
            raise  # let the caller handle it

    # Guarantee all required keys exist
    for key in _REQUIRED_KEYS:
        if key not in parsed:
            parsed[key] = _EMPTY_RESULT[key]

    # Normalise corrected_code
    cc_raw = parsed.get("corrected_code", "")
    cc_clean = _normalise_corrected_code(cc_raw)

    line_count = cc_clean.count("\n") + 1 if cc_clean else 0
    logger.info(
        "corrected_code: raw_len=%d  clean_len=%d  lines=%d  preview=%r",
        len(cc_raw), len(cc_clean), line_count, cc_clean[:150]
    )

    parsed["corrected_code"] = cc_clean
    return parsed


# ---------------------------------------------------------------------------
# Groq helpers
# ---------------------------------------------------------------------------

def _is_model_gone_error(exc: APIStatusError) -> bool:
    error_code = getattr(exc, "code", "") or ""
    error_body = str(getattr(exc, "body", "") or "")
    return any(m in error_code or m in error_body for m in _MODEL_GONE_CODES)


async def _call_groq(model_name: str, messages: list) -> str:
    create_kwargs: dict = {
        "model": model_name,
        "messages": cast(Iterable[ChatCompletionMessageParam], messages),
    }
    if model_name in _JSON_MODE_MODELS:
        create_kwargs["response_format"] = cast(ResponseFormat, {"type": "json_object"})

    response = await client.chat.completions.create(**create_kwargs)
    return response.choices[0].message.content or ""


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def review_code(request: ReviewRequest) -> dict:
    """
    Call Groq to analyse source code and return a structured JSON dict.
    Auto-fallback to the next model if the requested one is decommissioned.
    """
    if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.startswith("gsk_"):
        raise HTTPException(status_code=500, detail="Groq API Key is missing or invalid.")

    requested_model: str = request.model_name or settings.AI_MODEL
    fallback_chain: list[str] = [requested_model] + [
        m for m in SUPPORTED_MODELS if m != requested_model
    ]

    messages = build_review_messages(request.language, request.source_code)
    last_error: Exception | None = None

    for attempt, model_name in enumerate(fallback_chain):
        try:
            if attempt > 0:
                logger.warning(
                    "Model '%s' unavailable — retrying with '%s'.",
                    fallback_chain[attempt - 1], model_name,
                )

            raw_content = await _call_groq(model_name, messages)

            try:
                result = _parse_content(raw_content)
                logger.info(
                    "Review complete: model=%s  score=%s  risk=%s  cc_lines=%d",
                    model_name,
                    result.get("overall_score"),
                    result.get("risk_level"),
                    result["corrected_code"].count("\n") + 1
                    if result.get("corrected_code") else 0,
                )
                return result

            except (json.JSONDecodeError, ValueError, TypeError) as parse_err:
                logger.error(
                    "PARSE FAILED (%s). Full raw response:\n%s",
                    parse_err, raw_content
                )
                fallback_result = dict(_EMPTY_RESULT)
                fallback_result["summary"] = (
                    f"AI returned unparseable output ({type(parse_err).__name__}). "
                    f"Raw preview: {raw_content[:200]}"
                )
                return fallback_result

        except RateLimitError:
            raise HTTPException(status_code=429, detail="Groq rate limit exceeded. Please wait.")

        except APIConnectionError:
            raise HTTPException(status_code=503, detail="Groq network connection error.")

        except APIStatusError as e:
            if _is_model_gone_error(e):
                logger.error("Model '%s' gone (HTTP %s). Trying fallback.", model_name, e.status_code)
                last_error = e
                continue
            raise HTTPException(status_code=e.status_code, detail=f"Groq Error: {e.message}")

        except GroqError as e:
            raise HTTPException(status_code=500, detail=f"Groq Error: {str(e)}")

        except IndexError:
            raise HTTPException(status_code=500, detail="Invalid AI response: no choices returned.")

    logger.error("All fallback models exhausted. Last error: %s", last_error)
    raise HTTPException(
        status_code=502,
        detail="All AI models are currently unavailable. Please try again later.",
    )
