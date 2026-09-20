"""Schemas package initialization"""

from .profile import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    ProfileBase,
    ProfileUpdate,
    ProfileResponse,
    CandidateFullProfileResponse
)

from .activity import (
    ActivityBase,
    ActivityCreate,
    ActivityResponse,
    ActivityListResponse
)

from .interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewDetailResponse,
    InterviewListResponse,
    InterviewRubrics,
    InterviewStartRequest,
    InterviewQuestionResponse,
    InterviewSessionResponse,
    SubmitAnswerRequest,
    AnswerEvaluationResponse,
    NextQuestionDecision,
    AnswerSubmissionResponse,
    FinalInterviewReportResponse
)

from .skill import (
    SkillBase,
    SkillResponse,
    SkillGapBase,
    SkillGapCreate,
    SkillGapResponse,
    RadarAxisScore,
    SkillProfileResponse,
    UnifiedSkillItem,
    UnifiedSkillProfileResponse,
    SkillEvidenceBase,
    SkillEvidenceCreate,
    SkillEvidenceResponse
)

from .challenge import (
    DailyChallengeResponse,
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    ChallengeHistoryItem,
    ChallengeHistoryResponse
)

from .recommendation import (
    NextBestActionResponse,
    RecommendationItem,
    DashboardProgressResponse
)

from .reminder import (
    ReminderPreferenceBase,
    ReminderPreferenceUpdate,
    ReminderPreferenceResponse,
    ReminderStatusResponse,
    ReminderLogResponse,
    ReminderTestRequest,
    ReminderTestResponse
)

from .ai import (
    AskAIRequest,
    SourceReference,
    RecommendedAction,
    AskAIResponse,
    KnowledgeCategorySummary,
    KnowledgeSourcesResponse,
    AIStatusResponse
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "ProfileBase",
    "ProfileUpdate",
    "ProfileResponse",
    "CandidateFullProfileResponse",
    "ActivityBase",
    "ActivityCreate",
    "ActivityResponse",
    "ActivityListResponse",
    "InterviewCreate",
    "InterviewResponse",
    "InterviewDetailResponse",
    "InterviewListResponse",
    "InterviewRubrics",
    "SkillBase",
    "SkillResponse",
    "SkillGapBase",
    "SkillGapCreate",
    "SkillGapResponse",
    "RadarAxisScore",
    "SkillProfileResponse",
    "DailyChallengeResponse",
    "ChallengeSubmitRequest",
    "ChallengeSubmitResponse",
    "ChallengeHistoryItem",
    "ChallengeHistoryResponse",
    "NextBestActionResponse",
    "RecommendationItem",
    "DashboardProgressResponse",
    "ReminderPreferenceBase",
    "ReminderPreferenceUpdate",
    "ReminderPreferenceResponse",
    "ReminderStatusResponse",
    "ReminderLogResponse",
    "ReminderTestRequest",
    "ReminderTestResponse",
    "ResumeScoreBreakdownItem",
    "ResumeAnalysisResponse",
    "ResumeAnalysisSummary",
    "ResumeHistoryResponse",
    "AskAIRequest",
    "SourceReference",
    "RecommendedAction",
    "AskAIResponse",
    "KnowledgeCategorySummary",
    "KnowledgeSourcesResponse",
    "AIStatusResponse"
]
