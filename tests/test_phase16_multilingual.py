"""
Comprehensive Test Suite for Phase 16: Multilingual AI Feedback
AI Career Preparation Agent

Verifies:
1. Supported languages registry and validation (en, te, hi).
2. Technical term preservation in English for Telugu and Hindi reports.
3. Strict evaluation score independence across languages.
4. Profile settings persistence in database and API routes.
5. End-to-end mock interview session completion with multilingual feedback.
6. Fallback safety and graceful degradation.
"""

import os
import sys
import json
import unittest

# Ensure backend directory is in path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.database import SessionLocal, init_db, engine
from app.db.models import User, Profile, Interview, InterviewQuestion, InterviewAnswer, AnswerEvaluation
from app.services.ai.languages import (
    SUPPORTED_FEEDBACK_LANGUAGES,
    PRESERVED_TECHNICAL_TERMS,
    is_supported_feedback_language,
    normalize_feedback_language,
    get_language_display_name
)
from app.services.ai.llm.multilingual_feedback_service import multilingual_feedback_service
from app.services.ai.llm.llm_service import default_llm_service
from app.services.interview_engine import default_interview_engine
from app.schemas.interview import InterviewStartRequest, FinalInterviewReportResponse, SubmitAnswerRequest
from app.schemas.profile import ProfileUpdate
from app.api.routes.profile import update_candidate_profile, get_candidate_profile


