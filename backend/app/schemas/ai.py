"""
Pydantic Schemas for RAG + LLM Career Intelligence System
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AskAIRequest(BaseModel):
    user_id: str = Field(default="user-001", description="Candidate user ID")
    message: str = Field(..., min_length=2, max_length=2000, description="Career or technical question")
    language: Optional[str] = Field(default="en", description="Preferred response language (en, te, hi)")
    topic: Optional[str] = Field(default=None, description="Optional topic hint")


class SourceReference(BaseModel):
    id: str
    title: str
    category: str
    topic: str
    difficulty: str
    source: str
    relevance_score: float

    model_config = ConfigDict(from_attributes=True)


class RecommendedAction(BaseModel):
    title: str
    action: str
    route: str
    action_type: str
    reason: str


class AskAIResponse(BaseModel):
    answer: str
    key_points: List[str]
    recommended_action: Optional[RecommendedAction] = None
    sources: List[SourceReference]
    language: str
    career_context_applied: Optional[str] = None
    grounded: bool = True
    model_provider: str = "local-grounded-engine"
    latency_ms: Optional[float] = None


class KnowledgeCategorySummary(BaseModel):
    category: str
    chunk_count: int
    topics: List[str]
    difficulties: List[str]


class KnowledgeSourcesResponse(BaseModel):
    total_categories: int
    total_chunks: int
    categories: List[KnowledgeCategorySummary]


class AIStatusResponse(BaseModel):
    status: str
    llm_provider: str
    embedding_provider: str
    total_knowledge_chunks: int
    supported_languages: List[str]
    rag_active: bool
