from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth_service import register_user, login_user
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Auth"])

@router.post("/register", status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    register_user(db, request)
    return {"success": True, "message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and obtain a JWT access token."""
    access_token = login_user(db, request)
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at,
    }

