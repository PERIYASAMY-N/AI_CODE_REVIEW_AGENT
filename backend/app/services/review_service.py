from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional

from app.models.review import Review
from app.schemas.history import DashboardStats

def save_review(
    db: Session, 
    user_id: int, 
    language: str, 
    source_code: str, 
    review_result: dict,
    overall_score: int,
    risk_level: str
) -> Review:
    new_review = Review(
        user_id=user_id,
        language=language,
        source_code=source_code,
        review_result=review_result,
        overall_score=overall_score,
        risk_level=risk_level
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

def get_user_reviews(
    db: Session, 
    user_id: int,
    language: Optional[str] = None,
    risk_level: Optional[str] = None,
    min_score: Optional[int] = None
) -> List[Review]:
    query = db.query(Review).filter(Review.user_id == user_id)
    if language:
        query = query.filter(Review.language.ilike(f"%{language}%"))
    if risk_level:
        query = query.filter(Review.risk_level == risk_level)
    if min_score is not None:
        query = query.filter(Review.overall_score >= min_score)
        
    return query.order_by(Review.created_at.desc()).all()

def get_review_by_id(db: Session, user_id: int, review_id: int) -> Review:
    review = db.query(Review).filter(
        Review.id == review_id, 
        Review.user_id == user_id
    ).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Review not found or unauthorized to access it"
        )
        
    return review

def delete_review(db: Session, user_id: int, review_id: int) -> bool:
    review = get_review_by_id(db, user_id, review_id)
    db.delete(review)
    db.commit()
    return True

def get_dashboard_stats(db: Session, user_id: int) -> DashboardStats:
    total_reviews = db.query(Review).filter(Review.user_id == user_id).count()
    
    avg_score_scalar = db.query(func.avg(Review.overall_score)).filter(Review.user_id == user_id).scalar()
    avg_score = int(round(avg_score_scalar)) if avg_score_scalar is not None else 0
    
    high_risk = db.query(Review).filter(Review.user_id == user_id, Review.risk_level == "HIGH").count()
    # If CRITICAL also exists in real scenarios, consider adding them to HIGH or have a separate stat. 
    # The requirement specifically mentions high, medium, low.
    critical_risk = db.query(Review).filter(Review.user_id == user_id, Review.risk_level == "CRITICAL").count()
    
    medium_risk = db.query(Review).filter(Review.user_id == user_id, Review.risk_level == "MEDIUM").count()
    low_risk = db.query(Review).filter(Review.user_id == user_id, Review.risk_level == "LOW").count()
    
    return DashboardStats(
        total_reviews=total_reviews,
        average_score=avg_score,
        high_risk_reviews=high_risk + critical_risk,
        medium_risk_reviews=medium_risk,
        low_risk_reviews=low_risk
    )
