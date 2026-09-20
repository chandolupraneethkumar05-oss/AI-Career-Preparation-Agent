"""
Pydantic Schemas for Skills & Competency Gaps
AI Career Preparation Agent — Academic IDP Project
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SkillBase(BaseModel):
    name: str
    category: str
    importance: str = "High"
    default_target_score: int = 80


class SkillResponse(SkillBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SkillGapBase(BaseModel):
    skill_name: str
    category: Optional[str] = "Core"
    current_score: int
    target_score: int = 80
    priority: str = "medium"  # high, medium, low
    source: str = "ats"  # ats, interview, assessment


class SkillGapCreate(SkillGapBase):
    user_id: Optional[str] = None


class SkillGapResponse(SkillGapBase):
    id: int
    user_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RadarAxisScore(BaseModel):
    subject: str
    score: int


class SkillEvidenceBase(BaseModel):
    skill_name: str
    source_type: str  # resume, interview
    source_id: Optional[str] = None
    score: int
    evidence_text: Optional[str] = None
    confidence: str = "medium"


class SkillEvidenceCreate(SkillEvidenceBase):
    user_id: Optional[str] = None


class SkillEvidenceResponse(SkillEvidenceBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnifiedSkillItem(BaseModel):
    skill_name: str
    category: str = "Technical"
    target_role: str = "Machine Learning Engineer"
    role_importance: str = "Core"  # Core, Important, Optional
    demonstrated_score: int = 0
    target_score: int = 80
    gap: int = 0
    priority: str = "medium"  # high, medium, low
    confidence: str = "Medium"  # None, Low, Medium, High
    trend: str = "stable"  # improving, stable, declining
    repeated_weakness: bool = False
    resume_present: bool = False
    resume_score: Optional[int] = None
    interview_score: Optional[int] = None
    challenge_score: Optional[int] = None
    challenge_count: int = 0
    status: str = "NEW"  # NEW, IN_PROGRESS, IMPROVING, COMPLETED, MASTERED
    evidence_count: int = 0
    latest_feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SkillProfileResponse(BaseModel):
    radar_data: List[RadarAxisScore]
    skill_gaps: List[SkillGapResponse]
    strong_skills: List[str]
    critical_gaps: List[str]
    # Unified Career Skill Gap extensions (fully backward compatible)
    overall_readiness: int = 0
    target_role: str = "Machine Learning Engineer"
    unified_skills: List[UnifiedSkillItem] = []
    top_skill_gaps: List[UnifiedSkillItem] = []
    evidence_summary: Dict[str, int] = {}

    model_config = ConfigDict(from_attributes=True)


class UnifiedSkillProfileResponse(SkillProfileResponse):
    pass
