"""
SQLAlchemy ORM Models for AI Career Preparation Agent
"""

import json
from typing import Any, List, Dict
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship

from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    """Authenticated candidate model and gamification summary."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    role = Column(String(64), default="AIML Engineer")
    target_role = Column(String(64), default="Machine Learning Engineer")
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    streak_recovery_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("Challenge", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    reminder_preference = relationship("ReminderPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reminder_logs = relationship("ReminderLog", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    interview_questions = relationship("InterviewQuestion", back_populates="user", cascade="all, delete-orphan")
    interview_answers = relationship("InterviewAnswer", back_populates="user", cascade="all, delete-orphan")
    answer_evaluations = relationship("AnswerEvaluation", back_populates="user", cascade="all, delete-orphan")
    skill_evidences = relationship("SkillEvidence", back_populates="user", cascade="all, delete-orphan")
    skill_arena_attempts = relationship("SkillArenaAttempt", back_populates="user", cascade="all, delete-orphan")
    recordings = relationship("InterviewRecording", back_populates="user", cascade="all, delete-orphan")
    interview_experiences = relationship("InterviewExperience", back_populates="user", cascade="all, delete-orphan")
    weekly_reports = relationship("WeeklyReport", back_populates="user", cascade="all, delete-orphan")
    weekly_goals = relationship("WeeklyGoal", back_populates="user", cascade="all, delete-orphan")
    product_feedbacks = relationship("ProductFeedback", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    """Detailed candidate profile and career preferences."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    bio = Column(Text, default="AI & Machine Learning candidate passionate about building scalable production pipelines.")
    target_company = Column(String(128), default="Tech / AI Enterprise")
    experience_level = Column(String(64), default="Student / Entry Level")
    resume_headline = Column(String(256), default="Machine Learning & Software Engineer")
    github_url = Column(String(256), default="")
    linkedin_url = Column(String(256), default="")
    feedback_language = Column(String(16), default="en", nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class Activity(Base):
    """Immutable audit trail of candidate preparation activities."""
    __tablename__ = "activities"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(64), nullable=False, index=True)  # interview_completed, challenge_completed, resume_analyzed, skill_activity_completed
    related_module = Column(String(64), nullable=False)
    title = Column(String(256), nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    details_json = Column(Text, default="{}")  # JSON-encoded metadata

    user = relationship("User", back_populates="activities")

    @property
    def details(self):
        try:
            return json.loads(self.details_json) if self.details_json else {}
        except Exception:
            return {}

    @details.setter
    def details(self, value):
        self.details_json = json.dumps(value) if value else "{}"


class Interview(Base):
    """Mock interview practice session results, session state, and rubrics."""
    __tablename__ = "interviews"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(64), nullable=False)
    interview_type = Column(String(64), default="Technical")
    difficulty = Column(String(32), default="Intermediate")
    overall_score = Column(Integer, default=0)
    passed = Column(Boolean, default=True)
    questions_count = Column(Integer, default=5)
    feedback_summary = Column(Text, default="")
    rubric_scores_json = Column(Text, default="{}")  # Stores technicalKnowledge, clarity, confidence, etc.
    answers_json = Column(Text, default="[]")  # Detailed question/answer transcript
    status = Column(String(32), default="completed", nullable=False)  # in_progress, completed, abandoned
    interview_language = Column(String(16), default="en", nullable=False)
    feedback_language = Column(String(16), default="en", nullable=False)
    started_at = Column(DateTime, default=utc_now, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    current_question_index = Column(Integer, default=0, nullable=False)
    recommendations_json = Column(Text, default="[]")
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]")
    interview_mode = Column(String(16), default="text")  # text, video
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.sequence_number")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")
    evaluations = relationship("AnswerEvaluation", back_populates="session", cascade="all, delete-orphan")
    recording = relationship("InterviewRecording", back_populates="session", uselist=False, cascade="all, delete-orphan")

    @property
    def target_role(self):
        return self.role

    @target_role.setter
    def target_role(self, value):
        self.role = value

    @property
    def score(self):
        return self.overall_score

    @score.setter
    def score(self, value):
        self.overall_score = value

    @property
    def total_questions(self):
        return self.questions_count

    @total_questions.setter
    def total_questions(self, value):
        self.questions_count = value

    @property
    def rubric_scores(self):
        try:
            return json.loads(self.rubric_scores_json) if self.rubric_scores_json else {}
        except Exception:
            return {}

    @rubric_scores.setter
    def rubric_scores(self, value):
        self.rubric_scores_json = json.dumps(value) if value else "{}"

    @property
    def recommendations(self):
        try:
            return json.loads(self.recommendations_json) if self.recommendations_json else []
        except Exception:
            return []

    @recommendations.setter
    def recommendations(self, value):
        self.recommendations_json = json.dumps(value) if value else "[]"

    @property
    def strengths(self):
        try:
            return json.loads(self.strengths_json) if self.strengths_json else []
        except Exception:
            return []

    @strengths.setter
    def strengths(self, value):
        self.strengths_json = json.dumps(value) if value else "[]"

    @property
    def weaknesses(self):
        try:
            return json.loads(self.weaknesses_json) if self.weaknesses_json else []
        except Exception:
            return []

    def as_dict(self):
        return {
            "id": self.id,
            "session_id": self.id,
            "user_id": self.user_id,
            "role": self.role,
            "target_role": self.role,
            "interview_type": self.interview_type,
            "difficulty": self.difficulty,
            "overall_score": self.overall_score,
            "passed": self.passed,
            "questions_count": self.questions_count,
            "total_questions": self.total_questions,
            "current_question_index": self.current_question_index,
            "status": self.status,
            "interview_language": self.interview_language,
            "feedback_language": self.feedback_language,
            "interview_mode": getattr(self, "interview_mode", "text") or "text",
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "rubric_scores": self.rubric_scores,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "recommendations": self.recommendations,
            "feedback_summary": self.feedback_summary
        }


