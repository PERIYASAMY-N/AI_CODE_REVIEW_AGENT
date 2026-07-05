from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.review import Review

router = APIRouter(tags=["Admin"])

@router.get("/stats")
def get_admin_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")

    total_users = db.query(User).count()
    total_reviews = db.query(Review).count()
    
    # Get most used language safely
    lng = db.query(Review.language, func.count(Review.id)).group_by(Review.language).order_by(func.count(Review.id).desc()).first()
    most_used_language = lng[0] if lng else "N/A"
    
    # Aggregate avg score safely without float conversion breaks
    avg_score_scalar = db.query(func.avg(Review.overall_score)).scalar()
    avg_score = int(round(avg_score_scalar)) if avg_score_scalar else 0

    return {
        "total_users": total_users,
        "total_reviews": total_reviews,
        "most_used_language": most_used_language,
        "average_score": avg_score
    }
