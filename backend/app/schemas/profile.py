"""
Pydantic Schemas for User & Profile
AI Career Preparation Agent
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProfileBase(BaseModel):
    bio: Optional[str] = None
    target_company: Optional[str] = "Tech / AI Enterprise"
    experience_level: Optional[str] = "Student / Entry Level"
    resume_headline: Optional[str] = None
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    feedback_language: Optional[str] = "en"


class ProfileUpdate(ProfileBase):
    name: Optional[str] = None
    role: Optional[str] = None
    target_role: Optional[str] = None



class ProfileResponse(ProfileBase):
    id: int
    user_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str
    email: str
    role: str = "AIML Engineer"
    target_role: str = "Machine Learning Engineer"


class UserCreate(UserBase):
    id: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    target_role: Optional[str] = None


class UserResponse(UserBase):
    id: str
    xp: int
    level: int
    streak: int
    longest_streak: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateFullProfileResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None