class InterviewQuestion(Base):
    """Dynamic question generated during an interview session."""
    __tablename__ = "interview_questions"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interviews.id"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False)

    @property
    def question_index(self):
        return self.sequence_number - 1
    question = Column(Text, nullable=False)
    skill = Column(String(64), nullable=False)
    difficulty = Column(String(32), default="Intermediate")
    question_type = Column(String(64), default="Technical")
    generated_source = Column(String(64), default="rag_grounded")
    expected_focus = Column(Text, default="")
    rag_chunk_id = Column(String(64), nullable=True)
    is_follow_up = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("Interview", back_populates="questions")
    user = relationship("User", back_populates="interview_questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    evaluation = relationship("AnswerEvaluation", back_populates="question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    """Candidate response submitted for an interview question."""
    __tablename__ = "interview_answers"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interviews.id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("interview_questions.id"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    answer = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("Interview", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answer")
    user = relationship("User", back_populates="interview_answers")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    """Structured multidimensional evaluation for an answer."""
    __tablename__ = "answer_evaluations"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interviews.id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("interview_questions.id"), nullable=False, index=True)
    answer_id = Column(String(64), ForeignKey("interview_answers.id"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    overall_score = Column(Integer, default=0)
    technical_accuracy = Column(Integer, default=0)
    communication_quality = Column(Integer, default=0)
    relevance = Column(Integer, default=0)
    completeness = Column(Integer, default=0)
    confidence_indicators = Column(Integer, default=0)
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]")
    missing_concepts_json = Column(Text, default="[]")
    detected_topics_json = Column(Text, default="[]")
    recommended_follow_up_type = Column(String(64), nullable=True)
    recommended_difficulty = Column(String(32), nullable=True)
    skill_evidence_json = Column(Text, default="{}")
    feedback = Column(Text, default="")
    follow_up_needed = Column(Boolean, default=False)
    follow_up_reason = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("Interview", back_populates="evaluations")
    question = relationship("InterviewQuestion", back_populates="evaluation")
    answer = relationship("InterviewAnswer", back_populates="evaluation")
    user = relationship("User", back_populates="answer_evaluations")

    @property
    def strengths(self):
        try:
            return json.loads(self.strengths_json) if self.strengths_json else []
        except Exception:
            return []

    @strengths.setter
    def strengths(self, value):
        self.strengths_json = json.dumps(value) if value else "[]"

    @property
    def weaknesses(self):
        try:
            return json.loads(self.weaknesses_json) if self.weaknesses_json else []
        except Exception:
            return []

    @weaknesses.setter
    def weaknesses(self, value):
        self.weaknesses_json = json.dumps(value) if value else "[]"

    @property
    def missing_concepts(self):
        try:
            return json.loads(self.missing_concepts_json) if self.missing_concepts_json else []
        except Exception:
            return []

    @missing_concepts.setter
    def missing_concepts(self, value):
        self.missing_concepts_json = json.dumps(value) if value else "[]"

    @property
    def detected_topics(self):
        try:
            return json.loads(self.detected_topics_json) if self.detected_topics_json else []
        except Exception:
            return []

    @detected_topics.setter
    def detected_topics(self, value):
        self.detected_topics_json = json.dumps(value) if value else "[]"

    @property
    def skill_evidence(self):
        try:
            return json.loads(self.skill_evidence_json) if self.skill_evidence_json else {}
        except Exception:
            return {}

    @skill_evidence.setter
    def skill_evidence(self, value):
        self.skill_evidence_json = json.dumps(value) if value else "{}"


class InterviewRecording(Base):
    """
    Metadata for recorded mock interview sessions.
    Stores audio/video metadata and references to local file storage.
    Enforces user-isolation.
    """
    __tablename__ = "interview_recordings"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("interviews.id"), nullable=False, index=True)
    storage_path = Column(String(512), nullable=True)  # Path in local file storage
    recording_mode = Column(String(32), default="video")  # video, audio_only, text
    duration_seconds = Column(Float, default=0.0)
    mime_type = Column(String(64), default="video/webm")
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(32), default="ready")  # ready, processing, deleted
    segments_json = Column(Text, default="[]")  # list of question segments
    communication_metrics_json = Column(Text, default="{}")  # WPM, filler words, pauses, etc.
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="recordings")
    session = relationship("Interview", back_populates="recording")

    @property
    def segments(self):
        try:
            return json.loads(self.segments_json) if self.segments_json else []
        except Exception:
            return []

    @segments.setter
    def segments(self, value):
        self.segments_json = json.dumps(value) if value else "[]"

    @property
    def communication_metrics(self):
        try:
            return json.loads(self.communication_metrics_json) if self.communication_metrics_json else {}
        except Exception:
            return {}

    @communication_metrics.setter
    def communication_metrics(self, value):
        self.communication_metrics_json = json.dumps(value) if value else "{}"


