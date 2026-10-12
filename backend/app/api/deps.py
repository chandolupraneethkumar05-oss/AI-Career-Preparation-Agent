"""
FastAPI Request Dependencies & Security Guards
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import User
from ..core.security import decode_access_token


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extracts raw bearer token from the Authorization header."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def get_optional_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Attempts to resolve authenticated user from Bearer token.
    Validates token signature, expiration, and server-side revocation against database.
    Returns User if valid token is provided, otherwise None.
    """
    token = get_token_from_header(authorization)
    if not token:
        token = request.query_params.get("token")

    if not token:
        return None

    payload = decode_access_token(token, db=db)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Guarantees user is genuinely authenticated with a verified, unrevoked bearer token.
    Raises HTTP 401 if token is missing, invalid, expired, or revoked.
    """
    token = get_token_from_header(authorization)
    if not token:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token, db=db)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def verify_user_ownership(
    requested_user_id: Optional[str],
    current_user: Optional[User]
) -> str:
    """
    Enforces tenant and record ownership.
    Ensures a candidate can never access, mutate, or delete another candidate's records.
    Returns effective verified user_id.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to perform this action.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    placeholder_ids = {None, "", "default", "usr_candidate", "user-001", "null", "undefined"}
    if requested_user_id in placeholder_ids or requested_user_id == current_user.id:
        return current_user.id

    if requested_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access resources belonging to another candidate."
        )
    return current_user.id
