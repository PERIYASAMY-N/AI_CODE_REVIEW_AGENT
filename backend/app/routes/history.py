from typing import Optional, cast
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.history import HistoryListResponse, ReviewDetailResponse, DashboardStats
from app.services.review_service import get_user_reviews, get_review_by_id, delete_review, get_dashboard_stats

history_router = APIRouter(tags=["History"])
dashboard_router = APIRouter(tags=["Dashboard"])

@history_router.get("", response_model=HistoryListResponse)
def get_user_history(
    language: Optional[str] = None,
    risk_level: Optional[str] = None,
    min_score: Optional[int] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Get all reviews of the currently authenticated user with optional filters
    """
    reviews = get_user_reviews(db, cast(int, current_user.id), language, risk_level, min_score)
    return {
        "success": True,
        "reviews": reviews
    }

@history_router.get("/{review_id}", response_model=ReviewDetailResponse)
def get_single_review(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the full details of a specific review
    """
    # Authorization implicitly handled in service layer checks (comparing user_id)
    review = get_review_by_id(db, cast(int, current_user.id), review_id)
    return review

@history_router.delete("/{review_id}")
def remove_review(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete a specific review entirely
    """
    # Authorization implicitly handled in service layer checks (comparing user_id)
    delete_review(db, cast(int, current_user.id), review_id)
    return {
        "success": True,
        "message": "Review deleted successfully"
    }

@dashboard_router.get("/stats", response_model=DashboardStats)
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Return generic dashboard count stats for the authenticated user
    """
    return get_dashboard_stats(db, cast(int, current_user.id))
