"""
Career Journey and Career Readiness API Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.career_journey import CareerJourneyResponse, ReadinessAssessment
from ...services.career_journey_service import get_career_journey_data, get_readiness_assessment_only
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/career-journey", tags=["Career Journey & Readiness"])


@router.get("", response_model=CareerJourneyResponse)
@router.get("/", response_model=CareerJourneyResponse)
def get_candidate_career_journey(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the candidate's authentic, evidence-based Career Journey.
    Synthesizes the 14-milestone lifecycle, transparent readiness band,
    current focus, and next best action without fabricating metrics.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_career_journey_data(db, user_id=effective_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error processing career journey: {str(exc)}")


@router.get("/readiness", response_model=ReadinessAssessment)
def get_candidate_readiness_assessment(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the multi-dimensional Career Readiness Assessment breakdown
    evaluating Resume & ATS, Technical Depth, Coding, Mock Interviews, and Articulation.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_readiness_assessment_only(db, user_id=effective_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error evaluating readiness: {str(exc)}")
