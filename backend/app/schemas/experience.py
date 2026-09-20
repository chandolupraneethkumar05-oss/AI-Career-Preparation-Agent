"""
Pydantic Schemas for Real Interview Experiences & Question Knowledge Base
AI Career Preparation Agent
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ExperienceQuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5, description="Interview question text")
    round_type: str = Field(default="technical", description="Round e.g. technical, system_design, coding, hr_behavioral")
    topic: str = Field(default="General", description="Primary topic e.g. Python, System Design, SQL")
    difficulty: str = Field(default="medium", description="Question difficulty: easy, medium, hard")


class ExperienceQuestionResponse(BaseModel):
    id: str
    experience_id: Optional[str] = None
    question_text: str
    round_type: str
    topic: str
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewExperienceCreate(BaseModel):
    role: str = Field(..., min_length=2, max_length=128, description="Target job title or role interviewed for")
    experience_level: str = Field(default="entry", description="entry, mid, senior, lead")
    round_type: str = Field(default="technical", description="technical, system_design, coding, hr_behavioral, managerial")
    
    # Company disclosure choices: "specific", "industry_only", "anonymous"
    company: Optional[str] = Field(default=None, max_length=128, description="Company name (optional or displayed based on disclosure)")
    company_disclosure: str = Field(default="industry_only", description="'specific', 'industry_only', or 'anonymous'")
    industry: Optional[str] = Field(default="Technology", max_length=128, description="Industry domain")
    
    difficulty: str = Field(default="medium", description="Overall interview difficulty: easy, medium, hard")
    outcome: Optional[str] = Field(default="undisclosed", description="offer, rejected, in_progress, declined, undisclosed")
    
    experience_text: str = Field(..., min_length=20, description="Detailed account of the interview process and questions")
    topics: List[str] = Field(default_factory=list, description="Relevant skill topics covered")
    preparation_tips: Optional[str] = Field(default=None, description="Actionable advice for other candidates")
    
    # Optional high-level sanitized resume summary (NEVER raw documents)
    resume_summary: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Sanitized career metadata")
    
    # Questions asked during this interview experience
    questions: List[ExperienceQuestionCreate] = Field(default_factory=list, description="Specific questions asked")


class InterviewExperienceUpdate(BaseModel):
    role: Optional[str] = None
    experience_level: Optional[str] = None
    round_type: Optional[str] = None
    company: Optional[str] = None
    company_disclosure: Optional[str] = None
    industry: Optional[str] = None
    difficulty: Optional[str] = None
    outcome: Optional[str] = None
    experience_text: Optional[str] = None
    topics: Optional[List[str]] = None
    preparation_tips: Optional[str] = None
    resume_summary: Optional[Dict[str, Any]] = None
    questions: Optional[List[ExperienceQuestionCreate]] = None


class InterviewExperienceResponse(BaseModel):
    id: str
    user_id: str
    role: str
    experience_level: str
    round_type: str
    company: Optional[str] = None
    display_company: str
    company_disclosure: str
    industry: Optional[str] = None
    difficulty: str
    outcome: Optional[str] = None
    experience_text: str
    topics: List[str]
    preparation_tips: Optional[str] = None
    resume_summary: Optional[Dict[str, Any]] = None
    moderation_status: str
    moderation_notes: Optional[str] = None
    pii_scan_status: str
    pii_detected_categories: List[str]
    questions: List[ExperienceQuestionResponse] = []
    created_at: datetime
    updated_at: datetime
    is_owner: bool = False

    class Config:
        from_attributes = True


class ExperienceFilterParams(BaseModel):
    role: Optional[str] = None
    round_type: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    search: Optional[str] = None
    limit: int = 20
    offset: int = 0


class PIIScanRequest(BaseModel):
    text: Optional[str] = None
    experience_data: Optional[Dict[str, Any]] = None


class PIIScanResponse(BaseModel):
    is_clean: bool
    pii_scan_status: str
    detected_categories: List[str]
    flagged_snippets: List[str]


class ExperienceModerateRequest(BaseModel):
    status: str = Field(..., description="'APPROVED' or 'REJECTED' or 'PENDING'")
    notes: Optional[str] = Field(default=None, description="Moderator review notes")
