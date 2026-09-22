"""
Automated Unit Tests for:
1. Real LLM (Google Gemini & OpenAI) Service & Factory Provider Selection
2. Target Role Dynamic Persistence & Synchronization
3. Fresh User / Empty Evidence Skill Calibration
"""

import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.database import get_db, Base, engine
from backend.app.db.models import User, Profile, SkillEvidence
from backend.app.services.ai.llm.llm_service import (
    get_llm_service,
    LocalGroundedLLMService,
    OpenAICompatibleLLMService
)
from backend.app.services.ai.llm.gemini_service import GeminiLLMService
from backend.app.services.skill_service import get_user_skill_profile


class TestRealLLMAndRoleSync(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        Base.metadata.create_all(bind=engine)
        self.db = next(get_db())

    def tearDown(self):
        self.db.close()

    def test_01_llm_service_factory_defaults_to_local_when_no_keys(self):
        """When no API keys are present in env, defaults cleanly to LocalGroundedLLMService."""
        with patch.dict(os.environ, {}, clear=True):
            service = get_llm_service()
            self.assertIsInstance(service, LocalGroundedLLMService)

    def test_02_llm_service_factory_picks_gemini_when_key_present(self):
        """When GEMINI_API_KEY is present, automatically instantiates GeminiLLMService."""
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-mock-gemini-key"}):
            service = get_llm_service()
            self.assertIsInstance(service, GeminiLLMService)
            self.assertEqual(service.api_key, "test-mock-gemini-key")

    def test_03_llm_service_factory_picks_openai_when_openai_key_present(self):
        """When only OPENAI_API_KEY is present, instantiates OpenAICompatibleLLMService."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test-mock-openai-key"}, clear=True):
            service = get_llm_service()
            self.assertIsInstance(service, OpenAICompatibleLLMService)

    def test_04_gemini_service_offline_fallback(self):
        """GeminiLLMService falls back cleanly to local synthesis if API call is unconfigured or fails."""
        service = GeminiLLMService(api_key="")
        # Should gracefully return valid local synthesis without crashing
        res = service.generate_grounded_response(
            query="Explain Transformer Attention",
            user_context={"target_role": "Machine Learning Engineer"},
            retrieved_chunks=[{"title": "Transformers", "category": "Deep Learning", "content": "Attention mechanisms compute weighted context."}],
            language="en"
        )
        self.assertIn("answer", res)
        self.assertTrue(len(res["answer"]) > 10)

    def test_05_profile_put_updates_target_role_and_role(self):
        """Updating profile via PUT updates target_role and role on the User model in SQLite."""
        test_uid = "usr_role_sync_test"
        # First ensure user exists or auto-provisions
        resp = self.client.get(f"/api/profile?user_id={test_uid}")
        self.assertEqual(resp.status_code, 200)

        # Update role to Frontend Engineer
        put_resp = self.client.put(
            f"/api/profile?user_id={test_uid}",
            json={
                "target_role": "Frontend Engineer",
                "role": "Frontend Engineer",
                "name": "Jane Developer"
            }
        )
        self.assertEqual(put_resp.status_code, 200)

        # Verify DB directly
        user_record = self.db.query(User).filter(User.id == test_uid).first()
        self.assertIsNotNone(user_record)
        self.assertEqual(user_record.target_role, "Frontend Engineer")
        self.assertEqual(user_record.role, "Frontend Engineer")
        self.assertEqual(user_record.name, "Jane Developer")

    def test_06_fresh_user_has_zero_readiness_and_zero_evidences(self):
        """A brand new user with 0 interviews and 0 resumes must have overall_readiness=0 and total_evidences=0."""
        fresh_uid = "usr_pristine_candidate_999"
        profile = get_user_skill_profile(self.db, user_id=fresh_uid)

        self.assertEqual(profile.overall_readiness, 0)
        self.assertEqual(profile.evidence_summary["total_evidences"], 0)
        # Radar axes should all be 0 for an unrated candidate
        for axis in profile.radar_data:
            self.assertEqual(axis.score, 0)


if __name__ == "__main__":
    unittest.main()
