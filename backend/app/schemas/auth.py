"""
Authentication & Authorization Pydantic Schemas
AI Career Preparation Agent
"""

from typing import Optional
from pydantic import BaseModel, Field
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


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128, description="Registered candidate email address")


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str
    email: str
    reset_token: Optional[str] = Field(None, description="One-time signed reset token for sandbox/local recovery")
    reset_link: Optional[str] = Field(None, description="Direct password recovery URL")
    delivered_via: str = "email"


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="One-time signed password reset JWT token")
    new_password: str = Field(..., min_length=6, max_length=72, description="New account password (6-72 characters)")


class ResetPasswordResponse(BaseModel):
    success: bool
    message: str
