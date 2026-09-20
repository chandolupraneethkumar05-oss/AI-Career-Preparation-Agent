"""
AI Career Intelligence Orchestrator
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Coordinates:
User State -> Career Context Builder -> RAG Vector Retrieval -> Grounded LLM -> Structured Response
"""

import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ...schemas.ai import (
    AskAIRequest,
    AskAIResponse,
    SourceReference,
    RecommendedAction,
    KnowledgeSourcesResponse,
    KnowledgeCategorySummary,
    AIStatusResponse
)
from .career.career_context_builder import build_user_career_context
from .rag.retrieval_service import default_retrieval_service
from .rag.knowledge_base import KNOWLEDGE_CHUNKS
from .llm.llm_service import default_llm_service, get_llm_service


class AIOrchestrator:
    """
    Central coordinator for Career Learning Assistant queries,
    RAG indexing, and model routing.
    """

    def __init__(self):
        self.retrieval_service = default_retrieval_service
        self.llm_service = default_llm_service
        self.knowledge_chunks = KNOWLEDGE_CHUNKS

    def process_query(self, request: AskAIRequest, db: Session) -> AskAIResponse:
        """
        Executes complete RAG + Career Context + LLM workflow for candidate question.
        """
        user_id = request.user_id or "user-001"
        query_text = request.message.strip()
        lang = request.language or "en"

        # 1. Build sanitized User Career Context
        user_context = build_user_career_context(user_id=user_id, db=db)

        # 2. Retrieve grounded curriculum chunks
        retrieval_result = self.retrieval_service.retrieve_relevant_knowledge(
            query=query_text,
            user_context=user_context,
            top_k=3
        )

        retrieved_chunks = retrieval_result.get("chunks", [])

        # 3. Grounded LLM Response Generation
        raw_output = self.llm_service.generate_grounded_response(
            query=query_text,
            user_context=user_context,
            retrieved_chunks=retrieved_chunks,
            language=lang
        )

        # 4. Format Pydantic schemas
        sources = [
            SourceReference(
                id=s["id"],
                title=s["title"],
                category=s["category"],
                topic=s["topic"],
                difficulty=s["difficulty"],
                source=s["source"],
                relevance_score=s["relevance_score"]
            )
            for s in raw_output.get("sources", [])
        ]

        rec_act = None
        raw_rec = raw_output.get("recommended_action")
        if raw_rec:
            rec_act = RecommendedAction(
                title=raw_rec.get("title", "Practice Challenge"),
                action=raw_rec.get("action", "Take Challenge"),
                route=raw_rec.get("route", "/daily-challenge"),
                action_type=raw_rec.get("action_type", "practice"),
                reason=raw_rec.get("reason", "Reinforce your preparation.")
            )

        return AskAIResponse(
            answer=raw_output.get("answer", ""),
            key_points=raw_output.get("key_points", []),
            recommended_action=rec_act,
            sources=sources,
            language=lang,
            career_context_applied=raw_output.get("career_context_applied"),
            grounded=raw_output.get("grounded", True),
            model_provider=raw_output.get("model_provider", "local-grounded-engine"),
            latency_ms=raw_output.get("latency_ms")
        )

    def get_knowledge_sources_summary(self) -> KnowledgeSourcesResponse:
        """Returns structured index of available RAG curriculum knowledge."""
        cat_map: Dict[str, Dict[str, Any]] = {}
        for chunk in self.knowledge_chunks:
            cat = chunk["category"]
            if cat not in cat_map:
                cat_map[cat] = {
                    "topics": set(),
                    "difficulties": set(),
                    "count": 0
                }
            cat_map[cat]["topics"].add(chunk["topic"])
            cat_map[cat]["difficulties"].add(chunk["difficulty"])
            cat_map[cat]["count"] += 1

        summaries = [
            KnowledgeCategorySummary(
                category=cat,
                chunk_count=data["count"],
                topics=sorted(list(data["topics"])),
                difficulties=sorted(list(data["difficulties"]))
            )
            for cat, data in sorted(cat_map.items())
        ]

        return KnowledgeSourcesResponse(
            total_categories=len(summaries),
            total_chunks=len(self.knowledge_chunks),
            categories=summaries
        )

    def get_ai_status(self) -> AIStatusResponse:
        """Returns live status of the AI subsystem."""
        return AIStatusResponse(
            status="operational",
            llm_provider=self.llm_service.__class__.__name__,
            embedding_provider=self.retrieval_service.embedding_service.__class__.__name__,
            total_knowledge_chunks=len(self.knowledge_chunks),
            supported_languages=["en", "te", "hi", "es"],
            rag_active=True
        )


# Shared singleton instance
ai_orchestrator = AIOrchestrator()
