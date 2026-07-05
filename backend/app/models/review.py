from datetime import datetime
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=True)
    source_code: Mapped[str] = mapped_column(Text, nullable=True)
    review_result: Mapped[dict] = mapped_column(JSON, nullable=True)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="reviews")
