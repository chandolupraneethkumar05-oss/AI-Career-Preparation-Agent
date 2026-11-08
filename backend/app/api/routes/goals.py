"""
Weekly Goals & Streak Recovery API Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.goals import (
    WeeklyGoalResponse,
    WeeklyGoalUpdate,
    StreakRecoveryResponse
)
from ...services.goal_service import (
    get_or_create_weekly_goal,
    update_weekly_goal,
    attempt_streak_recovery
)
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/goals", tags=["Weekly Goals & Streaks"])


@router.get("/weekly", response_model=WeeklyGoalResponse)
def get_current_weekly_goals(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the candidate's active goals for the current week, including
    completion tracking and streak recovery eligibility.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_or_create_weekly_goal(db, user_id=effective_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error retrieving goals: {str(exc)}")


@router.put("/weekly", response_model=WeeklyGoalResponse)
def update_current_weekly_goals(
    updates: WeeklyGoalUpdate,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Modifies the candidate's targets for interviews, coding drills, or daily practice.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return update_weekly_goal(db, user_id=effective_user_id, updates=updates)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error updating goals: {str(exc)}")


@router.post("/streak-recovery", response_model=StreakRecoveryResponse)
def recover_candidate_streak(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Applies the 30-day streak recovery mechanism to protect student learning momentum.
    Strictly limited to 1 execution per 30-day window.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return attempt_streak_recovery(db, user_id=effective_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error applying streak recovery: {str(exc)}")
