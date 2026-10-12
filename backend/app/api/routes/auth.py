"""
Authentication & Session Routes
AI Career Preparation Agent
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ...db.database import get_db
from ...db.models import User, Profile, ReminderPreference
from ...schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from ...schemas.profile import UserResponse
from ...core.security import hash_password, verify_password, create_access_token, revoke_token
from ..deps import get_current_user, get_token_from_header

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new candidate with verified password hashing.
    Generates a secure bearer token upon successful registration.
    """
    clean_email = request.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(request.password)
    target_role = request.target_role or "Machine Learning Engineer"

    new_user = User(
        id=user_id,
        email=clean_email,
        name=request.name.strip(),
        hashed_password=hashed_pwd,
        role=target_role,
        target_role=target_role,
        xp=0,
        level=1,
        streak=0,
        longest_streak=0
    )
    db.add(new_user)

    new_profile = Profile(
        user_id=user_id,
        bio=f"Aspiring {target_role} actively preparing for technical and behavioral interview loops.",
        target_company="Top Tech & AI Enterprises",
        experience_level="Entry to Mid Level",
        resume_headline=target_role,
        feedback_language="en"
    )
    db.add(new_profile)

    new_reminder = ReminderPreference(
        user_id=user_id,
        enabled=False,
        email=clean_email,
        preferred_time="19:00",
        timezone="Asia/Kolkata",
        target_role=target_role
    )
    db.add(new_reminder)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    token = create_access_token({"sub": new_user.id, "email": new_user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
        is_demo=False
    )


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates candidate credentials against stored password hash.
    Rejects invalid credentials and issues signed bearer token on success.
    """
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token({"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        is_demo=False
    )


@router.post("/demo-login", response_model=TokenResponse)
def login_as_demo(
    db: Session = Depends(get_db)
):
    """
    Fast-track demonstration authentication.
    Issues a genuine signed token for the standard demo candidate sandbox.
    """
    DEMO_USER_ID = "user-001"
    user = db.query(User).filter(User.id == DEMO_USER_ID).first()

    if not user:
        # Seed default demo user if not present
        user = User(
            id=DEMO_USER_ID,
            email="candidate@example.com",
            name="Alex Rivera",
            hashed_password=hash_password("DemoCandidate123!"),
            role="Machine Learning Engineer",
            target_role="Machine Learning Engineer",
            xp=0,
            level=1,
            streak=0,
            longest_streak=0
        )
        db.add(user)
        profile = Profile(
            user_id=DEMO_USER_ID,
            bio="Demonstration profile for exploring mock interviews, radar charts, and ATS scanning.",
            target_company="AI Enterprises",
            experience_level="Entry to Mid Level",
            resume_headline="Machine Learning & Software Engineer"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "is_demo": True})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        is_demo=True
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieves identity of the currently authenticated token bearer."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(
    request: Request,
    authorization: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invalidates the candidate's active session token on the server.
    Revoked tokens are recorded in the RevokedToken blocklist and immediately rejected.
    """
    token = get_token_from_header(authorization)
    if not token:
        token = request.query_params.get("token")

    if token:
        revoke_token(token, db, current_user.id)

    return {"message": "Successfully logged out. Session token has been revoked.", "user_id": current_user.id}