class Skill(Base):
    """Core skill taxonomy definitions."""
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, index=True, nullable=False)
    category = Column(String(64), nullable=False)  # Foundational, Core ML, MLOps, System Design, Communication
    importance = Column(String(32), default="High")  # Critical, High, Medium
    default_target_score = Column(Integer, default=80)


class SkillGap(Base):
    """Tracked competency gap for a candidate."""
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(64), nullable=False, index=True)
    category = Column(String(64), default="Core")
    current_score = Column(Integer, default=50)
    target_score = Column(Integer, default=80)
    priority = Column(String(16), default="medium")  # high, medium, low
    source = Column(String(32), default="ats")  # ats, interview, assessment
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="skill_gaps")


class SkillEvidence(Base):
    """
    Granular, multi-source evidence entries for candidate competencies.
    Maintains separate audit logs for ATS resume detection vs live mock interview demonstrations.
    """
    __tablename__ = "skill_evidences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(64), nullable=False, index=True)
    source_type = Column(String(32), nullable=False)  # "resume" or "interview"
    source_id = Column(String(64), nullable=True)     # session_id, analysis_id, or question_id
    score = Column(Integer, nullable=False)           # 0 to 100
    evidence_text = Column(Text, nullable=True)       # Details / question prompt / observation
    confidence = Column(String(16), default="medium") # low, medium, high
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="skill_evidences")


class Challenge(Base):
    """Daily conceptual drill submissions and history."""
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(String(64), nullable=False, index=True)
    topic = Column(String(128), nullable=False)
    difficulty = Column(String(32), default="Intermediate")
    question = Column(Text, nullable=False)
    user_answer = Column(Text, default="")
    score = Column(Integer, default=0)
    xp_earned = Column(Integer, default=50)
    completed = Column(Boolean, default=True)
    submitted_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="challenges")
 
 
