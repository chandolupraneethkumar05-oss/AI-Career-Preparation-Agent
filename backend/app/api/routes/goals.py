"""
Weekly Goals & Streak Recovery API Routes
AI Career Preparation Agent
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
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

router = APIRouter(prefix="/goals", tags=["Weekly Goals & Streaks"])


@router.get("/weekly", response_model=WeeklyGoalResponse)
def get_current_weekly_goals(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves the candidate's active goals for the current week, including
    completion tracking and streak recovery eligibility.
    """
    try:
        return get_or_create_weekly_goal(db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error retrieving goals: {str(exc)}")


@router.put("/weekly", response_model=WeeklyGoalResponse)
def update_current_weekly_goals(
    updates: WeeklyGoalUpdate,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Modifies the candidate's targets for interviews, coding drills, or daily practice.
    """
    try:
        return update_weekly_goal(db, user_id=user_id, updates=updates)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error updating goals: {str(exc)}")


@router.post("/streak-recovery", response_model=StreakRecoveryResponse)
def recover_candidate_streak(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Applies the 30-day streak recovery mechanism to protect student learning momentum.
    Strictly limited to 1 execution per 30-day window.
    """
    try:
        return attempt_streak_recovery(db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error applying streak recovery: {str(exc)}")
