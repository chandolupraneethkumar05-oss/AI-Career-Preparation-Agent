"""
Activity Tracking Routes
AI Career Preparation Agent
"""

from typing import Optional
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
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/activities", tags=["Activities & Streaks"])


@router.get("", response_model=ActivityListResponse)
def list_activities(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches candidate activity history and verified streak metrics."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    user = db.query(User).filter(User.id == effective_user_id).first()
    if not user:
        return ActivityListResponse(
            activities=[],
            total_count=0,
            current_streak=0,
            longest_streak=0,
            practiced_today=False
        )

    activities = get_user_activities(db, user_id=effective_user_id, limit=limit)
    current_streak, longest_streak = calculate_streaks(db, effective_user_id)
    practiced = has_practiced_today(db, effective_user_id)

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
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logs a verified preparation activity and awards canonical XP."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        activity = record_activity(db, user_id=effective_user_id, data=activity_in)
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
