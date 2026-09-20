"""
Pydantic Schemas for Weekly AI Career Report
Academic IDP Project — Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class WeeklyReportSummary(BaseModel):
    """Activity and engagement metrics for the week."""
    total_interviews_this_week: int = 0
    total_coding_solved_this_week: int = 0
    total_daily_drills_this_week: int = 0
    total_xp_gained_this_week: int = 0
    active_days_count: int = 0
    streak_current: int = 0
    vs_previous_week: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class SkillProgressItem(BaseModel):
    """Specific skill progression tracked during the week."""
    skill_name: str
    status: str  # proficient, improving, needs_practice
    evidence_count: int = 0
    recent_activity: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewPerformanceSummary(BaseModel):
    """Mock interview outcomes, speaking metrics, and rubric adherence."""
    total_sessions: int = 0
    average_score: Optional[float] = None
    highest_scoring_round: Optional[str] = None
    average_wpm: Optional[float] = None
    star_adherence_rate: Optional[float] = None
    key_strengths: List[str] = Field(default_factory=list)
    primary_weaknesses: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CodingPerformanceSummary(BaseModel):
    """Coding and algorithmic practice performance."""
    problems_attempted: int = 0
    problems_solved: int = 0
    languages_used: List[str] = Field(default_factory=list)
    pass_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class AreaRequiringAttention(BaseModel):
    """Identified candidate bottleneck requiring focused practice."""
    area_name: str
    reason: str
    action_recommendation: str
    action_route: str = "/skill-gap"

    model_config = ConfigDict(from_attributes=True)


class NextWeekPriority(BaseModel):
    """3 to 5 targeted priorities for candidate next week."""
    priority_title: str
    description: str
    target_metric: str
    suggested_action: str
    action_route: str = "/mock-interview"

    model_config = ConfigDict(from_attributes=True)


class ReadinessSummary(BaseModel):
    """Snapshot of overall career preparation state."""
    readiness_band: str = "getting_started"
    overall_score: int = 0
    completed_milestones: int = 0
    total_milestones: int = 6
    trend: str = "steady"  # improving, steady, needs_momentum

    model_config = ConfigDict(from_attributes=True)


class WeeklyReportResponse(BaseModel):
    """Complete Weekly AI Career Report response payload."""
    id: str
    user_id: str
    week_number: int
    year: int
    start_date: str
    end_date: str
    summary: WeeklyReportSummary
    skills_progress: List[SkillProgressItem] = Field(default_factory=list)
    interview_performance: InterviewPerformanceSummary
    coding_performance: CodingPerformanceSummary
    areas_requiring_attention: List[AreaRequiringAttention] = Field(default_factory=list)
    next_week_priorities: List[NextWeekPriority] = Field(default_factory=list)
    readiness_summary: ReadinessSummary
    ai_interpretation: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class WeeklyReportHistoryItem(BaseModel):
    """Item in previous weekly reports history archive."""
    id: str
    week_number: int
    year: int
    start_date: str
    end_date: str
    created_at: str
    interviews_completed: int = 0
    coding_solved: int = 0
    xp_gained: int = 0
    readiness_score: int = 0

    model_config = ConfigDict(from_attributes=True)
