"""
Weekly Goals & Meaningful Gamification Service
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import (
    User,
    WeeklyGoal,
    Interview,
    SkillArenaAttempt,
    Challenge,
    Activity
)
from ..schemas.goals import (
    WeeklyGoalResponse,
    WeeklyGoalUpdate,
    StreakRecoveryResponse
)
from .activity_service import calculate_streaks


def utc_now():
    return datetime.now(timezone.utc)


def _to_utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _get_current_week_start() -> datetime:
    """Returns Monday 00:00:00 UTC for current week."""
    now = utc_now()
    return (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def get_or_create_weekly_goal(db: Session, user_id: str) -> WeeklyGoalResponse:
    """
    Retrieves or initializes the candidate's career preparation commitments for current week.
    Synchronizes real-time completion counts from immutable database records.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    week_start = _get_current_week_start()
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    goal = (
        db.query(WeeklyGoal)
        .filter(
            WeeklyGoal.user_id == user_id,
            WeeklyGoal.week_start_date == week_start
        )
        .first()
    )

    if not goal:
        goal = WeeklyGoal(
            id=f"wg-{int(week_start.timestamp())}-{user_id}",
            user_id=user_id,
            week_start_date=week_start,
            target_interviews=2,
            target_coding_drills=3,
            target_daily_drills=5,
            focus_skill="Machine Learning & System Design",
            interviews_completed=0,
            coding_completed=0,
            daily_drills_completed=0,
            status="active"
        )
        db.add(goal)
        db.flush()

    # Synchronize actual completed counts for this week
    interviews_count = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.completed_at >= week_start,
            Interview.completed_at <= week_end
        )
        .count()
    )

    coding_count = (
        db.query(SkillArenaAttempt)
        .filter(
            SkillArenaAttempt.user_id == user_id,
            SkillArenaAttempt.created_at >= week_start,
            SkillArenaAttempt.created_at <= week_end,
            SkillArenaAttempt.correctness == True
        )
        .count()
    )

    daily_count = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.completed == True,
            Challenge.submitted_at >= week_start,
            Challenge.submitted_at <= week_end
        )
        .count()
    )

    goal.interviews_completed = interviews_count
    goal.coding_completed = coding_count
    goal.daily_drills_completed = daily_count

    # Evaluate completion status
    if (
        goal.interviews_completed >= goal.target_interviews
        and goal.coding_completed >= goal.target_coding_drills
        and goal.daily_drills_completed >= goal.target_daily_drills
    ):
        goal.status = "completed"
    else:
        goal.status = "active"

    db.commit()
    db.refresh(goal)

    # Check streak recovery eligibility (1 recovery per 30-day rolling window)
    recovery_available = True
    recovery_used_at_aware = _to_utc_aware(user.streak_recovery_used_at)
    if recovery_used_at_aware:
        days_since = (utc_now() - recovery_used_at_aware).days
        if days_since < 30:
            recovery_available = False

    current_streak, longest_streak = calculate_streaks(db, user_id)

    return WeeklyGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        week_start_date=goal.week_start_date.strftime("%Y-%m-%d"),
        target_interviews=goal.target_interviews,
        target_coding_drills=goal.target_coding_drills,
        target_daily_drills=goal.target_daily_drills,
        focus_skill=goal.focus_skill,
        interviews_completed=goal.interviews_completed,
        coding_completed=goal.coding_completed,
        daily_drills_completed=goal.daily_drills_completed,
        status=goal.status,
        streak_current=current_streak,
        streak_longest=longest_streak,
        streak_recovery_available=recovery_available,
        streak_recovery_used_at=recovery_used_at_aware.isoformat() if recovery_used_at_aware else None
    )


def update_weekly_goal(db: Session, user_id: str, updates: WeeklyGoalUpdate) -> WeeklyGoalResponse:
    """Updates the candidate's target commitments for current week."""
    week_start = _get_current_week_start()
    goal = (
        db.query(WeeklyGoal)
        .filter(
            WeeklyGoal.user_id == user_id,
            WeeklyGoal.week_start_date == week_start
        )
        .first()
    )
    if not goal:
        get_or_create_weekly_goal(db, user_id)
        goal = db.query(WeeklyGoal).filter(
            WeeklyGoal.user_id == user_id,
            WeeklyGoal.week_start_date == week_start
        ).first()

    if updates.target_interviews is not None:
        goal.target_interviews = max(1, updates.target_interviews)
    if updates.target_coding_drills is not None:
        goal.target_coding_drills = max(1, updates.target_coding_drills)
    if updates.target_daily_drills is not None:
        goal.target_daily_drills = max(1, updates.target_daily_drills)
    if updates.focus_skill is not None:
        goal.focus_skill = updates.focus_skill.strip()

    db.commit()
    db.refresh(goal)
    return get_or_create_weekly_goal(db, user_id)


def attempt_streak_recovery(db: Session, user_id: str) -> StreakRecoveryResponse:
    """
    Applies streak recovery to protect student momentum.
    Strictly limited to 1 recovery per 30-day rolling window.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    now = utc_now()
    recovery_used_at_aware = _to_utc_aware(user.streak_recovery_used_at)
    if recovery_used_at_aware:
        days_since = (now - recovery_used_at_aware).days
        if days_since < 30:
            remaining = 30 - days_since
            return StreakRecoveryResponse(
                success=False,
                message=f"Streak recovery can only be used once every 30 days. Available in {remaining} day(s).",
                new_streak=user.streak,
                recovery_used_at=recovery_used_at_aware.isoformat()
            )

    # Apply recovery
    new_streak = max(1, user.streak + 1)
    user.streak = new_streak
    user.longest_streak = max(user.longest_streak, new_streak)
    user.streak_recovery_used_at = now

    recovery_activity = Activity(
        id=f"act-recov-{int(now.timestamp() * 1000)}",
        user_id=user_id,
        type="streak_recovered",
        related_module="streak",
        title="Used 30-Day Streak Recovery",
        xp_earned=15,
        timestamp=now,
        details_json="{}"
    )
    db.add(recovery_activity)
    user.xp += 15

    db.commit()

    return StreakRecoveryResponse(
        success=True,
        message="Streak successfully restored! You earned +15 XP. Keep your daily career preparation consistent!",
        new_streak=user.streak,
        recovery_used_at=now.isoformat()
    )
