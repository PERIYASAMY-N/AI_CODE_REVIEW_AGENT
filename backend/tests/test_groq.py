"""
test_groq.py — Unit tests for the Groq AI review service.
Run with: pytest tests/ -v
"""
import json
import pytest
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException
from app.services.ai_review_service import review_code
from app.schemas.review_request import ReviewRequest
from app.core.config import settings


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=False)
def valid_api_key(monkeypatch):
    """Patch settings so GROQ_API_KEY is a valid-looking key for all tests."""
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_api_key_1234567890")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_mock_client(content: str):
    """Return a mock client whose create() coroutine returns a Groq-shaped response."""
    mock_client = AsyncMock()
    mock_message = AsyncMock()
    mock_message.content = content
    mock_choice = AsyncMock()
    mock_choice.message = mock_message
    mock_response = AsyncMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    return mock_client


# ─── Test 1: API key validation ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_api_key_validation(monkeypatch):
    """Invalid key → HTTP 500 with descriptive message."""
    monkeypatch.setattr(settings, "GROQ_API_KEY", "invalid_key_no_gsk_prefix")
    request = ReviewRequest(language="python", source_code="print('Hello World')")

    with pytest.raises(HTTPException) as exc_info:
        await review_code(request)

    assert exc_info.value.status_code == 500
    assert "Groq API Key is missing or invalid" in exc_info.value.detail


# ─── Test 2: Simple prompt with partial JSON ─────────────────────────────────

@pytest.mark.asyncio
async def test_simple_prompt_response(monkeypatch):
    """Groq returns minimal JSON → service normalises missing required keys."""
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_api_key_1234567890")

    mock_client = _make_mock_client('{"message": "success"}')

    with patch("app.services.ai_review_service.client", mock_client):
        request = ReviewRequest(language="python", source_code="print('Hello World')")
        result = await review_code(request)

    # The extra key we put in should still be there
    assert result["message"] == "success"
    # The service must have normalised the missing required keys
    assert "bugs" in result
    assert "overall_score" in result
    assert isinstance(result["bugs"], list)


# ─── Test 3: Full code review schema ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_code_review_response(monkeypatch):
    """Groq returns full valid JSON → all required fields present with correct values."""
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_api_key_1234567890")

    expected_payload = {
        "bugs": [],
        "security_issues": [],
        "best_practices": ["Use functions to organise code"],
        "optimizations": [],
        "root_cause": [],
        "corrected_code": "def hello():\n    print('Hello World')\n\nhello()",
        "summary": "Simple hello world script, could use a function.",
        "overall_score": 90,
        "risk_level": "Low",
    }

    mock_client = _make_mock_client(json.dumps(expected_payload))

    with patch("app.services.ai_review_service.client", mock_client):
        request = ReviewRequest(language="python", source_code="print('Hello World')")
        result = await review_code(request)

    # Every key from expected_payload must be present with the right value
    for key, expected_value in expected_payload.items():
        assert key in result, f"Missing key: {key}"
        assert result[key] == expected_value, f"Mismatch for key '{key}': {result[key]!r} != {expected_value!r}"


# ─── Test 4: Fallback on invalid JSON ────────────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_json_fallback(monkeypatch):
    """When model returns garbage, service must NOT raise — return safe fallback."""
    monkeypatch.setattr(settings, "GROQ_API_KEY", "gsk_test_api_key_1234567890")

    mock_client = _make_mock_client("I am not JSON at all!!! ###")

    with patch("app.services.ai_review_service.client", mock_client):
        request = ReviewRequest(language="python", source_code="print('Hello World')")
        result = await review_code(request)

    assert result["overall_score"] == 0
    assert result["risk_level"] == "UNKNOWN"
    assert "bugs" in result
    assert isinstance(result["bugs"], list)
