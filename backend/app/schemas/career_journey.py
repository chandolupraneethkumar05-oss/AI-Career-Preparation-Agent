"""
Pydantic Schemas for Career Journey and Career Readiness Foundation
AI Career Preparation Agent
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from .recommendation import NextBestActionResponse


class MilestoneStatus(str, Enum):
    COMPLETED = "completed"
    IN_PROGRESS = "in_progress"
    NOT_STARTED = "not_started"


class ReadinessBand(str, Enum):
    GETTING_STARTED = "getting_started"
    BUILDING_FOUNDATIONS = "building_foundations"
    DEVELOPING = "developing"
    INTERVIEW_READY = "interview_ready"
    STRONG_PREPARATION = "strong_preparation"


class MilestoneEvidenceItem(BaseModel):
    """Concrete evidence record supporting a milestone."""
    title: str
    description: str
    source_type: str  # profile, resume, ats, skill_gap, challenge, skill_arena, interview, evaluation, recording
    date: Optional[str] = None
    metric_value: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CareerMilestone(BaseModel):
    """Deterministic lifecycle milestone in the candidate's career preparation journey."""
    id: str
    sequence: int
    milestone_type: str
    title: str
    description: str
    status: MilestoneStatus
    completed_at: Optional[str] = None
    evidence: List[MilestoneEvidenceItem] = Field(default_factory=list)
    action_route: Optional[str] = None
    action_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReadinessDimension(BaseModel):
    """Assessment of candidate preparation along one of 5 key preparation dimensions."""
    dimension_key: str  # resume_ats, technical_depth, coding_practice, interview_simulation, communication_quality
    title: str
    status: str  # Verified, In Progress, Needs Evidence
    summary: str
    evidence_count: int = 0
    score_indicator: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReadinessAssessment(BaseModel):
    """Transparent multi-dimensional readiness band grounded in concrete platform evidence."""
    readiness_band: ReadinessBand
    display_title: str
    rationale: str
    disclaimer: str = (
        "Career readiness reflects structured preparation evidence and drill history recorded within the platform. "
        "It does not predict or guarantee employment or real-world interview outcomes."
    )
    dimensions: List[ReadinessDimension] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CareerJourneyStats(BaseModel):
    """Aggregated empirical metrics summary."""
    total_milestones: int = 14
    completed_milestones: int = 0
    in_progress_milestones: int = 0
    not_started_milestones: int = 0
    total_interviews: int = 0
    average_interview_score: float = 0.0
    ats_score: Optional[int] = None
    drills_completed: int = 0

    model_config = ConfigDict(from_attributes=True)


class CareerJourneyResponse(BaseModel):
    """Unified payload synthesizing the full career journey, milestones, and readiness."""
    user_id: str
    candidate_name: str
    target_role: str
    preparation_headline: str
    current_focus: str
    next_best_action: Optional[NextBestActionResponse] = None
    readiness: ReadinessAssessment
    milestones: List[CareerMilestone]
    stats: CareerJourneyStats

    model_config = ConfigDict(from_attributes=True)
