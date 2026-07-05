from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class ReviewBase(BaseModel):
    language: Optional[str] = None
    source_code: Optional[str] = None
    review_result: Optional[Dict[str, Any]] = None
    overall_score: Optional[int] = None
    risk_level: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
