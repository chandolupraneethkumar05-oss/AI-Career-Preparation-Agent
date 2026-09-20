"""
RAG Context-Aware Retrieval Service
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Retrieves relevant career knowledge chunks using vector similarity
and conditions ranking on candidate target role, skill gaps, and experience level.
Dynamically integrates approved candidate-contributed real interview experiences
with explicit source attribution and disclaimers.
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np

from .knowledge_base import KNOWLEDGE_CHUNKS
from .embedding_service import default_embedding_service, BaseEmbeddingService

logger = logging.getLogger("rag_retrieval")


class RetrievalService:
    """
    Orchestrates vector indexing and personalized knowledge retrieval.
    Includes static career knowledge and dynamic approved real interview experiences.
    """

    def __init__(self, embedding_service: Optional[BaseEmbeddingService] = None):
        self.embedding_service = embedding_service or default_embedding_service
        self.base_chunks: List[Dict[str, Any]] = [dict(c) for c in KNOWLEDGE_CHUNKS]
        for c in self.base_chunks:
            if "source_type" not in c:
                c["source_type"] = "curated_knowledge"
        self.dynamic_chunks: List[Dict[str, Any]] = []
        self.chunks: List[Dict[str, Any]] = []
        self.chunk_embeddings = np.array([])
        self.refresh_dynamic_chunks()

    def _load_approved_experience_chunks(self) -> List[Dict[str, Any]]:
        """Queries approved real interview experiences and questions from the database."""
        try:
            from ....db.database import SessionLocal
            from ....db.models import InterviewExperience
            with SessionLocal() as db:
                approved_exps = db.query(InterviewExperience).filter(
                    InterviewExperience.moderation_status == "APPROVED"
                ).all()

                chunks = []
                for exp in approved_exps:
                    q_texts = [q.question_text for q in (exp.questions or [])]
                    q_summary = "; ".join(q_texts[:5]) if q_texts else "None recorded"
                    disclosure = exp.company_disclosure or "industry_only"
                    if disclosure == "specific" and exp.company:
                        company_label = exp.company.strip()
                    elif disclosure == "industry_only":
                        company_label = f"{exp.industry or 'Tech'} Industry"
                    else:
                        company_label = "Anonymous Company"

                    exp_chunk = {
                        "id": f"real-exp-{exp.id}",
                        "title": f"Real Candidate Experience: {exp.role} ({company_label})",
                        "category": "Real Interview Experiences",
                        "topic": exp.topics[0] if exp.topics else "Interview Experience",
                        "content": (
                            f"Real interview experience for {exp.role} ({exp.round_type} round, {exp.difficulty} difficulty). "
                            f"Account: {exp.experience_text}. Tips: {exp.preparation_tips or 'N/A'}. "
                            f"Questions asked: {q_summary}"
                        ),
                        "applicable_roles": [exp.role],
                        "key_takeaways": [
                            f"Round: {exp.round_type}",
                            f"Difficulty: {exp.difficulty}",
                            f"Questions Count: {len(q_texts)}"
                        ],
                        "source_type": "real_interview_experience",
                        "source_disclaimer": "Based on candidate-contributed interview experiences; interview processes and questions vary and are not guaranteed company questions."
                    }
                    chunks.append(exp_chunk)

                    for q in (exp.questions or []):
                        chunks.append({
                            "id": f"real-expq-{q.id}",
                            "title": f"Real Interview Question: {q.topic} ({exp.role})",
                            "category": "Real Interview Experiences",
                            "topic": q.topic,
                            "content": f"Real interview question for {exp.role} ({q.round_type} round): {q.question_text}",
                            "applicable_roles": [exp.role],
                            "key_takeaways": [f"Round: {q.round_type}", f"Difficulty: {q.difficulty}"],
                            "source_type": "real_interview_experience",
                            "source_disclaimer": "Based on candidate-contributed interview experiences; interview processes and questions vary and are not guaranteed company questions."
                        })
                return chunks
        except Exception as e:
            logger.debug(f"Could not load dynamic interview experience chunks: {e}")
            return []

    def refresh_dynamic_chunks(self):
        """Refreshes knowledge chunks with latest approved experiences and re-indexes embeddings."""
        self.dynamic_chunks = self._load_approved_experience_chunks()
        self.chunks = self.base_chunks + self.dynamic_chunks
        self._precompute_chunk_embeddings()
        logger.info(f"RAG Knowledge Base reloaded: {len(self.base_chunks)} base chunks, {len(self.dynamic_chunks)} dynamic experience chunks.")

    def _precompute_chunk_embeddings(self):
        """Generates and caches normalized embeddings for all knowledge chunks."""
        texts = [
            f"{c['title']} {c['category']} {c['topic']} {c['content']}"
            for c in self.chunks
        ]
        self.chunk_embeddings = self.embedding_service.embed_batch(texts)

    def retrieve_relevant_knowledge(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None,
        top_k: int = 3,
        threshold: float = 0.10
    ) -> Dict[str, Any]:
        """
        Retrieves top_k knowledge chunks most relevant to query and candidate career state.
        Applies target role and critical skill gap weighting.
        """
        if not query or not query.strip():
            return {
                "chunks": [],
                "insufficient_knowledge": True,
                "query": query,
                "reason": "Empty query"
            }

        query_vec = self.embedding_service.embed_text(query.strip())
        target_role = user_context.get("target_role") if user_context else None
        urgent_gap = (user_context.get("urgent_gap") or "").lower() if user_context else ""
        missing_skills = [s.lower() for s in user_context.get("missing_skills", [])] if user_context else []
        high_gaps = [s.lower() for s in user_context.get("high_priority_gaps", [])] if user_context else []
        all_gaps = set(missing_skills + high_gaps)
        if urgent_gap:
            all_gaps.add(urgent_gap)

        scored_chunks = []
        for chunk, chunk_vec in zip(self.chunks, self.chunk_embeddings):
            base_sim = self.embedding_service.compute_similarity(query_vec, chunk_vec)

            # Context Re-ranking Boosts
            boost = 1.0

            # 1. Target Role Alignment (+15% boost)
            if target_role and target_role in chunk.get("applicable_roles", []):
                boost += 0.15

            # 2. Critical Skill Gap Alignment (+25% boost if chunk bridges user's identified gap)
            chunk_topic = chunk.get("topic", "").lower()
            chunk_cat = chunk.get("category", "").lower()
            chunk_content = chunk.get("content", "").lower()

            if any(gap in chunk_topic or gap in chunk_cat or gap in chunk_content for gap in all_gaps):
                boost += 0.25

            final_score = min(1.0, base_sim * boost)

            scored_chunks.append({
                "chunk": chunk,
                "base_score": round(base_sim, 4),
                "relevance_score": round(final_score, 4)
            })

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)

        # Check threshold
        top_candidates = [
            item for item in scored_chunks
            if item["relevance_score"] >= threshold and item["base_score"] > 0.02
        ][:top_k]

        if not top_candidates:
            return {
                "chunks": [],
                "insufficient_knowledge": True,
                "query": query,
                "top_score": scored_chunks[0]["relevance_score"] if scored_chunks else 0.0,
                "reason": "No retrieved chunks met confidence threshold"
            }

        # Format output items
        result_chunks = []
        for item in top_candidates:
            c = dict(item["chunk"])
            c["relevance_score"] = item["relevance_score"]
            c["base_score"] = item["base_score"]
            result_chunks.append(c)

        return {
            "chunks": result_chunks,
            "insufficient_knowledge": False,
            "query": query,
            "top_score": result_chunks[0]["relevance_score"],
            "top_category": result_chunks[0]["category"]
        }


# Singleton instance
default_retrieval_service = RetrievalService()
