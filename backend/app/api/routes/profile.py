"""
Profile & User Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User, Profile
from ...schemas.profile import UserResponse, ProfileResponse, CandidateFullProfileResponse, ProfileUpdate
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/profile", tags=["Profile & Identity"])


@router.get("", response_model=CandidateFullProfileResponse)
def get_candidate_profile(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full candidate profile including academic and career details.
    Guarantees user identity from verified session token, strictly preventing unauthorized cross-user access.
    """
    effective_id = verify_user_ownership(user_id, current_user)

    user = db.query(User).filter(User.id == effective_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate account '{effective_id}' was not found. Please register or sign in."
        )

    profile = db.query(Profile).filter(Profile.user_id == effective_id).first()
    return CandidateFullProfileResponse(
        user=UserResponse.model_validate(user),
        profile=ProfileResponse.model_validate(profile) if profile else None
    )


@router.put("", response_model=ProfileResponse)
def update_candidate_profile(
    update_data: ProfileUpdate,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates candidate career preferences, target role, and biography.
    Requires verified authentication and strict tenant ownership.
    """
    effective_id = verify_user_ownership(user_id, current_user)

    user = db.query(User).filter(User.id == effective_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate account '{effective_id}' was not found."
        )

    if update_data.name is not None:
        user.name = update_data.name
    if update_data.target_role is not None:
        user.target_role = update_data.target_role
        if update_data.role is None:
            user.role = update_data.target_role
    if update_data.role is not None:
        user.role = update_data.role
        if update_data.target_role is None:
            user.target_role = update_data.role

    profile = db.query(Profile).filter(Profile.user_id == effective_id).first()
    if not profile:
        profile = Profile(user_id=effective_id)
        db.add(profile)

    if update_data.bio is not None:
        profile.bio = update_data.bio
    if update_data.target_company is not None:
        profile.target_company = update_data.target_company
    if update_data.experience_level is not None:
        profile.experience_level = update_data.experience_level
    if update_data.resume_headline is not None:
        profile.resume_headline = update_data.resume_headline
    if update_data.github_url is not None:
        profile.github_url = update_data.github_url
    if update_data.linkedin_url is not None:
        profile.linkedin_url = update_data.linkedin_url
    if update_data.feedback_language is not None:
        from ...services.ai.languages import normalize_feedback_language
        profile.feedback_language = normalize_feedback_language(update_data.feedback_language)

    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)
