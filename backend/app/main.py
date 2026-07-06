import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.config import settings
from app.core.rate_limit import limiter
from app.routes import health, auth, review, history, report, user, admin

# Production logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


from app.core.database import Base, engine
from app.models.user import User
from app.models.review import Review

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} started.")
    # Phase 3: Database Validation - generate tables automatically
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables generated successfully.")
    yield
    logger.info(f"🛑 {settings.PROJECT_NAME} shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="AI-powered code review agent using OpenRouter LLMs.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# Global exception handler — never leak stack traces to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again later."},
    )

# CORS — allow local dev origins + the deployed Render frontend
origins = list(set(filter(None, [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-code-review-agent-1-lrnm.onrender.com",  # production frontend
    settings.FRONTEND_URL,   # override via env var if needed
])))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router,            prefix="/api/v1")
app.include_router(auth.router,              prefix="/api/v1/auth")
app.include_router(review.router,            prefix="/api/v1/review")
app.include_router(history.history_router,   prefix="/api/v1/history")
app.include_router(history.dashboard_router, prefix="/api/v1/dashboard")
app.include_router(report.router,            prefix="/api/v1/report")
app.include_router(user.router,              prefix="/api/v1/users")
app.include_router(admin.router,             prefix="/api/v1/admin")

@app.get("/", tags=["Root"])
def root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API", "version": settings.PROJECT_VERSION, "docs": "/docs"}

