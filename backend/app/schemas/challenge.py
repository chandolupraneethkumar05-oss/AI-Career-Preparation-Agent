"""
Pydantic Schemas for Daily Conceptual Drills
AI Career Preparation Agent
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DailyChallengeResponse(BaseModel):
    challenge_id: str
    topic: str
    difficulty: str
    question: str
    target_role: str
    xp_reward: int = 50
    ideal_keywords: List[str] = Field(default_factory=list)
    already_completed: bool = False


class ChallengeSubmitRequest(BaseModel):
    challenge_id: str
    user_answer: str = Field(..., min_length=10)
    topic: Optional[str] = None
    target_role: Optional[str] = "Machine Learning Engineer"


class ChallengeSubmitResponse(BaseModel):
    challenge_id: str
    topic: str
    score: int
    passed: bool
    xp_earned: int
    streak: int
    feedback: str
    strengths: List[str]
    improvements: List[str]


class ChallengeHistoryItem(BaseModel):
    id: int
    challenge_id: str
    topic: str
    difficulty: str
    score: int
    xp_earned: int
    completed: bool
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChallengeHistoryResponse(BaseModel):
    challenges: List[ChallengeHistoryItem]
    total_completed: int