class SkillArenaAttempt(Base):
    """Career-focused coding, debugging, MCQ, and output prediction attempt records."""
    __tablename__ = "skill_arena_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(String(64), nullable=False, index=True)
    mode = Column(String(32), nullable=False)  # coding, debug, mcq, predict_output
    skill = Column(String(64), nullable=False, index=True)
    subtopic = Column(String(64), default="")
    difficulty = Column(String(32), default="Intermediate")
    user_answer = Column(Text, default="")
    score = Column(Integer, default=0)
    correctness = Column(Boolean, default=False)
    feedback = Column(Text, default="")
    strengths_json = Column(Text, default="[]")
    mistakes_json = Column(Text, default="[]")
    improvement_suggestions_json = Column(Text, default="[]")
    concepts_detected_json = Column(Text, default="[]")
    xp_earned = Column(Integer, default=40)
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="skill_arena_attempts")

    @property
    def strengths(self):
        try:
            return json.loads(self.strengths_json) if self.strengths_json else []
        except Exception:
            return []

    @property
    def mistakes(self):
        try:
            return json.loads(self.mistakes_json) if self.mistakes_json else []
        except Exception:
            return []

    @property
    def improvement_suggestions(self):
        try:
            return json.loads(self.improvement_suggestions_json) if self.improvement_suggestions_json else []
        except Exception:
            return []

    @property
    def concepts_detected(self):
        try:
            return json.loads(self.concepts_detected_json) if self.concepts_detected_json else []
        except Exception:
            return []


class Achievement(Base):
    """Gamified milestone badges earned or tracked."""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = Column(String(64), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    description = Column(String(256), default="")
    icon = Column(String(16), default="🏅")
    category = Column(String(64), default="Milestone")
    unlocked = Column(Boolean, default=False)
    unlocked_at = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0)  # 0 to 100%

    user = relationship("User", back_populates="achievements")


class Recommendation(Base):
    """Next-Best-Action decisions computed by the autonomous agent decision engine."""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)
    priority = Column(String(16), default="medium")  # high, medium, low
    title = Column(String(256), nullable=False)
    headline = Column(String(256), nullable=False)
    action = Column(String(128), nullable=False)
    route = Column(String(128), nullable=False)
    target_role = Column(String(64), nullable=False)
    primary_skill = Column(String(64), nullable=False)
    reason = Column(Text, nullable=False)
    source = Column(String(64), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="recommendations")


class ReminderPreference(Base):
    """Candidate preferences for daily proactive reminder prompts."""
    __tablename__ = "reminder_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    enabled = Column(Boolean, default=False)
    time = Column(String(16), default="19:00")
    preferred_time = Column(String(16), default="19:00")
    method = Column(String(32), default="email")
    email = Column(String(128), default="candidate@example.com")
    timezone = Column(String(64), default="Asia/Kolkata")
    frequency = Column(String(32), default="daily")
    target_role = Column(String(64), default="Machine Learning Engineer")
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="reminder_preference")


class ReminderLog(Base):
    """Record of dispatched or simulated daily practice reminders to prevent duplicates."""
    __tablename__ = "reminder_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    reminder_date = Column(String(16), nullable=False, index=True)  # YYYY-MM-DD
    reminder_type = Column(String(64), default="daily_practice_prompt")
    subject = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default="development")  # development, sent, failed
    sent_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="reminder_logs")


