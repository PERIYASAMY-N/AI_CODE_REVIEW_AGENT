from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import cast
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.review_request import ReviewRequest
from app.services.ai_review_service import review_code
from app.services.review_service import save_review
from app.models.user import User
from app.core.rate_limit import limiter

router = APIRouter(tags=["Code Review"])

@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_code(
    request: Request,
    payload: ReviewRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze source code using OpenRouter AI
    """
    review_result = await review_code(payload)
    
    save_review(
        db=db,
        user_id=cast(int, current_user.id),
        language=payload.language,
        source_code=payload.source_code,
        review_result=review_result,
        overall_score=review_result.get("overall_score", 0),
        risk_level=review_result.get("risk_level", "UNKNOWN")
    )
    
    return {
        "success": True,
        "language": payload.language,
        "bugs": review_result.get("bugs", []),
        "security_issues": review_result.get("security_issues", []),
        "best_practices": review_result.get("best_practices", []),
        "optimizations": review_result.get("optimizations", []),
        "root_cause": review_result.get("root_cause", []),
        "corrected_code": review_result.get("corrected_code", ""),
        "summary": review_result.get("summary", ""),
        "overall_score": review_result.get("overall_score", 0),
        "risk_level": review_result.get("risk_level", "UNKNOWN")
    }
