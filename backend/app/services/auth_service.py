from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import timedelta

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger(__name__)

def register_user(db: Session, request: RegisterRequest) -> User:
    try:
        # Check duplicate email
        db_user = db.query(User).filter(User.email == request.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = get_password_hash(request.password)
        
        # Store user
        new_user = User(
            name=request.name,
            email=request.email,
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database IntegrityError during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration failed due to an integrity constraint (email already exists)."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during user registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration. Please try again."
        )

def login_user(db: Session, request: LoginRequest) -> str:
    # Verify email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(request.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return access_token
