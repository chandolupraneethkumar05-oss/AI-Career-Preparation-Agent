"""
Pydantic Schemas for Resume & ATS Analysis
AI Career Preparation Agent
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ResumeScoreBreakdownItem(BaseModel):
    label: str = Field(description="Category label e.g. Skill Match, Role Alignment")
    score: int = Field(description="Points earned in category")
    max: int = Field(description="Maximum points available in category")
    percentage: int = Field(description="Normalized percentage (0-100)")
    status: str = Field(description="Assessment tag e.g. Strong, Good, Needs Improvement")


class ResumeAnalysisResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    target_role: str
    ats_score: int
    breakdown: List[ResumeScoreBreakdownItem]
    extracted_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    missing_optional_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    sections_detected: List[str]
    analysis_summary: str
    xp_earned: int = 35
    created_at: datetime

    # For backward-compatibility with frontend field aliases
    matchedSkills: Optional[List[str]] = None
    missingKeywords: Optional[List[str]] = None
    overallScore: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ResumeAnalysisSummary(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    target_role: str
    ats_score: int
    matched_skills_count: int
    missing_skills_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeHistoryResponse(BaseModel):
    analyses: List[ResumeAnalysisResponse]
    total_count: int
