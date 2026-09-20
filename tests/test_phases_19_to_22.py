"""
Comprehensive Automated Test Suite for Phases 19–22:
- Phase 19: Weekly AI Career Report
- Phase 20: Weekly Goals & Streak Recovery
- Phase 21: Product Feedback
- Phase 22: Security Headers, Health Probes, and Upload Hardening

Academic IDP Project — Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import User, WeeklyGoal, WeeklyReport, ProductFeedback


class TestPhases19To22(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()
        u = self.db.query(User).filter(User.id == "user-001").first()
        if not u:
            u = User(
                id="user-001",
                email="praneeth.chandolu@vignan.ac.in",
                name="Chandolu Praneeth Kumar",
                role="AIML Engineer",
                target_role="Machine Learning Engineer",
                xp=100,
                level=1,
                streak=3,
                longest_streak=5
            )
            self.db.add(u)
            self.db.commit()

    def tearDown(self):
        self.db.close()

    # =========================================================================
    # PHASE 19: WEEKLY AI CAREER REPORT TESTS
    # =========================================================================

    def test_get_current_weekly_report(self):
        """Tests retrieval of current week's report."""
        res = self.client.get("/api/reports/weekly?user_id=user-001")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["user_id"], "user-001")
        self.assertIn("summary", data)
        self.assertIn("interview_performance", data)
        self.assertIn("coding_performance", data)
        self.assertIn("next_week_priorities", data)
        self.assertIn("readiness_summary", data)
        self.assertTrue(len(data["next_week_priorities"]) >= 3)
        self.assertTrue(len(data["ai_interpretation"]) > 0)

    def test_force_generate_weekly_report(self):
        """Tests forcing re-generation of weekly report."""
        res = self.client.post("/api/reports/weekly/generate?user_id=user-001")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["user_id"], "user-001")
        self.assertIn("id", data)

    def test_weekly_report_history(self):
        """Tests retrieval of historical weekly reports."""
        # Ensure at least one report exists
        self.client.post("/api/reports/weekly/generate?user_id=user-001")
        res = self.client.get("/api/reports/weekly/history?user_id=user-001")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertTrue(len(data) >= 1)

    # =========================================================================
    # PHASE 20: GOALS & MEANINGFUL GAMIFICATION TESTS
    # =========================================================================

    def test_get_weekly_goals(self):
        """Tests fetching active weekly targets and status."""
        res = self.client.get("/api/goals/weekly?user_id=user-001")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["user_id"], "user-001")
        self.assertIn("target_interviews", data)
        self.assertIn("target_coding_drills", data)
        self.assertIn("target_daily_drills", data)
        self.assertIn("streak_recovery_available", data)

    def test_update_weekly_goals(self):
        """Tests updating targets for candidate commitments."""
        payload = {
            "target_interviews": 3,
            "target_coding_drills": 4,
            "target_daily_drills": 6,
            "focus_skill": "MLOps & Fast Inference"
        }
        res = self.client.put("/api/goals/weekly?user_id=user-001", json=payload)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["target_interviews"], 3)
        self.assertEqual(data["target_coding_drills"], 4)
        self.assertEqual(data["target_daily_drills"], 6)
        self.assertEqual(data["focus_skill"], "MLOps & Fast Inference")

    def test_streak_recovery_flow(self):
        """Tests the 30-day streak recovery mechanism and rate limiting."""
        # Reset recovery date to allow recovery
        u = self.db.query(User).filter(User.id == "user-001").first()
        u.streak_recovery_used_at = None
        self.db.commit()

        # First attempt should succeed
        res = self.client.post("/api/goals/streak-recovery?user_id=user-001")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("successfully restored", data["message"])

        # Immediate second attempt should be blocked by 30-day cooldown
        res2 = self.client.post("/api/goals/streak-recovery?user_id=user-001")
        self.assertEqual(res2.status_code, 200, res2.text)
        data2 = res2.json()
        self.assertFalse(data2["success"])
        self.assertIn("once every 30 days", data2["message"])

    # =========================================================================
    # PHASE 21: PRODUCT FEEDBACK TESTS
    # =========================================================================

    def test_submit_and_get_product_feedback(self):
        """Tests submitting user product feedback and retrieving it."""
        self.db.query(ProductFeedback).filter(ProductFeedback.user_id == "user-001").delete()
        self.db.commit()

        payload = {
            "category": "feature_request",
            "message": "Adding mock system design whiteboarding would be fantastic for junior candidates.",
            "rating": 5,
            "page_context": "/mock-interview"
        }
        res = self.client.post("/api/feedback?user_id=user-001", json=payload)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["category"], "feature_request")
        self.assertEqual(data["rating"], 5)
        self.assertEqual(data["status"], "received")

        # Now retrieve submitted feedback
        res_mine = self.client.get("/api/feedback/mine?user_id=user-001")
        self.assertEqual(res_mine.status_code, 200, res_mine.text)
        mine_data = res_mine.json()
        self.assertIsInstance(mine_data, list)
        self.assertTrue(len(mine_data) >= 1)

    # =========================================================================
    # PHASE 22: SECURITY HEADERS & HEALTH PROBES
    # =========================================================================

    def test_security_headers_present(self):
        """Verifies that security headers are injected into HTTP responses."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(res.headers.get("x-frame-options"), "DENY")
        self.assertEqual(res.headers.get("x-xss-protection"), "1; mode=block")
        self.assertEqual(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin")

    def test_root_health_and_api_health(self):
        """Tests /health and /api/health."""
        res_root = self.client.get("/health")
        self.assertEqual(res_root.status_code, 200)
        self.assertEqual(res_root.json()["status"], "healthy")

        res_api = self.client.get("/api/health")
        self.assertEqual(res_api.status_code, 200)
        self.assertEqual(res_api.json()["student"], "Chandolu Praneeth Kumar")

    def test_api_readiness_probe(self):
        """Tests /api/ready database responsiveness probe."""
        res = self.client.get("/api/ready")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ready")
        self.assertEqual(data["database"], "connected")


if __name__ == "__main__":
    unittest.main()
