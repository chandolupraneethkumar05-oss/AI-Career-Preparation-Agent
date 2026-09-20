"""
Pydantic Schemas for Weekly Goals & Meaningful Gamification
Academic IDP Project — Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class WeeklyGoalResponse(BaseModel):
    """Current weekly commitments, activity counts, and streak telemetry."""
    id: str
    user_id: str
    week_start_date: str
    target_interviews: int = 2
    target_coding_drills: int = 3
    target_daily_drills: int = 5
    focus_skill: Optional[str] = None
    interviews_completed: int = 0
    coding_completed: int = 0
    daily_drills_completed: int = 0
    status: str = "active"
    streak_current: int = 0
    streak_longest: int = 0
    streak_recovery_available: bool = True
    streak_recovery_used_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WeeklyGoalUpdate(BaseModel):
    """Editable targets for candidate's weekly career commitments."""
    target_interviews: Optional[int] = None
    target_coding_drills: Optional[int] = None
    target_daily_drills: Optional[int] = None
    focus_skill: Optional[str] = None


class StreakRecoveryResponse(BaseModel):
    """Outcome of utilizing the 30-day streak recovery mechanism."""
    success: bool
    message: str
    new_streak: int
    recovery_used_at: Optional[str] = None
