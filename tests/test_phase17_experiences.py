"""
Test Suite for Phase 17 — Real Interview Experiences & Question Knowledge Base
AI Career Preparation Agent
"""

import os
import sys
import unittest

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.database import SessionLocal, init_db
from app.db.models import User, InterviewExperience, InterviewExperienceQuestion
from app.schemas.experience import (
    InterviewExperienceCreate,
    InterviewExperienceUpdate,
    ExperienceQuestionCreate,
    ExperienceModerateRequest
)
from app.services.pii_detection_service import scan_text_pii, scan_submission_pii
from app.services.experience_service import (
    create_experience,
    get_approved_experiences,
    get_user_experiences,
    get_experience_by_id,
    update_experience,
    delete_experience,
    moderate_experience,
    get_approved_questions
)
from app.services.ai.rag.retrieval_service import default_retrieval_service


class TestPhase17InterviewExperiences(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.db = SessionLocal()
        # Clean up existing test records if any
        self.db.query(InterviewExperienceQuestion).delete()
        self.db.query(InterviewExperience).delete()
        self.db.commit()

        # Ensure test users exist
        u1 = self.db.query(User).filter(User.id == "user-001").first()
        if not u1:
            u1 = User(id="user-001", email="candidate@example.com", name="Candidate")
            self.db.add(u1)

        u2 = self.db.query(User).filter(User.id == "user-002").first()
        if not u2:
            u2 = User(id="user-002", email="other.user@example.com", name="Other Candidate")
            self.db.add(u2)

        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_pii_scanner_clean_and_flagged(self):
        """Verify deterministic PII detection for email, phone, secrets, sensitive IDs."""
        clean_text = "I was asked about implementing a binary search tree and designing a rate limiter."
        is_clean, cats, snips = scan_text_pii(clean_text)
        self.assertTrue(is_clean)
        self.assertEqual(len(cats), 0)

        # Email detection
        email_text = "Contact me at candidate@example.com for further discussion."
        is_clean, cats, snips = scan_text_pii(email_text)
        self.assertFalse(is_clean)
        self.assertIn("email", cats)

        # Phone detection
        phone_text = "Call me at +91 9876543210 or 9876543210."
        is_clean, cats, snips = scan_text_pii(phone_text)
        self.assertFalse(is_clean)
        self.assertIn("phone_number", cats)

        # Secret token detection
        token_text = "I accidentally exposed bearer secret_test_token_for_mock_pii_scanner in my prompt."
        is_clean, cats, snips = scan_text_pii(token_text)
        self.assertFalse(is_clean)
        self.assertIn("secret_token", cats)

        # Whole submission scanning
        sub_data = {
            "role": "MLOps Engineer",
            "experience_text": "Normal text",
            "preparation_tips": "Check my credentials at https://internal.dev?token=secret123",
            "questions": [{"question_text": "How do you deploy PyTorch models with Docker?"}]
        }
        res = scan_submission_pii(sub_data)
        self.assertFalse(res["is_clean"])
        self.assertEqual(res["pii_scan_status"], "FLAGGED")
        self.assertIn("sensitive_url", res["detected_categories"])

    def test_02_create_experience_defaults_to_pending(self):
        """Verify submission defaults to PENDING and links questions correctly."""
        payload = InterviewExperienceCreate(
            role="Machine Learning Engineer",
            experience_level="entry",
            round_type="technical",
            company="DeepMind",
            company_disclosure="industry_only",
            industry="Artificial Intelligence",
            difficulty="hard",
            outcome="offer",
            experience_text="The interview consisted of 2 rounds focusing on Transformer attention and distributed training.",
            topics=["Transformers", "PyTorch", "Distributed Training"],
            preparation_tips="Review multi-head self-attention math and gradient checkpointing.",
            resume_summary={"years_exp": 1, "top_skills": ["PyTorch", "Python"]},
            questions=[
                ExperienceQuestionCreate(
                    question_text="Explain the difference between Pre-LN and Post-LN Transformers.",
                    round_type="technical",
                    topic="Transformers",
                    difficulty="hard"
                ),
                ExperienceQuestionCreate(
                    question_text="How would you implement gradient accumulation with PyTorch DDP?",
                    round_type="coding",
                    topic="PyTorch",
                    difficulty="hard"
                )
            ]
        )

        res = create_experience(self.db, user_id="user-001", payload=payload)
        self.assertEqual(res["moderation_status"], "PENDING")
        self.assertEqual(res["pii_scan_status"], "CLEAN")
        self.assertEqual(res["role"], "Machine Learning Engineer")
        self.assertEqual(len(res["questions"]), 2)
        self.assertEqual(res["display_company"], "Artificial Intelligence Industry") # industry_only disclosure

    def test_03_moderation_isolation_and_approval(self):
        """Verify unapproved experiences are NOT public, and only approved experiences show up."""
        payload = InterviewExperienceCreate(
            role="Backend Engineer",
            experience_level="mid",
            round_type="technical",
            company="Stripe",
            company_disclosure="specific",
            industry="Fintech",
            difficulty="medium",
            experience_text="Focused on idempotency and database isolation levels under concurrent requests.",
            topics=["FastAPI", "PostgreSQL", "Concurrence"],
            questions=[
                ExperienceQuestionCreate(
                    question_text="How do you guarantee idempotency in payment webhook processing?",
                    round_type="technical",
                    topic="System Design",
                    difficulty="medium"
                )
            ]
        )

        created = create_experience(self.db, user_id="user-001", payload=payload)
        exp_id = created["id"]

        # Before moderation: public browsing must be empty
        public_items = get_approved_experiences(self.db)
        self.assertEqual(public_items["total"], 0)

        # Before moderation: questions endpoint must be empty
        public_qs = get_approved_questions(self.db)
        self.assertEqual(public_qs["total"], 0)

        # Author can see under user experiences
        user_items = get_user_experiences(self.db, user_id="user-001")
        self.assertEqual(len(user_items), 1)
        self.assertEqual(user_items[0]["id"], exp_id)

        # Approve experience via moderation
        mod_res = moderate_experience(self.db, exp_id, ExperienceModerateRequest(status="APPROVED", notes="High quality submission."))
        self.assertEqual(mod_res["moderation_status"], "APPROVED")

        # Now public browsing returns 1 experience
        public_items_after = get_approved_experiences(self.db)
        self.assertEqual(public_items_after["total"], 1)
        self.assertEqual(public_items_after["items"][0]["display_company"], "Stripe")

        # Questions endpoint returns the approved question
        public_qs_after = get_approved_questions(self.db)
        self.assertEqual(public_qs_after["total"], 1)
        self.assertIn("idempotency", public_qs_after["items"][0]["question_text"])

    def test_04_ownership_and_reset_on_edit(self):
        """Verify editing enforces author ownership and resets status to PENDING."""
        payload = InterviewExperienceCreate(
            role="Data Scientist",
            experience_text="Initial walkthrough describing feature engineering and XGBoost evaluation.",
            topics=["XGBoost", "Python"],
            questions=[ExperienceQuestionCreate(question_text="How does XGBoost handle missing values?")]
        )
        created = create_experience(self.db, user_id="user-001", payload=payload)
        exp_id = created["id"]

        # Approve it first
        moderate_experience(self.db, exp_id, ExperienceModerateRequest(status="APPROVED"))
        self.assertEqual(self.db.query(InterviewExperience).get(exp_id).moderation_status, "APPROVED")

        # User-002 attempts to edit User-001's experience -> PermissionError
        with self.assertRaises(PermissionError):
            update_experience(self.db, exp_id, user_id="user-002", payload=InterviewExperienceUpdate(role="Hacked Role"))

        # User-001 edits their experience -> moderation resets to PENDING
        updated = update_experience(
            self.db,
            exp_id,
            user_id="user-001",
            payload=InterviewExperienceUpdate(
                experience_text="Updated walkthrough with enhanced detail on hyperparameter tuning and cross validation."
            )
        )
        self.assertEqual(updated["moderation_status"], "PENDING")
        self.assertIn("enhanced detail", updated["experience_text"])

        # Public browsing no longer shows it because it reset to PENDING
        public_items = get_approved_experiences(self.db)
        self.assertEqual(public_items["total"], 0)

    def test_05_rag_integration_with_attribution(self):
        """Verify approved real experiences and questions are retrievable by RAG with disclaimer."""
        payload = InterviewExperienceCreate(
            role="MLOps Engineer",
            company="Kubeflow Open Source",
            company_disclosure="specific",
            difficulty="hard",
            experience_text="Extensive discussion on ML model deployment with Docker, Kubernetes, and Triton Inference Server.",
            topics=["Docker", "Kubernetes", "MLOps"],
            preparation_tips="Practice writing Kubernetes manifests and configuring Triton model repositories.",
            questions=[
                ExperienceQuestionCreate(
                    question_text="How do you handle dynamic batching in Triton Inference Server?",
                    round_type="technical",
                    topic="MLOps",
                    difficulty="hard"
                )
            ]
        )
        created = create_experience(self.db, user_id="user-001", payload=payload)
        exp_id = created["id"]

        # Approve experience to load into RAG
        moderate_experience(self.db, exp_id, ExperienceModerateRequest(status="APPROVED"))

        # Query RAG for Triton dynamic batching
        rag_result = default_retrieval_service.retrieve_relevant_knowledge(
            query="Triton dynamic batching in Kubernetes and Docker",
            user_context={"target_role": "MLOps Engineer"}
        )

        self.assertFalse(rag_result["insufficient_knowledge"])
        self.assertGreater(len(rag_result["chunks"]), 0)

        # Check if real experience chunk is present in results
        real_chunks = [c for c in rag_result["chunks"] if c.get("source_type") == "real_interview_experience"]
        self.assertGreater(len(real_chunks), 0)
        self.assertIn("Based on candidate-contributed interview experiences", real_chunks[0]["source_disclaimer"])

    def test_06_deletion_cascade(self):
        """Verify deleting an experience cascades to its questions."""
        payload = InterviewExperienceCreate(
            role="DevOps Engineer",
            experience_text="CI/CD pipeline and infrastructure as code.",
            questions=[
                ExperienceQuestionCreate(question_text="Terraform vs Pulumi tradeoffs?"),
                ExperienceQuestionCreate(question_text="How to structure GitHub Actions reusable workflows?")
            ]
        )
        created = create_experience(self.db, user_id="user-001", payload=payload)
        exp_id = created["id"]

        # Questions exist
        q_count = self.db.query(InterviewExperienceQuestion).filter(
            InterviewExperienceQuestion.experience_id == exp_id
        ).count()
        self.assertEqual(q_count, 2)

        # User-002 cannot delete User-001's experience
        with self.assertRaises(PermissionError):
            delete_experience(self.db, exp_id, user_id="user-002")

        # User-001 deletes
        success = delete_experience(self.db, exp_id, user_id="user-001")
        self.assertTrue(success)

        # Questions should be deleted
        q_count_after = self.db.query(InterviewExperienceQuestion).filter(
            InterviewExperienceQuestion.experience_id == exp_id
        ).count()
        self.assertEqual(q_count_after, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