class ResumeAnalysis(Base):
    """
    Persisted ATS resume analysis results and parsed competency profiles.
    Privacy note: Does NOT store full raw unredacted resume texts.
    Stores structured extracted metrics, skills, sections, and sanitized analysis summaries.
    """
    __tablename__ = "resume_analyses"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(256), nullable=False)
    file_type = Column(String(32), default="pdf")
    file_size = Column(Integer, default=0)
    target_role = Column(String(64), nullable=False)
    ats_score = Column(Integer, default=0)
    score_breakdown_json = Column(Text, default="[]")
    extracted_skills_json = Column(Text, default="[]")
    matched_skills_json = Column(Text, default="[]")
    missing_skills_json = Column(Text, default="[]")
    missing_optional_skills_json = Column(Text, default="[]")
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]")
    sections_detected_json = Column(Text, default="[]")
    analysis_summary = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="resume_analyses")

    def _get_json(self, field: str, default: Any = list) -> Any:
        val = getattr(self, field, None)
        if not val:
            return default() if callable(default) else default
        try:
            return json.loads(val)
        except Exception:
            return default() if callable(default) else default

    def _set_json(self, field: str, val: Any) -> None:
        setattr(self, field, json.dumps(val) if val is not None else "[]")

    @property
    def score_breakdown(self) -> List[Dict[str, Any]]:
        return self._get_json("score_breakdown_json", list)

    @score_breakdown.setter
    def score_breakdown(self, val: List[Dict[str, Any]]):
        self._set_json("score_breakdown_json", val)

    @property
    def extracted_skills(self) -> List[str]:
        return self._get_json("extracted_skills_json", list)

    @extracted_skills.setter
    def extracted_skills(self, val: List[str]):
        self._set_json("extracted_skills_json", val)

    @property
    def matched_skills(self) -> List[str]:
        return self._get_json("matched_skills_json", list)

    @matched_skills.setter
    def matched_skills(self, val: List[str]):
        self._set_json("matched_skills_json", val)

    @property
    def missing_skills(self) -> List[str]:
        return self._get_json("missing_skills_json", list)

    @missing_skills.setter
    def missing_skills(self, val: List[str]):
        self._set_json("missing_skills_json", val)

    @property
    def missing_optional_skills(self) -> List[str]:
        return self._get_json("missing_optional_skills_json", list)

    @missing_optional_skills.setter
    def missing_optional_skills(self, val: List[str]):
        self._set_json("missing_optional_skills_json", val)

    @property
    def strengths(self) -> List[str]:
        return self._get_json("strengths_json", list)

    @strengths.setter
    def strengths(self, val: List[str]):
        self._set_json("strengths_json", val)

    @property
    def weaknesses(self) -> List[str]:
        return self._get_json("weaknesses_json", list)

    @weaknesses.setter
    def weaknesses(self, val: List[str]):
        self._set_json("weaknesses_json", val)

    @property
    def sections_detected(self) -> List[str]:
        return self._get_json("sections_detected_json", list)

    @sections_detected.setter
    def sections_detected(self, val: List[str]):
        self._set_json("sections_detected_json", val)


class InterviewExperience(Base):
    """
    Candidate-contributed real interview experience.
    """
    __tablename__ = "interview_experiences"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(128), nullable=False, index=True)
    experience_level = Column(String(32), default="entry", nullable=False)  # entry, mid, senior, lead
    round_type = Column(String(64), default="technical", nullable=False)  # technical, system_design, hr_behavioral, coding, managerial

    # Company & privacy disclosure
    company = Column(String(128), nullable=True)
    company_disclosure = Column(String(32), default="industry_only", nullable=False)  # specific, industry_only, anonymous
    industry = Column(String(128), default="Technology", nullable=True)

    difficulty = Column(String(32), default="medium", nullable=False)  # easy, medium, hard
    outcome = Column(String(32), default="undisclosed", nullable=True)  # offer, rejected, in_progress, declined, undisclosed

    experience_text = Column(Text, nullable=False)
    topics_json = Column(Text, default="[]", nullable=False)
    preparation_tips = Column(Text, nullable=True)
    resume_summary_json = Column(Text, default="{}", nullable=True)

    # Moderation & PII scanning
    moderation_status = Column(String(32), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    moderation_notes = Column(Text, nullable=True)
    pii_scan_status = Column(String(32), default="CLEAN", nullable=False)  # CLEAN, FLAGGED
    pii_detected_categories_json = Column(Text, default="[]", nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="interview_experiences")
    questions = relationship("InterviewExperienceQuestion", back_populates="experience", cascade="all, delete-orphan")

    def _get_json(self, field_name: str, default_factory=list):
        raw = getattr(self, field_name, None)
        if not raw:
            return default_factory()
        try:
            return json.loads(raw)
        except Exception:
            return default_factory()

    def _set_json(self, field_name: str, val):
        setattr(self, field_name, json.dumps(val or []))

    @property
    def topics(self) -> List[str]:
        return self._get_json("topics_json", list)

    @topics.setter
    def topics(self, val: List[str]):
        self._set_json("topics_json", val)

    @property
    def resume_summary(self) -> Dict[str, Any]:
        return self._get_json("resume_summary_json", dict)

    @resume_summary.setter
    def resume_summary(self, val: Dict[str, Any]):
        setattr(self, "resume_summary_json", json.dumps(val or {}))

    @property
    def pii_detected_categories(self) -> List[str]:
        return self._get_json("pii_detected_categories_json", list)

    @pii_detected_categories.setter
    def pii_detected_categories(self, val: List[str]):
        self._set_json("pii_detected_categories_json", val)


class InterviewExperienceQuestion(Base):
    """
    Specific question asked during a real interview experience.
    """
    __tablename__ = "interview_experience_questions"

    id = Column(String(64), primary_key=True, index=True)
    experience_id = Column(String(64), ForeignKey("interview_experiences.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    round_type = Column(String(64), default="technical", nullable=False)
    topic = Column(String(64), default="General", nullable=False)
    difficulty = Column(String(32), default="medium", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationship
    experience = relationship("InterviewExperience", back_populates="questions")


class WeeklyReport(Base):
    """
    Weekly AI Career Report summarizing progress, performance, gaps, and priorities.
    """
    __tablename__ = "weekly_reports"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    summary_json = Column(Text, nullable=False, default="{}")
    skills_progress_json = Column(Text, nullable=False, default="{}")
    interview_performance_json = Column(Text, nullable=False, default="{}")
    coding_performance_json = Column(Text, nullable=False, default="{}")
    areas_requiring_attention_json = Column(Text, nullable=False, default="[]")
    next_week_priorities_json = Column(Text, nullable=False, default="[]")
    readiness_summary_json = Column(Text, nullable=False, default="{}")
    ai_interpretation = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="weekly_reports")


class WeeklyGoal(Base):
    """
    Weekly learning commitments and target activities for candidates.
    """
    __tablename__ = "weekly_goals"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    week_start_date = Column(DateTime, nullable=False)
    target_interviews = Column(Integer, default=2, nullable=False)
    target_coding_drills = Column(Integer, default=3, nullable=False)
    target_daily_drills = Column(Integer, default=5, nullable=False)
    focus_skill = Column(String(128), nullable=True)
    interviews_completed = Column(Integer, default=0, nullable=False)
    coding_completed = Column(Integer, default=0, nullable=False)
    daily_drills_completed = Column(Integer, default=0, nullable=False)
    status = Column(String(32), default="active", nullable=False)  # active, completed, missed
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="weekly_goals")


class ProductFeedback(Base):
    """
    User feedback on product experience, bugs, features, and evaluation rubrics.
    """
    __tablename__ = "product_feedbacks"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(64), nullable=False)  # bug, interview_flow, scoring, feature_request, ui_ux, general
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5
    page_context = Column(String(128), nullable=True)
    status = Column(String(32), default="received", nullable=False)  # received, under_review, resolved
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="product_feedbacks")


