"""
Dashboard Progress & Achievements Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.recommendation import DashboardProgressResponse
from ...services.progress_service import get_dashboard_progress, get_user_achievements
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/progress", tags=["Progress & Dashboard"])


@router.get("", response_model=DashboardProgressResponse)
@router.get("/", response_model=DashboardProgressResponse)
@router.get("/dashboard", response_model=DashboardProgressResponse)
def get_dashboard_metrics(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns unified dashboard metrics synthesizing XP, streak, readiness,
    radar profile, and explainable next-best-action.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_dashboard_progress(db, user_id=effective_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/achievements")
def get_candidate_achievements(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluates all milestone badges against verified activities and interviews."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    return get_user_achievements(db, user_id=effective_user_id)
