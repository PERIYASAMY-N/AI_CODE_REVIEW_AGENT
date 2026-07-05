from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.core.security import get_password_hash, verify_password
from app.models.user import User

router = APIRouter(tags=["User Profile"])

class ProfileUpdateParams(BaseModel):
    name: str

class PasswordUpdateParams(BaseModel):
    old_password: str
    new_password: str

@router.put("/me")
def update_profile(params: ProfileUpdateParams, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.name = params.name
    db.commit()
    db.refresh(current_user)
    return {"success": True, "message": "Profile updated successfully"}

@router.put("/me/password")
def change_password(params: PasswordUpdateParams, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(params.old_password, str(current_user.password_hash)):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = get_password_hash(params.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}
