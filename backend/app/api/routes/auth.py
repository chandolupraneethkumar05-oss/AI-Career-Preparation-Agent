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
from ...schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from ...schemas.profile import UserResponse
from ...core.security import (
    hash_password,
    verify_password,
    create_access_token,
    revoke_token,
    create_password_reset_token,
    decode_password_reset_token
)
from ...services.email_service import get_email_service
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


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates candidate password recovery.
    Validates candidate presence, creates signed 30-minute JWT token,
    dispatches recovery email, and returns direct reset fallback for local/sandbox ease.
    """
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        return ForgotPasswordResponse(
            success=True,
            message="If an account with this email exists, password recovery instructions have been sent.",
            email=clean_email,
            reset_token=None,
            reset_link=None,
            delivered_via="email"
        )

    # Generate one-time signed reset token (30-minute expiry)
    reset_token = create_password_reset_token(user_id=user.id, email=user.email, expires_minutes=30)
    reset_link = f"/login?reset_token={reset_token}"

    email_svc = get_email_service()
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0F172A; color: #F8FAFC; border-radius: 16px;">
        <h2 style="color: #6366F1; margin-bottom: 8px;">TalentPath AI Career Agent</h2>
        <h3 style="color: #F8FAFC; margin-top: 0;">Password Reset Instructions</h3>
        <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello {user.name}, we received a request to reset your password. Use the secure token below within the next 30 minutes to set a new password.</p>
        <div style="margin: 24px 0; background: #1E293B; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; color: #38BDF8;">
            {reset_token}
        </div>
        <p style="color: #64748B; font-size: 12px;">If you did not request this reset, you can safely ignore this email.</p>
    </div>
    """

    email_result = email_svc.send_generic_email(
        recipient_email=user.email,
        subject="Reset Your TalentPath Account Password",
        html_body=html_body,
        plain_text=f"Reset your password with token: {reset_token}"
    )

    return ForgotPasswordResponse(
        success=True,
        message="Password recovery instructions have been dispatched. Use your reset token or link to set a new password.",
        email=user.email,
        reset_token=reset_token,
        reset_link=reset_link,
        delivered_via=email_result.get("mode", "email")
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Completes password recovery by validating signed token and updating password hash.
    """
    claims = decode_password_reset_token(request.token, db=db)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token is invalid, expired, or has already been used. Please request a new one."
        )

    user_id = claims.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate account associated with this reset token was not found."
        )

    # Update hashed password
    user.hashed_password = hash_password(request.new_password)
    # Revoke this reset token so it cannot be replayed
    revoke_token(request.token, db, user.id)
    db.commit()

    return ResetPasswordResponse(
        success=True,
        message="Your password has been successfully updated. You may now sign in with your new password."
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
