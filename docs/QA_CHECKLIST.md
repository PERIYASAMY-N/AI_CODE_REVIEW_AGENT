# Module 12 — QA Checklist & Final Review

## Backend Validation Checklist

### Auth
- [x] `POST /auth/register` — 201 on success
- [x] `POST /auth/register` — 400 on duplicate email
- [x] `POST /auth/register` — 422 on short password (<6 chars)
- [x] `POST /auth/register` — 422 on missing fields
- [x] `POST /auth/login` — 200 with JWT token on valid credentials
- [x] `POST /auth/login` — 401 on wrong password
- [x] `POST /auth/login` — 401 on unknown email
- [x] `GET /auth/me` — 200 with user profile (now includes `is_admin`, `created_at`)
- [x] `GET /auth/me` — 403 when no Authorization header
- [x] `GET /auth/me` — 401 with tampered/expired token

### Review API
- [x] `POST /review/analyze` — 403 without token
- [x] `POST /review/analyze` — 422 on unsupported language
- [x] `POST /review/analyze` — 422 on source_code < 10 chars
- [x] `POST /review/analyze` — 422 on source_code > 50,000 chars
- [x] `POST /review/analyze` — 200 with full structured AI response
- [x] `POST /review/analyze` — 429 after 5 requests/minute
- [x] `POST /review/analyze` — 500 on OpenRouter timeout (handled)
- [x] Review saved to DB after successful analysis

### History & Dashboard
- [x] `GET /history` — 200 with empty list for new user
- [x] `GET /history?language=python` — filters correctly
- [x] `GET /history?risk_level=HIGH` — filters correctly
- [x] `GET /history?min_score=80` — filters correctly
- [x] `GET /history/{id}` — 200 with full review details
- [x] `GET /history/{id}` — 404 for other user's review (ownership enforced)
- [x] `DELETE /history/{id}` — 200 and removed from DB
- [x] `GET /dashboard/stats` — 200 with all correct totals

### Reports
- [x] `GET /report/pdf/{id}` — returns binary PDF
- [x] `GET /report/json/{id}` — returns downloadable JSON
- [x] Both report endpoints return 404 for unauthorised IDs

### User Profile
- [x] `PUT /users/me` — name updated
- [x] `PUT /users/me/password` — 400 on wrong old password
- [x] `PUT /users/me/password` — 200 on correct old password

### Admin
- [x] `GET /admin/stats` — 403 for non-admin users
- [x] `GET /admin/stats` — 200 with platform stats for admin

---

## Frontend Validation Checklist

### Login Page
- [x] Form validates required fields
- [x] Shows dismissible error on wrong credentials
- [x] Password show/hide toggle works
- [x] Loading spinner shown during request
- [x] Button disabled during loading
- [x] Redirects to /dashboard on success

### Register Page
- [x] Shows error on duplicate email
- [x] Shows validation error on fill-in issues
- [x] Redirects to /dashboard after register + auto-login

### Dashboard
- [x] Skeleton loaders shown during stat fetch
- [x] Stats load correctly after fetch
- [x] Code Editor integrated below stats
- [x] Model selector dropdown renders all 4 models
- [x] Language selector has all 7 languages

### Code Editor
- [x] Monaco Editor renders code correctly
- [x] File upload reads .py/.java/.js/.ts/.c/.cpp/.cs
- [x] Analyze button disabled during analysis
- [x] Spinner shown during AI call
- [x] Rate-limit error shown clearly (429 case)
- [x] Review result panel appears after success
- [x] Diff viewer toggle works (Show Diff / Show Editor)

### History Page
- [x] Skeleton cards shown during loading
- [x] Empty state shown when no reviews
- [x] Filter bar: language, risk level, min score
- [x] "No results" empty state when filter returns nothing
- [x] Result count shown above list
- [x] Delete confirmation dialog shown
- [x] Deleted items disappear immediately

### Review Details Page
- [x] Original code shown in Monaco (read-only)
- [x] ReviewResult component renders all sections
- [x] Advanced metrics tiles shown (Security, Maintainability, Complexity, Time)
- [x] Export JSON and Download PDF buttons functional
- [x] Diff viewer toggles between editor and side-by-side diff

---

## Security Issues Identified & Fixed

| Issue | Fix Applied |
|---|---|
| Passwords returned in API responses | `password_hash` never included in any response |
| JWT tokens never expire context | Expiry set via `ACCESS_TOKEN_EXPIRE_MINUTES` |
| OpenRouter API key in frontend | Key stored in backend `.env` only |
| No rate limiting on AI endpoint | `slowapi` 5/min per IP limit added |
| Arbitrary review access by ID | `user_id` ownership check in `get_review_by_id()` |
| Unhandled exceptions leak stack traces | Global `exception_handler` added to `main.py` |
| SQL injection via ORM | SQLAlchemy ORM parameterizes all queries |
| No input validation | Pydantic field validators on all schemas |
| CORS too permissive | Origins locked to specific frontend domains |

---

## Performance Issues Identified & Fixed

| Issue | Fix Applied |
|---|---|
| No DB index on `email` | `index=True` on `User.email` column |
| `review_result` JSON stored raw | PostgreSQL `JSON` column type used natively |
| Synchronous AI call blocking | `httpx.AsyncClient` used correctly with `async def` |
| No connection pooling config | SQLAlchemy default pool used (upgrade: add `pool_size`) |
| Large code payloads to AI | Max source_code length capped at 50,000 chars |

---

## Run Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

## Run Seed Script

```bash
cd backend
python -m scripts.seed_data
```

## Demo Credentials (after seeding)

| User | Email | Password | Role |
|---|---|---|---|
| Periyasamy N | periyasamy@test.com | password123 | **Admin** |
| Alice Dev | alice@test.com | password123 | User |
| Bob Engineer | bob@test.com | password123 | User |
| Carol Senior | carol@test.com | password123 | User |
| Dave Trainee | dave@test.com | password123 | User |