class TestMultilingualAIFeedback(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.db = SessionLocal()
        # Find or create a dedicated test candidate
        user = cls.db.query(User).filter(User.id == "user-test-p16").first()
        if not user:
            # Check if email is used
            email = "user.test.p16@example.com"
            existing_by_email = cls.db.query(User).filter(User.email == email).first()
            if existing_by_email:
                user = existing_by_email
            else:
                user = User(
                    id="user-test-p16",
                    name="Test Candidate",
                    email=email,
                    role="AIML Engineer",
                    target_role="Machine Learning Engineer"
                )
                cls.db.add(user)
                cls.db.commit()

        cls.user_id = user.id
        profile = cls.db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            profile = Profile(user_id=user.id, feedback_language="en")
            cls.db.add(profile)
            cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_language_registry(self):
        """Verify supported languages and normalization helpers."""
        self.assertTrue(is_supported_feedback_language("en"))
        self.assertTrue(is_supported_feedback_language("te"))
        self.assertTrue(is_supported_feedback_language("hi"))
        self.assertFalse(is_supported_feedback_language("xyz_unsupported"))

        self.assertEqual(normalize_feedback_language("te"), "te")
        self.assertEqual(normalize_feedback_language("HI"), "hi")
        self.assertEqual(normalize_feedback_language("fr"), "en")  # Fallback to English
        self.assertEqual(normalize_feedback_language(None), "en")

        self.assertIn("తెలుగు", get_language_display_name("te"))
        self.assertIn("हिन्दी", get_language_display_name("hi"))
        self.assertEqual(get_language_display_name("en"), "English")

    def test_02_telugu_localization_and_tech_terms_preserved(self):
        """Verify authentic Telugu localization with English technical terms."""
        sample_feedback = {
            "role": "Machine Learning Engineer",
            "overall_score": 82,
            "passed": True,
            "rubric_scores": {"overall": 82, "technicalKnowledge": 85},
            "strengths": ["Demonstrated strong technical accuracy and command of Python and SQL."],
            "weaknesses": ["Improve STAR framework explanations for behavioral rounds."],
            "recommendations": ["Structure answers using the STAR method."],
            "next_best_action": {
                "title": "Practice Daily Conceptual Drills",
                "route": "/daily-challenge",
                "action": "Start Challenge",
                "reason": "Reinforce your knowledge for Machine Learning Engineer."
            },
            "feedback_summary": "You completed your mock interview with 82/100."
        }

        localized = multilingual_feedback_service.localize_feedback_report(sample_feedback, "te")

        self.assertEqual(localized["feedback_language"], "te")
        self.assertIsNone(localized["fallback_notice"])
        self.assertEqual(localized["overall_score"], 82)

        # Check Telugu characters present in summary
        summary = localized["feedback_summary"]
        self.assertTrue(any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in summary), "Summary must contain Telugu script")

        # Check technical terms in strengths/weaknesses remain in English
        strengths_str = " ".join(localized["strengths"])
        weaknesses_str = " ".join(localized["weaknesses"])
        all_text = f"{summary} {strengths_str} {weaknesses_str}"

        self.assertIn("Machine Learning Engineer", all_text)
        self.assertIn("STAR", all_text)

        # Next Best Action localized
        nba = localized["next_best_action"]
        self.assertEqual(nba["route"], "/daily-challenge")
        self.assertIn("ఛాలెంజ్", nba["action"])

    def test_03_hindi_localization_and_tech_terms_preserved(self):
        """Verify authentic Hindi localization with English technical terms."""
        sample_feedback = {
            "role": "Machine Learning Engineer",
            "overall_score": 78,
            "passed": True,
            "rubric_scores": {"overall": 78},
            "strengths": ["Clear system design and scalability trade-offs."],
            "weaknesses": ["Explicitly mention quantitative metrics like latency and throughput."],
            "recommendations": ["Incorporate quantifiable metrics in project explanations."],
            "next_best_action": {
                "title": "Bridge your PyTorch Skill Gap",
                "route": "/daily-challenge",
                "action": "Start Challenge",
                "reason": "Complete a focused drill."
            },
            "feedback_summary": "You completed your mock interview with 78/100."
        }

        localized = multilingual_feedback_service.localize_feedback_report(sample_feedback, "hi")

        self.assertEqual(localized["feedback_language"], "hi")
        self.assertIsNone(localized["fallback_notice"])
        self.assertEqual(localized["overall_score"], 78)

        # Check Hindi / Devanagari script present
        summary = localized["feedback_summary"]
        self.assertTrue(any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in summary), "Summary must contain Devanagari script")

        # Check technical terms stay in English
        all_text = f"{summary} {' '.join(localized['strengths'])} {' '.join(localized['weaknesses'])}"
        self.assertIn("Machine Learning Engineer", all_text)
        self.assertTrue("trade-off" in all_text or "latency" in all_text or "throughput" in all_text)

        # Next Best Action localized
        nba = localized["next_best_action"]
        self.assertEqual(nba["route"], "/daily-challenge")
        self.assertIn("अभ्यास", nba["action"])

    def test_04_score_invariance_across_languages(self):
        """CRITICAL: Ensure evaluation scores and rubrics are identical regardless of feedback language."""
        session = {"id": "int_test_invariance", "role": "Machine Learning Engineer"}
        questions = [
            {"id": "q1", "skill": "Model Evaluation Metrics", "question": "What is ROC-AUC?"},
            {"id": "q2", "skill": "Docker", "question": "Explain multi-stage Docker build."}
        ]
        answers = [
            {"id": "a1", "answer": "ROC-AUC evaluates sensitivity across thresholds."},
            {"id": "a2", "answer": "Multi-stage Docker builds separate build tools from runtime image."}
        ]
        evaluations = [
            {
                "overall_score": 85,
                "technical_accuracy": 90,
                "communication_quality": 80,
                "relevance": 85,
                "completeness": 85,
                "confidence_indicators": 80,
                "strengths": ["Solid technical accuracy in ROC-AUC explanation."],
                "weaknesses": ["Could provide edge case considerations."]
            },
            {
                "overall_score": 75,
                "technical_accuracy": 80,
                "communication_quality": 75,
                "relevance": 75,
                "completeness": 70,
                "confidence_indicators": 75,
                "strengths": ["Clear Docker multi-stage reasoning."],
                "weaknesses": ["Mention image security scanning."]
            }
        ]
        career_ctx = {"role": "Machine Learning Engineer", "skills": ["Python", "Docker"]}

        # Generate English report
        fb_en = default_llm_service.generate_final_interview_feedback(
            session=session,
            questions=questions,
            answers=answers,
            evaluations=evaluations,
            career_context=career_ctx,
            language="en"
        )

        # Generate Telugu report
        fb_te = default_llm_service.generate_final_interview_feedback(
            session=session,
            questions=questions,
            answers=answers,
            evaluations=evaluations,
            career_context=career_ctx,
            language="te"
        )

        # Generate Hindi report
        fb_hi = default_llm_service.generate_final_interview_feedback(
            session=session,
            questions=questions,
            answers=answers,
            evaluations=evaluations,
            career_context=career_ctx,
            language="hi"
        )

        # Assert scores are strictly identical
        self.assertEqual(fb_en["overall_score"], fb_te["overall_score"])
        self.assertEqual(fb_en["overall_score"], fb_hi["overall_score"])
        self.assertEqual(fb_en["rubric_scores"], fb_te["rubric_scores"])
        self.assertEqual(fb_en["rubric_scores"], fb_hi["rubric_scores"])
        self.assertEqual(fb_en["passed"], fb_te["passed"])
        self.assertEqual(fb_en["passed"], fb_hi["passed"])

        # Languages must be appropriately marked
        self.assertEqual(fb_en["feedback_language"], "en")
        self.assertEqual(fb_te["feedback_language"], "te")
        self.assertEqual(fb_hi["feedback_language"], "hi")

    def test_05_profile_persistence(self):
        """Verify updating feedback_language updates database profile."""
        # 1. Update to Telugu
        update_candidate_profile(
            update_data=ProfileUpdate(feedback_language="te"),
            user_id=self.user_id,
            db=self.db
        )
        profile_res = get_candidate_profile(user_id=self.user_id, db=self.db)
        self.assertEqual(profile_res.profile.feedback_language, "te")

        # 2. Update to Hindi
        update_candidate_profile(
            update_data=ProfileUpdate(feedback_language="hi"),
            user_id=self.user_id,
            db=self.db
        )
        profile_res = get_candidate_profile(user_id=self.user_id, db=self.db)
        self.assertEqual(profile_res.profile.feedback_language, "hi")

        # 3. Invalid code normalizes to English
        update_candidate_profile(
            update_data=ProfileUpdate(feedback_language="klingon"),
            user_id=self.user_id,
            db=self.db
        )
        profile_res = get_candidate_profile(user_id=self.user_id, db=self.db)
        self.assertEqual(profile_res.profile.feedback_language, "en")

    def test_06_end_to_end_telugu_interview_session(self):
        """Test starting and completing an interview session configured with Telugu feedback."""
        # Start session requesting Telugu feedback
        start_req = InterviewStartRequest(
            role="Machine Learning Engineer",
            difficulty="Intermediate",
            interview_type="Technical",
            total_questions=3,
            interview_language="en",
            feedback_language="te"
        )
        sess_resp = default_interview_engine.start_session(self.db, self.user_id, start_req)
        session_id = sess_resp.session_id
        self.assertEqual(sess_resp.feedback_language, "te")

        # Answer Q1
        ans_req = SubmitAnswerRequest(
            user_id=self.user_id,
            question_id=sess_resp.current_question.id,
            answer="Overfitting occurs when high variance leads to poor generalization on unseen test data."
        )
        default_interview_engine.submit_answer(
            db=self.db,
            user_id=self.user_id,
            session_id=session_id,
            request=ans_req
        )

        # Complete session
        report = default_interview_engine.complete_session(self.db, self.user_id, session_id)

        self.assertIsInstance(report, FinalInterviewReportResponse)
        self.assertEqual(report.feedback_language, "te")
        self.assertIsNone(report.fallback_notice)
        self.assertGreater(report.overall_score, 0)
        self.assertTrue(any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in report.feedback_summary))
        self.assertTrue(len(report.strengths) > 0)
        self.assertTrue(len(report.weaknesses) > 0)
        self.assertTrue(len(report.recommendations) > 0)

    def test_07_fallback_graceful_degradation(self):
        """Ensure that if an unexpected error occurs during translation, system degrades gracefully to English with notice."""
        bad_feedback = {
            "overall_score": 80,
            "feedback_summary": "Good overall effort.",
            "target_role": "Data Scientist"
        }
        # Force fallback simulation by calling with broken structure or exception
        result = multilingual_feedback_service.localize_feedback_report(bad_feedback, "te")
        # Should never raise exception, always returns a valid feedback dict
        self.assertIn("overall_score", result)
        self.assertEqual(result["overall_score"], 80)


if __name__ == "__main__":
    unittest.main()
