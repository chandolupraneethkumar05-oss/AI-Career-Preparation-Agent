"""
Interview Experience & Question Repository Routes
"""

import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.experience import (
    InterviewExperienceCreate,
    InterviewExperienceUpdate,
    InterviewExperienceResponse,
    ExperienceQuestionResponse,
    ExperienceModerateRequest,
    PIIScanRequest,
    PIIScanResponse
)
from ...services.experience_service import (
    create_experience,
    get_approved_experiences,
    get_user_experiences,
    get_experience_by_id,
    update_experience,
    delete_experience,
    moderate_experience,
    get_approved_questions
)
from ...services.pii_detection_service import scan_submission_pii, scan_text_pii
from ..deps import get_current_user, get_optional_current_user, verify_user_ownership

logger = logging.getLogger("experiences_router")

router = APIRouter(prefix="/experiences", tags=["Interview Experiences & Questions"])


@router.post("", response_model=InterviewExperienceResponse)
def submit_interview_experience(
    payload: InterviewExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a new candidate interview experience with real interview questions.
    Scans for PII and sets moderation status to PENDING.
    Assigns ownership strictly to verified authenticated user.
    """
    try:
        return create_experience(db=db, user_id=current_user.id, payload=payload)
    except Exception as exc:
        logger.error(f"Error submitting experience: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=Dict[str, Any])
def browse_approved_experiences(
    role: Optional[str] = Query(None, description="Filter by role title"),
    round_type: Optional[str] = Query(None, description="Filter by round type"),
    topic: Optional[str] = Query(None, description="Filter by skill or topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search keyword"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves approved interview experiences for preparation browsing.
    Strictly filters by moderation_status == 'APPROVED'.
    Derives caller ownership only from verified token if present.
    """
    caller_id = current_user.id if current_user else None
    return get_approved_experiences(
        db=db,
        current_user_id=caller_id,
        role=role,
        round_type=round_type,
        topic=topic,
        difficulty=difficulty,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/questions", response_model=Dict[str, Any])
def browse_approved_questions(
    role: Optional[str] = Query(None, description="Filter by role"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    round_type: Optional[str] = Query(None, description="Filter by round"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search term in question text"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Retrieves individual questions from approved real interview experiences.
    """
    return get_approved_questions(
        db=db,
        role=role,
        topic=topic,
        round_type=round_type,
        difficulty=difficulty,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/me", response_model=List[InterviewExperienceResponse])
def get_my_experiences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all interview experiences submitted by the current candidate
    (including PENDING, APPROVED, and REJECTED).
    Requires authentication; strictly derived from verified user.
    """
    return get_user_experiences(db=db, user_id=current_user.id)


@router.post("/scan-pii", response_model=PIIScanResponse)
def scan_content_pii(
    payload: PIIScanRequest
):
    """
    Pre-flight privacy scan endpoint for frontend forms.
    Detects emails, phone numbers, secret tokens, and sensitive URLs before saving.
    """
    if payload.experience_data:
        res = scan_submission_pii(payload.experience_data)
        return PIIScanResponse(
            is_clean=res["is_clean"],
            pii_scan_status=res["pii_scan_status"],
            detected_categories=res["detected_categories"],
            flagged_snippets=res["flagged_snippets"]
        )
    elif payload.text:
        is_clean, cats, snips = scan_text_pii(payload.text)
        return PIIScanResponse(
            is_clean=is_clean,
            pii_scan_status="CLEAN" if is_clean else "FLAGGED",
            detected_categories=cats,
            flagged_snippets=snips
        )
    return PIIScanResponse(
        is_clean=True,
        pii_scan_status="CLEAN",
        detected_categories=[],
        flagged_snippets=[]
    )


@router.get("/{experience_id}", response_model=InterviewExperienceResponse)
def get_experience_detail(
    experience_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of an experience.
    Only accessible if APPROVED or requested by author.
    """
    caller_id = current_user.id if current_user else None
    exp = get_experience_by_id(db=db, experience_id=experience_id, current_user_id=caller_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Interview experience not found or not published.")
    return exp


@router.put("/{experience_id}", response_model=InterviewExperienceResponse)
def update_user_experience(
    experience_id: str,
    payload: InterviewExperienceUpdate,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates an existing interview experience.
    Enforces author ownership, re-runs PII scan, and resets status to PENDING.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        updated = update_experience(
            db=db,
            experience_id=experience_id,
            user_id=effective_user_id,
            payload=payload
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Interview experience not found")
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as exc:
        logger.error(f"Error updating experience: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{experience_id}")
def delete_user_experience(
    experience_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an interview experience. Enforces author ownership.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        success = delete_experience(db=db, experience_id=experience_id, user_id=effective_user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Interview experience not found")
        return {"success": True, "message": "Interview experience deleted successfully."}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as exc:
        logger.error(f"Error deleting experience: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))


@router.patch("/{experience_id}/moderate", response_model=InterviewExperienceResponse)
def moderate_candidate_experience(
    experience_id: str,
    payload: ExperienceModerateRequest,
    db: Session = Depends(get_db)
):
    """
    Moderation endpoint to approve, reject, or reset an experience.
    Only APPROVED experiences are retrievable in public browsing and RAG.
    """
    try:
        res = moderate_experience(db=db, experience_id=experience_id, payload=payload)
        if not res:
            raise HTTPException(status_code=404, detail="Interview experience not found")
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        logger.error(f"Error moderating experience: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
