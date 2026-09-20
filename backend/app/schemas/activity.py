"""
Pydantic Schemas for Activity Tracking
AI Career Preparation Agent — Academic IDP Project
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ActivityBase(BaseModel):
    type: str = Field(..., description="Activity type e.g. interview_completed, challenge_completed, resume_analyzed")
    related_module: Optional[str] = "general"
    title: str = Field(..., description="Descriptive title of verified action")
    xp_earned: Optional[int] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class ActivityCreate(ActivityBase):
    user_id: Optional[str] = None
    id: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    type: str
    related_module: str
    title: str
    xp_earned: int
    timestamp: datetime
    details: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class ActivityListResponse(BaseModel):
    activities: List[ActivityResponse]
    total_count: int
    current_streak: int
    longest_streak: int
    practiced_today: bool
