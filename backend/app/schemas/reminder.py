"""
Pydantic Schemas for Proactive Practice Reminders
AI Career Preparation Agent
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re


class ReminderPreferenceBase(BaseModel):
    enabled: bool = Field(default=False, description="Whether proactive practice reminders are active")
    preferred_time: str = Field(default="19:00", description="Notification time in 24-hr HH:MM format")
    method: str = Field(default="email", description="Notification delivery channel: email")
    email: str = Field(default="candidate@example.com", description="Candidate email address")
    timezone: str = Field(default="Asia/Kolkata", description="User local timezone (e.g. Asia/Kolkata)")
    frequency: str = Field(default="daily", description="Frequency: daily or weekdays")
    target_role: Optional[str] = Field(default="Machine Learning Engineer", description="Target role")

    @field_validator("preferred_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        if not re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", v):
            raise ValueError("preferred_time must be in 24-hour HH:MM format (e.g. 19:00)")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("A valid email address is required for proactive practice reminders")
        return v


class ReminderPreferenceUpdate(BaseModel):
    enabled: Optional[bool] = None
    preferred_time: Optional[str] = None
    time: Optional[str] = None  # Alias for preferred_time
    method: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None
    frequency: Optional[str] = None
    target_role: Optional[str] = None

    @field_validator("preferred_time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", v):
            raise ValueError("preferred_time must be in 24-hour HH:MM format (e.g. 19:00)")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^[^@]+@[^@]+\.[^@]+$", v.strip()):
            raise ValueError("A valid email address is required")
        return v.strip() if v else None


class ReminderPreferenceResponse(ReminderPreferenceBase):
    id: int
    user_id: str
    time: str  # Alias for preferred_time for backward compatibility
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReminderStatusResponse(BaseModel):
    enabled: bool
    preferred_time: str
    method: str
    email: str
    timezone: str
    current_local_time: str
    practiced_today: bool
    reminder_sent_today: bool
    last_reminder: Optional[str] = None
    status_message: str


class ReminderLogResponse(BaseModel):
    id: int
    user_id: str
    reminder_date: str
    reminder_type: str
    subject: str
    message: str
    status: str
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReminderTestRequest(BaseModel):
    email: Optional[str] = None
    targetRole: Optional[str] = None
    candidateName: Optional[str] = None
    currentStreak: Optional[int] = None
    weakSkill: Optional[str] = None


class ReminderTestResponse(BaseModel):
    status: str  # "development" or "sent"
    delivered: bool
    email_sent: bool
    deliveryMode: str
    recipient: str
    subject: str
    bodyPreview: str
    htmlContent: str
    timestamp: str
    explanation: str
