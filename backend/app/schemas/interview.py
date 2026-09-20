"""
Pydantic Schemas for Mock Interview Sessions & Rubrics
AI Career Preparation Agent
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class InterviewRubrics(BaseModel):
    overall: int = 0
    technicalKnowledge: int = 0
    relevance: int = 0
    clarity: int = 0
    structure: int = 0
    confidence: int = 0


class InterviewCreate(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    role: str = "Machine Learning Engineer"
    interview_type: str = "Technical"
    difficulty: str = "Intermediate"
    overall_score: int = Field(..., ge=0, le=100)
    passed: bool = True
    questions_count: int = 5
    feedback_summary: Optional[str] = ""
    rubric_scores: Optional[Dict[str, int]] = Field(default_factory=dict)
    answers: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    role: str
    interview_type: str
    difficulty: str
    overall_score: int
    passed: bool
    questions_count: int
    feedback_summary: str
    rubric_scores: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewDetailResponse(InterviewResponse):
    answers: List[Dict[str, Any]] = Field(default_factory=list)


class InterviewListResponse(BaseModel):
    interviews: List[InterviewResponse]
    total_count: int
    average_score: float


# =========================================================================
# Generative AI Multi-Turn Interview Engine Schemas
# =========================================================================

class InterviewStartRequest(BaseModel):
    user_id: str = Field(default="user-001", description="Candidate User ID")
    role: Optional[str] = Field(default="Machine Learning Engineer", description="Target Career Role")
    interview_type: Optional[str] = Field(default="Technical", description="Technical, Behavioral, HR")
    difficulty: Optional[str] = Field(default="Intermediate", description="Beginner, Intermediate, Advanced")
    interview_language: Optional[str] = Field(default="en", description="Language for interview questions (en, te, hi, es)")
    feedback_language: Optional[str] = Field(default="en", description="Language for feedback reports (en, te, hi, es)")
    total_questions: Optional[int] = Field(default=5, ge=3, le=15, description="Interview length (Quick: 5, Standard: 10)")
    interview_mode: Optional[str] = Field(default="text", description="Interview mode: text or video")


class InterviewQuestionResponse(BaseModel):
    id: str
    session_id: str
    sequence_number: int
    question: str
    skill: str
    difficulty: str
    question_type: str
    generated_source: str
    expected_focus: Optional[str] = ""
    is_follow_up: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionResponse(BaseModel):
    session_id: str
    user_id: str
    target_role: str
    interview_type: str
    difficulty: str
    status: str
    interview_language: str
    feedback_language: str
    total_questions: int
    current_question_index: int
    current_question: Optional[InterviewQuestionResponse] = None
    started_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubmitAnswerRequest(BaseModel):
    user_id: str = Field(default="user-001", description="Candidate User ID")
    question_id: str = Field(..., description="ID of question being answered")
    answer: str = Field(..., min_length=2, max_length=5000, description="Candidate verbal or typed answer")
    time_spent_seconds: Optional[int] = Field(default=0, ge=0)


class AnswerEvaluationResponse(BaseModel):
    id: str
    question_id: str
    overall_score: int
    technical_accuracy: int
    communication_quality: int
    relevance: int
    completeness: int
    confidence_indicators: int
    # Extended metrics matching user evaluation schema
    correctness_score: Optional[int] = None
    depth_score: Optional[int] = None
    relevance_score: Optional[int] = None
    communication_score: Optional[int] = None
    technical_score: Optional[int] = None
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    detected_topics: List[str] = Field(default_factory=list)
    recommended_follow_up_type: Optional[str] = None
    recommended_difficulty: Optional[str] = None
    skill_evidence: Dict[str, Any] = Field(default_factory=dict)
    feedback: str
    follow_up_needed: bool = False
    follow_up_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NextQuestionDecision(BaseModel):
    action: str = "standard"  # escalate, reinforce, follow_up, standard, complete
    target_skill: Optional[str] = None
    difficulty: str = "Intermediate"
    reason: str = "Progressing through calibrated interview plan."
    follow_up_type: Optional[str] = None
    missing_concepts: List[str] = Field(default_factory=list)
    topic: Optional[str] = None


class AnswerSubmissionResponse(BaseModel):
    evaluation: AnswerEvaluationResponse
    next_question: Optional[InterviewQuestionResponse] = None
    adaptive_decision: NextQuestionDecision
    is_complete: bool = False
    completed_count: int
    total_questions: int


class FinalInterviewReportResponse(BaseModel):
    session_id: str
    user_id: str
    target_role: str
    interview_type: str
    difficulty: str
    overall_score: int
    passed: bool
    rubric_scores: Dict[str, int]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    next_best_action: Dict[str, Any]
    skill_gap_updates: List[Dict[str, Any]]
    observed_skills: List[Dict[str, Any]] = Field(default_factory=list)
    feedback_summary: str
    feedback_language: str
    fallback_notice: Optional[str] = None
    questions_completed: int
    total_questions: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    answers_transcript: List[Dict[str, Any]] = Field(default_factory=list)


# =========================================================================
# Question-Aware Quick Answer Assistant Schemas
# =========================================================================

class QuickAnswerRequest(BaseModel):
    user_id: str = Field(default="user-001", description="Candidate User ID")
    session_id: Optional[str] = Field(default=None, description="Active Interview Session ID if applicable")
    question_id: Optional[str] = Field(default=None, description="Active Question ID if applicable")
    question: str = Field(..., min_length=3, description="The specific interview question being answered")
    topic: Optional[str] = Field(default=None, description="Curriculum topic or skill category of the question")
    difficulty: Optional[str] = Field(default="Intermediate", description="Beginner, Intermediate, Advanced")
    interview_type: Optional[str] = Field(default="Technical", description="Technical, Behavioral, HR")
    target_role: Optional[str] = Field(default="Machine Learning Engineer", description="Candidate Target Role")
    language: Optional[str] = Field(default="en", description="Preferred response language (en, te, hi, es)")


class QuickAnswerResponse(BaseModel):
    quick_answer: str = Field(..., description="Concise, question-aware candidate practice answer")
    topic: str = Field(default="General", description="Identified question domain/topic")
    strategy: str = Field(default="technical_concept", description="Generation strategy used: technical_concept, star_behavioral, project_experience, hr_motivation, etc.")
    source: str = Field(default="rag_grounded", description="rag_grounded, local_curriculum_synthesizer, real_llm")


# =========================================================================
# Phase 15: Video Interview Recording & Communication Schemas
# =========================================================================

class RecordingSegmentItem(BaseModel):
    question_id: str
    sequence_number: int
    start_time: float = Field(default=0.0, description="Start timestamp in seconds")
    end_time: float = Field(default=0.0, description="End timestamp in seconds")
    duration: float = Field(default=0.0, description="Segment duration in seconds")
    transcript: str = Field(default="", description="Question transcript segment")


class CommunicationMetricsResponse(BaseModel):
    speaking_pace_wpm: float = Field(default=0.0, description="Words per minute across spoken duration")
    pace_status: str = Field(default="optimal", description="slow, optimal, fast")
    filler_words_count: int = Field(default=0, description="Total count of detected filler words")
    filler_words_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count per filler word")
    pause_count: int = Field(default=0, description="Count of noticeable pauses (> 2.0s)")
    total_duration_seconds: float = Field(default=0.0, description="Total spoken duration in seconds")
    clarity_score: int = Field(default=80, description="Transcript-based structure and lexical clarity (0-100)")
    star_structure: Optional[Dict[str, Any]] = Field(default=None, description="STAR analysis for behavioral questions")
    delivery_suggestions: List[str] = Field(default_factory=list, description="Respectful, constructive delivery observations")


class RecordingMetadataCreate(BaseModel):
    user_id: str = Field(default="user-001")
    session_id: str
    recording_mode: str = Field(default="video")  # video, audio_only, text
    duration_seconds: float = Field(default=0.0)
    mime_type: str = Field(default="video/webm")
    file_size_bytes: int = Field(default=0)
    segments: List[RecordingSegmentItem] = Field(default_factory=list)
    communication_metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)


class RecordingMetadataResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    recording_mode: str
    duration_seconds: float
    mime_type: str
    file_size_bytes: int
    status: str
    stream_url: Optional[str] = None
    segments: List[Dict[str, Any]] = Field(default_factory=list)
    communication_metrics: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime



