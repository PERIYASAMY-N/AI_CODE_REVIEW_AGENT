from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    """
    Health check endpoint to ensure the core API is running.
    """
    return {
        "success": True,
        "message": f"{settings.PROJECT_NAME} Backend Running",
        "version": settings.PROJECT_VERSION
    }
