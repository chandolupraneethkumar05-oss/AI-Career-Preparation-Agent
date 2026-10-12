"""
Authentication & Authorization Pydantic Schemas
AI Career Preparation Agent
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from .profile import UserResponse


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, description="Candidate full name")
    email: str = Field(..., min_length=3, max_length=128, description="Candidate email address")
    password: str = Field(..., min_length=6, max_length=72, description="Account password (6 to 72 characters)")
    target_role: Optional[str] = Field("Machine Learning Engineer", description="Target career role")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128, description="Candidate email address")
    password: str = Field(..., min_length=1, max_length=72, description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_demo: bool = False
