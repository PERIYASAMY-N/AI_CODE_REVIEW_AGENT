from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Any

class DashboardStats(BaseModel):
    total_reviews: int
    average_score: int
    high_risk_reviews: int
    medium_risk_reviews: int
    low_risk_reviews: int

class HistoryListItem(BaseModel):
    id: int
    language: str
    overall_score: int
    risk_level: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class HistoryListResponse(BaseModel):
    success: bool
    reviews: List[HistoryListItem]

class ReviewDetailResponse(BaseModel):
    id: int
    language: str
    source_code: str
    review_result: Dict[str, Any]
    overall_score: int
    risk_level: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
