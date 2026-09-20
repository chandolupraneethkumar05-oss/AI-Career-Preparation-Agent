"""
Activity & Streak Calculation Service
AI Career Preparation Agent
"""

import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import Activity, User
from ..schemas.activity import ActivityCreate


ACTIVITY_TYPES = {
    "INTERVIEW_COMPLETED": "interview_completed",
    "CHALLENGE_COMPLETED": "challenge_completed",
    "RESUME_ANALYZED": "resume_analyzed",
    "ATS_SCANNED": "ats_scanned",
    "SKILL_ACTIVITY_COMPLETED": "skill_activity_completed",
    "SKILL_PRACTICE": "skill_practice",
    "DIAGNOSTIC_COMPLETED": "diagnostic_completed",
    "SKILL_ARENA_COMPLETED": "skill_arena_completed"
}

ACTIVITY_XP = {
    "interview_completed": 100,
    "challenge_completed": 50,
    "resume_analyzed": 35,
    "ats_scanned": 35,
    "skill_activity_completed": 25,
    "skill_practice": 25,
    "diagnostic_completed": 50,
    "skill_arena_completed": 40,
}


def utc_now():
    return datetime.now(timezone.utc)


def calculate_streaks(db: Session, user_id: str) -> tuple[int, int]:
    """
    Calculates current consecutive day streak and longest streak deterministically
    by analyzing unique calendar dates of verified activities.
    """
    activities = (
        db.query(Activity.timestamp)
        .filter(Activity.user_id == user_id)
        .order_by(desc(Activity.timestamp))
        .all()
    )

    if not activities:
        return 0, 0

    # Extract sorted unique calendar dates (YYYY-MM-DD)
    unique_dates = sorted(
        list({a[0].date() for a in activities}),
        reverse=True
    )

    today = utc_now().date()
    yesterday = today - timedelta(days=1)

    # Current streak calculation
    current_streak = 0
    if unique_dates and (unique_dates[0] == today or unique_dates[0] == yesterday):
        check_date = unique_dates[0]
        for d in unique_dates:
            if d == check_date:
                current_streak += 1
                check_date = check_date - timedelta(days=1)
            elif d < check_date:
                break

    # Longest streak calculation
    longest_streak = current_streak
    temp_streak = 0
    if unique_dates:
        prev_date = None
        for d in sorted(unique_dates):
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
            prev_date = d

    return current_streak, longest_streak


def has_practiced_today(db: Session, user_id: str) -> bool:
    """Returns True if user has completed any activity on today's calendar date."""
    today = utc_now().date()
    count = (
        db.query(Activity.id)
        .filter(Activity.user_id == user_id)
        .filter(Activity.timestamp >= datetime(today.year, today.month, today.day, tzinfo=timezone.utc))
        .count()
    )
    return count > 0


def record_activity(db: Session, user_id: str, data: ActivityCreate) -> Activity:
    """
    Records an immutable, verified preparation activity.
    Enforces de-duplication within 2.5s and updates user XP, Level, and Streak.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    now = utc_now()

    # De-duplication check: if identical activity occurred in last 2.5 seconds, return existing
    cutoff = now - timedelta(seconds=2.5)
    recent = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .filter(Activity.type == data.type)
        .filter(Activity.timestamp >= cutoff)
        .first()
    )
    if recent:
        return recent

    # Resolve canonical XP reward
    xp_to_award = data.xp_earned if data.xp_earned is not None else ACTIVITY_XP.get(data.type, 25)

    # Activity ID
    activity_id = data.id or f"act-{int(now.timestamp() * 1000)}"

    activity = Activity(
        id=activity_id,
        user_id=user_id,
        type=data.type,
        related_module=data.related_module or data.type.split("_")[0],
        title=data.title,
        xp_earned=xp_to_award,
        timestamp=now,
        details_json=json.dumps(data.details or {})
    )
    db.add(activity)

    # Atomically update user gamification stats
    user.xp += xp_to_award
    user.level = max(1, (user.xp // 200) + 1)

    # Recalculate streak
    db.flush()
    current_streak, longest_streak = calculate_streaks(db, user_id)
    user.streak = current_streak
    user.longest_streak = max(user.longest_streak, longest_streak)

    db.commit()
    db.refresh(activity)
    return activity


def get_user_activities(db: Session, user_id: str, limit: int = 50) -> List[Activity]:
    """Fetches recent activities for the candidate."""
    return (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(desc(Activity.timestamp))
        .limit(limit)
        .all()
    )
