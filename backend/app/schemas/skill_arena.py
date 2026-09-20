"""
Pydantic Schemas for Skill Arena (Career-Focused Coding Practice)
AI Career Preparation Agent
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class SkillArenaChallengeResponse(BaseModel):
    """Structured challenge metadata presented to candidate."""
    id: str
    title: str
    mode: str = Field(..., description="coding, debug, mcq, predict_output")
    skill: str
    subtopic: str
    difficulty: str = Field(..., description="Foundational, Intermediate, Advanced")
    question: str
    initial_code: Optional[str] = None
    options: List[str] = Field(default_factory=list, description="4 choices for MCQ mode")
    hints: List[str] = Field(default_factory=list)
    estimated_minutes: int = 10
    career_relevance: str = ""
    xp_reward: int = 40
    already_completed: bool = False

    class Config:
        from_attributes = True


class SkillArenaSubmitRequest(BaseModel):
    """Candidate solution submission for safe evaluation."""
    challenge_id: str
    user_answer: str
    time_spent_seconds: Optional[int] = 0
    target_role: Optional[str] = None


class SkillArenaEvaluationResponse(BaseModel):
    """Multi-dimensional structured evaluation result."""
    challenge_id: str
    mode: str
    skill: str
    difficulty: str
    score: int = Field(..., ge=0, le=100)
    correctness: bool
    technical_depth: int = Field(..., ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    mistakes: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    concepts_detected: List[str] = Field(default_factory=list)
    explanation: str
    expected_answer_or_approach: str
    xp_earned: int
    streak: int = 1
    feedback: str
    next_recommended_skill: Optional[str] = None
    rag_context: Optional[str] = None


class SkillArenaAttemptResponse(BaseModel):
    """Individual historical attempt record."""
    id: Union[str, int]
    challenge_id: str
    mode: str
    skill: str
    subtopic: str
    difficulty: str
    score: int
    correctness: bool
    xp_earned: int
    time_spent_seconds: int
    created_at: str

    class Config:
        from_attributes = True


class SkillArenaStatsResponse(BaseModel):
    """Aggregated candidate performance metrics in Skill Arena."""
    total_attempts: int = 0
    total_passed: int = 0
    accuracy_rate: float = 0.0
    total_xp_earned: int = 0
    skills_practiced: List[str] = Field(default_factory=list)
    modes_breakdown: Dict[str, int] = Field(default_factory=dict)
    current_streak: int = 0
