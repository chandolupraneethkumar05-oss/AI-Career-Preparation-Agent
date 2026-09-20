"""
Activity Tracking Routes
AI Career Preparation Agent
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.activity import ActivityCreate, ActivityResponse, ActivityListResponse
from ...services.activity_service import (
    record_activity,
    get_user_activities,
    calculate_streaks,
    has_practiced_today
)

router = APIRouter(prefix="/activities", tags=["Activities & Streaks"])


@router.get("", response_model=ActivityListResponse)
def list_activities(
    user_id: str = Query("user-001", description="Candidate User ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Fetches candidate activity history and verified streak metrics."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")

    activities = get_user_activities(db, user_id=user_id, limit=limit)
    current_streak, longest_streak = calculate_streaks(db, user_id)
    practiced = has_practiced_today(db, user_id)

    activity_items = [
        ActivityResponse(
            id=a.id,
            user_id=a.user_id,
            type=a.type,
            related_module=a.related_module,
            title=a.title,
            xp_earned=a.xp_earned,
            timestamp=a.timestamp,
            details=a.details
        )
        for a in activities
    ]

    return ActivityListResponse(
        activities=activity_items,
        total_count=len(activities),
        current_streak=current_streak,
        longest_streak=longest_streak,
        practiced_today=practiced
    )


@router.post("", response_model=ActivityResponse)
def log_activity(
    activity_in: ActivityCreate,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Logs a verified preparation activity and awards canonical XP."""
    try:
        activity = record_activity(db, user_id=user_id, data=activity_in)
        return ActivityResponse(
            id=activity.id,
            user_id=activity.user_id,
            type=activity.type,
            related_module=activity.related_module,
            title=activity.title,
            xp_earned=activity.xp_earned,
            timestamp=activity.timestamp,
            details=activity.details
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
