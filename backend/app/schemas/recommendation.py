"""
Pydantic Schemas for Recommendations & Next-Best-Action
AI Career Preparation Agent
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NextBestActionResponse(BaseModel):
    action_type: str
    priority: str  # high, medium, low
    title: str
    headline: str
    action: str
    route: str
    target_role: str
    primary_skill: str
    reason: str
    source: str  # ats_audit, interview_baseline, interview_performance, ats_skill_gap, activity, advanced_readiness, unified_skill_gap
    status: str = "NEW"  # NEW, IN_PROGRESS, IMPROVING, COMPLETED, MASTERED
    estimated_effort: str = "10 mins"
    target_skill: Optional[str] = None
    suggested_action: Optional[str] = None
    weakness_detail: Optional[str] = None


class RecommendationItem(NextBestActionResponse):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardProgressResponse(BaseModel):
    user_id: str
    candidate_name: str
    target_role: str
    total_xp: int
    level: int
    current_streak: int
    longest_streak: int
    practiced_today: bool
    interviews_count: int
    average_interview_score: float
    ats_score: Optional[int] = None
    readiness_percentage: int
    next_best_action: NextBestActionResponse
    radar_data: List[dict]
    recent_activities: List[dict]
    unlocked_achievements_count: int
