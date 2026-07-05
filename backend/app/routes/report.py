from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json
from typing import cast

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.review_service import get_review_by_id
from app.services.report_service import generate_pdf_report, export_json_report

router = APIRouter(tags=["Reports"])

@router.get("/pdf/{review_id}")
def get_pdf_report(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Download AI review report as PDF
    """
    review = get_review_by_id(db, cast(int, current_user.id), review_id)
    pdf_bytes = generate_pdf_report(review)
    
    headers = {
        'Content-Disposition': f'attachment; filename="code_review_{review_id}.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@router.get("/json/{review_id}")
def get_json_report(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Download AI review report as robust JSON
    """
    review = get_review_by_id(db, cast(int, current_user.id), review_id)
    json_data = export_json_report(review)
    
    headers = {
        'Content-Disposition': f'attachment; filename="code_review_{review_id}.json"'
    }
    return JSONResponse(content=json_data, headers=headers)
