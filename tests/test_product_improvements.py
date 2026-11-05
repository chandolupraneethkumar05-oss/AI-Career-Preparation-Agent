"""
Product Improvements Test Suite
AI Career Preparation Agent

Verifies:
1. Interview session comparison & rubric progression calculation
2. Exportable performance reports (HTML and JSON formats)
3. Resume ATS version comparison & skill delta calculation
4. Tenant isolation: cross-user access blocked with 404/403
"""

import os
import sys
import json
import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import User, Interview, ResumeAnalysis
from app.core.security import create_access_token


class TestProductImprovements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

        with SessionLocal() as db:
            # Create user 1
            u1 = db.query(User).filter(User.id == "prod_test_user_1").first()
            if not u1:
                u1 = User(
                    id="prod_test_user_1",
                    email="cand1@prodtest.com",
                    name="Candidate One",
                    target_role="Software Engineer"
                )
                db.add(u1)

            # Create user 2
            u2 = db.query(User).filter(User.id == "prod_test_user_2").first()
            if not u2:
                u2 = User(
                    id="prod_test_user_2",
                    email="cand2@prodtest.com",
                    name="Candidate Two",
                    target_role="Backend Engineer"
                )
                db.add(u2)

            db.commit()

            # Create two interview sessions for user 1
            now = datetime.now(timezone.utc)
            i1 = db.query(Interview).filter(Interview.id == "int_prod_base").first()
            if not i1:
                i1 = Interview(
                    id="int_prod_base",
                    user_id="prod_test_user_1",
                    role="Software Engineer",
                    difficulty="Intermediate",
                    overall_score=72,
                    passed=True,
                    feedback_summary="Good foundational knowledge, but communication needs structure.",
                    rubric_scores_json=json.dumps({
                        "technicalKnowledge": 75,
                        "communicationSTAR": 65,
                        "problemSolving": 70,
                        "systemDesign": 70,
                        "confidenceDelivery": 80
                    }),
                    started_at=now
                )
                db.add(i1)

            i2 = db.query(Interview).filter(Interview.id == "int_prod_target").first()
            if not i2:
                i2 = Interview(
                    id="int_prod_target",
                    user_id="prod_test_user_1",
                    role="Software Engineer",
                    difficulty="Intermediate",
                    overall_score=85,
                    passed=True,
                    feedback_summary="Excellent improvement in STAR structure and technical rigor.",
                    rubric_scores_json=json.dumps({
                        "technicalKnowledge": 85,
                        "communicationSTAR": 85,
                        "problemSolving": 85,
                        "systemDesign": 80,
                        "confidenceDelivery": 90
                    }),
                    started_at=now
                )
                db.add(i2)

            # Create resume analyses for user 1
            r1 = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == "res_prod_base").first()
            if not r1:
                r1 = ResumeAnalysis(
                    id="res_prod_base",
                    user_id="prod_test_user_1",
                    filename="resume_v1.pdf",
                    target_role="Software Engineer",
                    ats_score=68,
                    matched_skills_json=json.dumps(["Python", "SQL", "Git"]),
                    missing_skills_json=json.dumps(["Docker", "FastAPI", "Kubernetes"])
                )
                db.add(r1)

            r2 = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == "res_prod_target").first()
            if not r2:
                r2 = ResumeAnalysis(
                    id="res_prod_target",
                    user_id="prod_test_user_1",
                    filename="resume_v2.pdf",
                    target_role="Software Engineer",
                    ats_score=82,
                    matched_skills_json=json.dumps(["Python", "SQL", "Git", "Docker", "FastAPI"]),
                    missing_skills_json=json.dumps(["Kubernetes"])
                )
                db.add(r2)

            db.commit()

        cls.token_u1 = create_access_token(data={"sub": "prod_test_user_1"})
        cls.token_u2 = create_access_token(data={"sub": "prod_test_user_2"})

    def test_01_interview_performance_comparison(self):
        """Verifies session comparison calculates correct score delta and rubric progression."""
        resp = self.client.get(
            "/api/interviews/compare/sessions?base_id=int_prod_base&target_id=int_prod_target",
            headers={"Authorization": f"Bearer {self.token_u1}"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["overall_score_delta"], 13)
        self.assertEqual(data["rubric_deltas"]["communicationSTAR"]["delta"], 20)
        self.assertEqual(data["rubric_deltas"]["technicalKnowledge"]["delta"], 10)
        self.assertIn("+13 points", data["verdict"])

    def test_02_export_interview_report_json_and_html(self):
        """Verifies interview report export in both JSON and HTML print formats."""
        # JSON format
        resp_json = self.client.get(
            "/api/interviews/int_prod_target/export?format=json",
            headers={"Authorization": f"Bearer {self.token_u1}"}
        )
        self.assertEqual(resp_json.status_code, 200)
        json_data = resp_json.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["report"]["overall_score"], 85)
        self.assertEqual(json_data["report"]["candidate_name"], "Candidate One")

        # HTML format
        resp_html = self.client.get(
            "/api/interviews/int_prod_target/export?format=html",
            headers={"Authorization": f"Bearer {self.token_u1}"}
        )
        self.assertEqual(resp_html.status_code, 200)
        self.assertIn("<!DOCTYPE html>", resp_html.text)
        self.assertIn("Interview Performance Audit", resp_html.text)
        self.assertIn("Score: 85/100", resp_html.text)

    def test_03_resume_ats_comparison(self):
        """Verifies resume comparison calculates score delta, newly matched skills, and gap resolution."""
        resp = self.client.get(
            "/api/resume/compare?base_id=res_prod_base&target_id=res_prod_target",
            headers={"Authorization": f"Bearer {self.token_u1}"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["score_delta"], 14)
        self.assertIn("Docker", data["newly_matched_skills"])
        self.assertIn("FastAPI", data["newly_matched_skills"])
        self.assertEqual(len(data["regressed_skills"]), 0)

    def test_04_cross_tenant_isolation(self):
        """CRITICAL: User 2 cannot compare or export User 1's interview sessions or resumes."""
        # User 2 attempting to compare User 1's interviews
        resp1 = self.client.get(
            "/api/interviews/compare/sessions?base_id=int_prod_base&target_id=int_prod_target",
            headers={"Authorization": f"Bearer {self.token_u2}"}
        )
        self.assertEqual(resp1.status_code, 404)

        # User 2 attempting to export User 1's interview
        resp2 = self.client.get(
            "/api/interviews/int_prod_target/export",
            headers={"Authorization": f"Bearer {self.token_u2}"}
        )
        self.assertEqual(resp2.status_code, 404)

        # User 2 attempting to compare User 1's resumes
        resp3 = self.client.get(
            "/api/resume/compare?base_id=res_prod_base&target_id=res_prod_target",
            headers={"Authorization": f"Bearer {self.token_u2}"}
        )
        self.assertEqual(resp3.status_code, 404)


if __name__ == "__main__":
    unittest.main()
