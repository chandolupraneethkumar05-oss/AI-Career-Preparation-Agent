"""
Pydantic Schemas for AI Career Preparation Agent Backend
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ReminderPreferences(BaseModel):
    enabled: bool = Field(default=False, description="Whether proactive reminders are active")
    time: str = Field(default="19:00", description="Preferred notification time in HH:MM format")
    method: str = Field(default="email", description="Notification method: email or browser_sim")
    email: str = Field(default="candidate@example.com", description="Recipient email address")
    frequency: str = Field(default="daily", description="Frequency: daily or weekdays")
    targetRole: str = Field(default="Machine Learning Engineer", description="User target career role")


class ReminderTestRequest(BaseModel):
    email: Optional[str] = None
    targetRole: Optional[str] = "Machine Learning Engineer"
    candidateName: Optional[str] = "Candidate"
    currentStreak: Optional[int] = 0
    weakSkill: Optional[str] = None


class ReminderTestResponse(BaseModel):
    status: str
    delivered: bool
    deliveryMode: str
    recipient: str
    subject: str
    bodyPreview: str
    htmlContent: str
    timestamp: str
    explanation: str


class ActivityLogItem(BaseModel):
    id: str
    type: str
    relatedModule: str
    title: str
    timestamp: str
    xpEarned: int = 0
    details: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    schedulerActive: bool
