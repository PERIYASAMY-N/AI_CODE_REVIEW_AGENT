# Deployment Instructions for AI Code Review Agent

## 1. Backend Deployment (Render)

We are using [Render](https://render.com) since they natively support PostgreSQL and Python out-of-the-box leveraging the included `render.yaml` configuration.

### Steps
1. Create a GitHub/GitLab repository and push the entire `CODE_REVIEW_AGENT` source code to it.
2. Log into Render and click **Blueprints** -> **New Blueprint Instance**.
3. Re-verify Render access to your repository.
4. Render will automatically detect `render.yaml` in the root folder.
5. It will automatically provision two services:
   - `ai-code-review-db` (PostgreSQL Database)
   - `ai-code-review-backend` (FastAPI Server)
6. During creation, Render will prompt you or ask you to configure external environment variables marked with `sync: false`. Ensure you configure:
   - `OPENROUTER_API_KEY`: Your real DeepSeek key from OpenRouter.
   - `FRONTEND_URL`: Leave blank initially, you will come back and fill this out once Vercel gives you your frontend URL!

*Wait for Render to build the environment, run database migrations safely using Alembic, and spin up Uvicorn! Keep track of the `ai-code-review-backend` output URL (e.g., `https://ai-code-review-backend.onrender.com`).*

---

## 2. Frontend Deployment (Vercel)

Vercel is the ultimate hosting architecture for Vite-powered React SPAs. We have included `vercel.json` natively resolving standard client-side router fallback rules.

### Steps
1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository. 
3. Very carefully expand **"Framework Preset"** and ensure **Vite** is set.
4. **CRITICAL STEP**: The "Root Directory" must intuitively be set to `frontend`. Since the frontend is cleanly isolated, click **Edit** right next to Root Directory and select the `frontend` folder!
5. Expand the **Environment Variables** section. Add the API URL exported by Render:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://ai-code-review-backend.onrender.com/api/v1` (replace with your exact real Render URL)
6. **Click Deploy**. 

*Wait maximum 45 seconds for Vercel to cache and build your React application! Note the deployed frontend URL link (e.g., `https://ai-code-review.vercel.app`).*

---

## 3. Link Backend to Frontend (CORS Resolution)

To ensure high-end production security, your backend will block queries that do not come from your verified Vite application UI.

1. Head back to your **Render Dashboard** -> **ai-code-review-backend** -> **Environment**.
2. Find or Add the `FRONTEND_URL` variable.
3. Paste the Vercel app link exactly (e.g., `https://ai-code-review.vercel.app` — no trailing slash).
4. Save and trigger a manual redeploy in Render if it doesn't auto-deploy!

Congratulations! Your AI Agent is officially running globally.
