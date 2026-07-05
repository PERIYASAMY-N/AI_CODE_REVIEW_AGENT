# AI Code Review Agent — Complete API Reference

## Base URL
- **Local**: `http://localhost:8000/api/v1`
- **Production**: `https://ai-code-review-backend.onrender.com/api/v1`

## Authentication
All protected routes require: `Authorization: Bearer <access_token>`

---

## AUTH ENDPOINTS

### POST `/auth/register`
Register a new user. Returns 201 on success.

**Request Body:**
```json
{ "name": "Periyasamy N", "email": "user@test.com", "password": "securepass" }
```
**Success (201):**
```json
{ "success": true, "message": "User registered successfully" }
```
**Error (400) — Duplicate Email:**
```json
{ "detail": "Email already registered" }
```
**Error (422) — Validation:**
```json
{ "detail": [{ "msg": "String should have at least 6 characters", "loc": ["body", "password"] }] }
```

---

### POST `/auth/login`
Login and get JWT token.

**Request Body:**
```json
{ "email": "user@test.com", "password": "securepass" }
```
**Success (200):**
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "token_type": "bearer" }
```
**Error (401):**
```json
{ "detail": "Invalid Credentials" }
```

---

### GET `/auth/me` 🔒
Get current authenticated user profile.

**Success (200):**
```json
{ "id": 1, "name": "Periyasamy N", "email": "user@test.com", "is_admin": false, "created_at": "2026-07-04T18:00:00Z" }
```
**Error (401):**
```json
{ "detail": "Invalid Token" }
```

---

## REVIEW ENDPOINTS

### POST `/review/analyze` 🔒 (Rate: 5/minute)
Submit code for AI analysis.

**Request Body:**
```json
{
  "language": "python",
  "source_code": "def add(a, b):\n    return a + b",
  "model_name": "deepseek/deepseek-chat-v3-0324"
}
```
**Supported languages:** `java`, `python`, `javascript`, `typescript`, `c`, `cpp`, `csharp`

**Success (200):**
```json
{
  "success": true,
  "language": "python",
  "bugs": [],
  "security_issues": [],
  "best_practices": ["Add type hints", "Add docstring"],
  "optimizations": [],
  "root_cause": [],
  "corrected_code": "def add(a: int, b: int) -> int:\n    return a + b",
  "summary": "Clean, simple function.",
  "overall_score": 85,
  "security_score": 95,
  "maintainability_score": 88,
  "complexity": "Low",
  "estimated_time_complexity": "O(1)",
  "risk_level": "LOW"
}
```
**Error (422):** Unsupported language or code too short/long.
**Error (429):** Rate limit exceeded (5/minute per IP).
**Error (500):** OpenRouter failure or invalid AI response.

---

## HISTORY ENDPOINTS

### GET `/history` 🔒
Get current user's review history. Supports filtering.

**Query Params (all optional):**
| Param | Type | Example |
|---|---|---|
| `language` | string | `?language=python` |
| `risk_level` | string | `?risk_level=HIGH` |
| `min_score` | int | `?min_score=70` |

**Success (200):**
```json
{
  "success": true,
  "reviews": [
    { "id": 1, "language": "python", "overall_score": 85, "risk_level": "LOW", "created_at": "2026-07-04T18:00:00Z" }
  ]
}
```

---

### GET `/history/{review_id}` 🔒
Get full review details.

**Success (200):**
```json
{
  "id": 1,
  "language": "python",
  "source_code": "def add(a, b): ...",
  "review_result": { "bugs": [], ... },
  "overall_score": 85,
  "risk_level": "LOW",
  "created_at": "2026-07-04T18:00:00Z"
}
```
**Error (404):** Review not found or unauthorized.

---

### DELETE `/history/{review_id}` 🔒
Delete a review.

**Success (200):**
```json
{ "success": true, "message": "Review deleted successfully" }
```

---

## DASHBOARD

### GET `/dashboard/stats` 🔒
Returns aggregated statistics for the current user.

**Success (200):**
```json
{
  "total_reviews": 25,
  "average_score": 78,
  "high_risk_reviews": 3,
  "medium_risk_reviews": 8,
  "low_risk_reviews": 14
}
```

---

## REPORTS

### GET `/report/pdf/{review_id}` 🔒
Downloads review as a PDF file.

**Response:** Binary PDF stream (`application/pdf`)
**Header:** `Content-Disposition: attachment; filename="code_review_1.pdf"`

---

### GET `/report/json/{review_id}` 🔒
Downloads review as a structured JSON file.

**Response:** JSON file (`application/json`)
**Header:** `Content-Disposition: attachment; filename="code_review_1.json"`

---

## USER PROFILE

### PUT `/users/me` 🔒
Update display name.

**Request Body:**
```json
{ "name": "New Name" }
```
**Success (200):**
```json
{ "success": true, "message": "Profile updated successfully" }
```

---

### PUT `/users/me/password` 🔒
Change password (verifies old password first).

**Request Body:**
```json
{ "old_password": "current", "new_password": "newsecurepass" }
```
**Success (200):**
```json
{ "success": true, "message": "Password changed successfully" }
```
**Error (400):** Incorrect old password.

---

## ADMIN (Admin-only)

### GET `/admin/stats` 🔒🔑
Platform-wide statistics. Requires `is_admin = true`.

**Success (200):**
```json
{
  "total_users": 42,
  "total_reviews": 187,
  "most_used_language": "python",
  "average_score": 74
}
```
**Error (403):** Non-admin user.

---

## AI Models Available
| Model ID | Label |
|---|---|
| `deepseek/deepseek-chat-v3-0324` | DeepSeek V3 *(default)* |
| `qwen/qwen3-235b-a22b` | Qwen 3 |
| `meta-llama/llama-3.1-70b-instruct` | Llama 3.1 |
| `mistralai/mistral-7b-instruct` | Mistral 7B |
