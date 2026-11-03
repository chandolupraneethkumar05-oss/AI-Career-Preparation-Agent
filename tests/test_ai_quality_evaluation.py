"""
Quantitative AI Quality, RAG Retrieval & Hallucination Prevention Benchmark
AI Career Preparation Agent

Evaluates:
1. Retrieval Relevance (Precision & Confidence Thresholding)
2. Factual Grounding (Source Attribution & Knowledge Citation)
3. Hallucination Guard Efficacy on Out-of-Domain / Unsupported Queries
4. Multi-run Consistency & Determinism
5. Fallback Cascade Graceful Degradation
"""

import os
import sys
import unittest
from typing import Dict, Any, List

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.database import SessionLocal, init_db
from app.db.models import User
from app.schemas.ai import AskAIRequest
from app.services.ai.ai_orchestrator import ai_orchestrator
from app.services.ai.rag.retrieval_service import default_retrieval_service
from app.services.ai.llm.llm_service import LocalGroundedLLMService


# Standardized Benchmark Evaluation Dataset
EVALUATION_DATASET = [
    # Supported Technical & Behavioral Topics
    {
        "id": "sup-01",
        "category": "machine_learning",
        "query": "What is ROC-AUC and how is it used to evaluate classification models?",
        "expected_topics": ["evaluation", "metrics", "roc", "auc", "classification"],
        "is_supported": True,
        "min_relevance_threshold": 0.10
    },
    {
        "id": "sup-02",
        "category": "behavioral",
        "query": "How do I structure behavioral answers using the STAR method?",
        "expected_topics": ["behavioral", "star", "communication", "situation", "task"],
        "is_supported": True,
        "min_relevance_threshold": 0.10
    },
    {
        "id": "sup-03",
        "category": "databases",
        "query": "Explain how database indexing works with B-trees to speed up queries.",
        "expected_topics": ["database", "index", "b-tree", "sql", "performance"],
        "is_supported": True,
        "min_relevance_threshold": 0.10
    },
    {
        "id": "sup-04",
        "category": "system_design",
        "query": "How do idempotency keys prevent duplicate payments in distributed systems?",
        "expected_topics": ["distributed", "system design", "idempotency", "api", "concurrency"],
        "is_supported": True,
        "min_relevance_threshold": 0.10
    },
    # Unsupported / Out-of-Domain Queries (Must trigger Hallucination Guard)
    {
        "id": "unsup-01",
        "category": "culinary",
        "query": "What is the recipe for baking a traditional chocolate souffle?",
        "expected_topics": [],
        "is_supported": False,
        "min_relevance_threshold": 0.0
    },
    {
        "id": "unsup-02",
        "category": "mythology",
        "query": "What is the political structure of the lost underwater city of Atlantis?",
        "expected_topics": [],
        "is_supported": False,
        "min_relevance_threshold": 0.0
    },
    {
        "id": "unsup-03",
        "category": "music_history",
        "query": "Analyze harmonic chord progressions in 16th century Renaissance lute compositions.",
        "expected_topics": [],
        "is_supported": False,
        "min_relevance_threshold": 0.0
    }
]


class TestAIQualityAndHallucinationBenchmark(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        with SessionLocal() as db:
            if not db.query(User).filter(User.id == "eval-user-01").first():
                eval_user = User(
                    id="eval-user-01",
                    email="evaluator@test.ai",
                    name="AI Quality Auditor",
                    target_role="Machine Learning Engineer"
                )
                db.add(eval_user)
                db.commit()

    def test_01_retrieval_relevance_and_confidence_scoring(self):
        """Verifies that supported queries retrieve high-confidence grounded chunks."""
        for item in EVALUATION_DATASET:
            if not item["is_supported"]:
                continue
            res = default_retrieval_service.retrieve_relevant_knowledge(
                query=item["query"],
                user_context={"target_role": "Machine Learning Engineer"},
                top_k=3,
                threshold=0.08
            )
            self.assertFalse(
                res["insufficient_knowledge"],
                f"Supported query '{item['query']}' was incorrectly marked as insufficient knowledge."
            )
            self.assertGreater(len(res["chunks"]), 0)
            self.assertGreaterEqual(
                res["top_score"],
                item["min_relevance_threshold"],
                f"Top score {res['top_score']} fell below threshold {item['min_relevance_threshold']} for query '{item['query']}'"
            )

    def test_02_hallucination_guard_on_unsupported_queries(self):
        """CRITICAL: Verifies out-of-domain queries activate hallucination guard instead of fabricating facts."""
        with SessionLocal() as db:
            for item in EVALUATION_DATASET:
                if item["is_supported"]:
                    continue
                req = AskAIRequest(
                    user_id="eval-user-01",
                    message=item["query"],
                    language="en"
                )
                response = ai_orchestrator.process_query(req, db=db)

                # Assertion 1: Must explicitly state absence of grounded documentation
                answer_lower = response.answer.lower()
                has_guard_notice = (
                    "no verified" in answer_lower
                    or "no verified grounded documentation" in answer_lower
                    or "prevent inaccurate answers" in answer_lower
                    or "do not generate ungrounded" in answer_lower
                    or "hallucination guard" in answer_lower
                )
                self.assertTrue(
                    has_guard_notice,
                    f"Unsupported query '{item['query']}' failed to trigger hallucination guard. Response: {response.answer}"
                )

                # Assertion 2: Must NOT claim grounded curriculum sources for unsupported topics
                self.assertEqual(
                    len(response.sources),
                    0,
                    f"Unsupported query '{item['query']}' should not produce grounded sources."
                )

    def test_03_factual_grounding_and_attribution(self):
        """Verifies supported queries link response text to verified curriculum sources."""
        with SessionLocal() as db:
            req = AskAIRequest(
                user_id="eval-user-01",
                message="Explain the STAR framework for interview communication",
                language="en"
            )
            resp = ai_orchestrator.process_query(req, db=db)

            self.assertTrue(resp.grounded)
            self.assertGreater(len(resp.sources), 0)
            source_match = any("STAR" in s.title or "Behavioral" in s.category or "Communication" in s.topic for s in resp.sources)
            self.assertTrue(source_match, "Retrieved sources did not match expected STAR topic taxonomy.")

    def test_04_evaluation_metric_measurability_and_consistency(self):
        """Ensures identical queries yield measurable, consistent scores and identical structure across multiple runs."""
        local_engine = LocalGroundedLLMService()
        user_ctx = {"target_role": "Machine Learning Engineer", "candidate_name": "Auditor"}
        chunks = [
            {"id": "c1", "title": "ROC-AUC Analysis", "category": "ML", "topic": "Evaluation", "content": "ROC curve plots TPR vs FPR."}
        ]

        run1 = local_engine.generate_grounded_response("What is ROC-AUC?", user_ctx, chunks)
        run2 = local_engine.generate_grounded_response("What is ROC-AUC?", user_ctx, chunks)

        self.assertEqual(run1["answer"], run2["answer"])
        self.assertEqual(run1["key_points"], run2["key_points"])
        self.assertEqual(run1["recommended_action"]["title"], run2["recommended_action"]["title"])


if __name__ == "__main__":
    unittest.main()
