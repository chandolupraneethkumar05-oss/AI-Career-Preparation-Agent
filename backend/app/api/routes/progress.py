"""
Dashboard Progress & Achievements Routes
AI Career Preparation Agent
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.recommendation import DashboardProgressResponse
from ...services.progress_service import get_dashboard_progress, get_user_achievements

router = APIRouter(prefix="/progress", tags=["Progress & Dashboard"])


@router.get("", response_model=DashboardProgressResponse)
@router.get("/", response_model=DashboardProgressResponse)
@router.get("/dashboard", response_model=DashboardProgressResponse)
def get_dashboard_metrics(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Returns unified dashboard metrics synthesizing XP, streak, readiness,
    radar profile, and explainable next-best-action.
    """
    try:
        return get_dashboard_progress(db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/achievements")
def get_candidate_achievements(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Evaluates all milestone badges against verified activities and interviews."""
    return get_user_achievements(db, user_id=user_id)