def seed_initial_data(db):
    """
    Seeds default candidate account with honest starting defaults (0 XP, 0 streak)
    and populates initial skill taxonomy.
    """
    DEFAULT_USER_ID = "user-001"
    existing_user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()

    if not existing_user:
        # Create default candidate account
        default_user = User(
            id=DEFAULT_USER_ID,
            email="candidate@example.com",
            name="Candidate",
            role="AI/ML Engineer",
            target_role="Machine Learning Engineer",
            xp=0,
            level=1,
            streak=0,
            longest_streak=0
        )
        db.add(default_user)
        db.flush()

        # Create corresponding profile
        default_profile = Profile(
            user_id=DEFAULT_USER_ID,
            bio="Software and Machine Learning Engineer specializing in full-stack AI applications, LLMs, and autonomous agent systems.",
            target_company="Leading Technology Companies",
            experience_level="Entry to Mid Level",
            resume_headline="Machine Learning & Software Engineer"
        )
        db.add(default_profile)

        # Create default reminder preferences
        default_reminder = ReminderPreference(
            user_id=DEFAULT_USER_ID,
            enabled=False,
            time="19:00",
            preferred_time="19:00",
            method="email",
            email="candidate@example.com",
            timezone="UTC",
            frequency="daily",
            target_role="Machine Learning Engineer"
        )
        db.add(default_reminder)

    # Seed core skills taxonomy if empty
    if db.query(Skill).count() == 0:
        initial_skills = [
            # Machine Learning & AI
            Skill(name="Python", category="Foundational", importance="Critical", default_target_score=85),
            Skill(name="Machine Learning", category="Core ML", importance="Critical", default_target_score=80),
            Skill(name="Deep Learning", category="Core ML", importance="High", default_target_score=75),
            Skill(name="PyTorch / TensorFlow", category="Core ML", importance="High", default_target_score=75),
            # MLOps & Production
            Skill(name="Docker", category="MLOps & Deployment", importance="High", default_target_score=80),
            Skill(name="Kubernetes", category="MLOps & Deployment", importance="Medium", default_target_score=70),
            Skill(name="MLflow", category="MLOps & Deployment", importance="Medium", default_target_score=75),
            Skill(name="CI/CD Pipelines", category="MLOps & Deployment", importance="High", default_target_score=75),
            # Soft Skills & Systems
            Skill(name="System Design", category="System Design", importance="High", default_target_score=75),
            Skill(name="Communication (STAR)", category="Communication", importance="Critical", default_target_score=80),
            Skill(name="Problem Solving", category="Foundational", importance="Critical", default_target_score=85),
            Skill(name="Confidence & Articulation", category="Communication", importance="High", default_target_score=80),
        ]
        db.add_all(initial_skills)

    # Seed initial approved interview experiences for career preparation if empty
    if db.query(InterviewExperience).count() == 0:
        exp1 = InterviewExperience(
            id="exp-seed-001",
            user_id="user-001",
            role="Machine Learning Engineer",
            experience_level="mid",
            round_type="technical",
            company=None,
            company_disclosure="industry_only",
            industry="Artificial Intelligence & ML",
            difficulty="hard",
            outcome="offer",
            experience_text="The technical round was a deep dive into Transformer architectures, parameter-efficient fine-tuning (LoRA), and production latency bottlenecks under batch inference.",
            topics_json=json.dumps(["Transformers", "PyTorch", "LoRA", "Inference Optimization"]),
            preparation_tips="Be ready to explain the KV cache memory footprint formula and tradeoffs between quantized INT8/FP8 inference.",
            resume_summary_json=json.dumps({"years_exp": 2, "top_skills": ["Python", "PyTorch", "HuggingFace", "Docker"]}),
            moderation_status="APPROVED",
            moderation_notes="Verified seed experience for career preparation.",
            pii_scan_status="CLEAN",
            pii_detected_categories_json="[]"
        )
        db.add(exp1)
        db.flush()

        q1 = InterviewExperienceQuestion(
            id="expq-seed-001",
            experience_id="exp-seed-001",
            question_text="How does LoRA (Low-Rank Adaptation) reduce the trainable parameter count during LLM fine-tuning?",
            round_type="technical",
            topic="Transformers",
            difficulty="hard"
        )
        q2 = InterviewExperienceQuestion(
            id="expq-seed-002",
            experience_id="exp-seed-001",
            question_text="How do you calculate KV cache memory for an LLM with 32 attention heads, 128 hidden dim, and batch size 8 across 2048 sequence length?",
            round_type="technical",
            topic="Inference Optimization",
            difficulty="hard"
        )
        db.add_all([q1, q2])

        exp2 = InterviewExperience(
            id="exp-seed-002",
            user_id="user-001",
            role="Backend & Distributed Systems Engineer",
            experience_level="mid",
            round_type="system_design",
            company="Scalable Cloud Services",
            company_disclosure="specific",
            industry="Cloud Infrastructure",
            difficulty="medium",
            outcome="offer",
            experience_text="System design interview focusing on high-throughput distributed rate limiting and caching topologies with Redis Cluster and fallback circuit breakers.",
            topics_json=json.dumps(["System Design", "Redis", "Rate Limiting", "Distributed Systems"]),
            preparation_tips="Practice drawing system components clearly, calculating queries per second (QPS), and addressing cache stampedes.",
            resume_summary_json=json.dumps({"years_exp": 3, "top_skills": ["FastAPI", "Go", "Redis", "Kafka"]}),
            moderation_status="APPROVED",
            moderation_notes="Verified seed experience for system design preparation.",
            pii_scan_status="CLEAN",
            pii_detected_categories_json="[]"
        )
        db.add(exp2)
        db.flush()

        q3 = InterviewExperienceQuestion(
            id="expq-seed-003",
            experience_id="exp-seed-002",
            question_text="How do you design a distributed rate limiter supporting 100,000 requests per second across multiple data centers?",
            round_type="system_design",
            topic="System Design",
            difficulty="hard"
        )
        q4 = InterviewExperienceQuestion(
            id="expq-seed-004",
            experience_id="exp-seed-002",
            question_text="What are the concurrency challenges with Redis INCR and EXPIRE in a sliding window log rate limiter, and how can Lua scripts solve them?",
            round_type="technical",
            topic="Redis",
            difficulty="medium"
        )
        db.add_all([q3, q4])

    db.commit()
