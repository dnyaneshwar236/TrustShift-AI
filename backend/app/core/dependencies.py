from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> User:
    token = None
    # 1. Check Authorization Bearer header
    if cred and cred.credentials:
        token = cred.credentials
    # 2. Check Cookie fallback
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
        )
    return user

def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
    cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> Optional[User]:
    token = None
    if cred and cred.credentials:
        token = cred.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    return db.query(User).filter(User.id == user_id, User.status == "active").first()


def get_current_rider(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "rider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to registered riders.",
        )
    return current_user

def get_current_manager(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized operations managers.",
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to company system administrators.",
        )
    return current_user
