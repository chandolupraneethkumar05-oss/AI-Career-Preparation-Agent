"""
Automated Test Suite for Phase 18 - Career Journey & Career Readiness Foundation
AI Career Preparation Agent
"""

import os
import sys
import unittest
from datetime import datetime, timezone

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.database import SessionLocal, init_db
from app.db.models import (
    User,
    Profile,
    ResumeAnalysis,
    SkillGap,
    SkillEvidence,
    Challenge,
    SkillArenaAttempt,
    Interview,
    InterviewAnswer,
    AnswerEvaluation
)
from app.schemas.career_journey import (
    MilestoneStatus,
    ReadinessBand,
    CareerJourneyResponse,
    ReadinessAssessment
)
from app.services.career_journey_service import (
    get_career_journey_data,
    get_readiness_assessment_only
)
from fastapi.testclient import TestClient
from app.main import app


class TestPhase18CareerJourney(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

        # Ensure primary test user exists
        u = self.db.query(User).filter(User.id == "user-001").first()
        if not u:
            u = User(
                id="user-001",
                email="candidate@example.com",
                name="Candidate",
                role="AIML Engineer",
                target_role="Machine Learning Engineer",
                xp=1450,
                level=4,
                streak=5
            )
            self.db.add(u)
            self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_active_user_career_journey_structure(self):
        """Validates that get_career_journey_data returns all 14 milestones in sequence."""
        journey = get_career_journey_data(self.db, "user-001")
        self.assertIsInstance(journey, CareerJourneyResponse)
        self.assertEqual(journey.user_id, "user-001")
        self.assertEqual(len(journey.milestones), 14)

        # Check sequence numbers
        for idx, m in enumerate(journey.milestones, start=1):
            self.assertEqual(m.sequence, idx)
            self.assertIn(m.status, [MilestoneStatus.COMPLETED, MilestoneStatus.IN_PROGRESS, MilestoneStatus.NOT_STARTED])

        # Verify Readiness Foundation
        self.assertIsInstance(journey.readiness, ReadinessAssessment)
        self.assertEqual(len(journey.readiness.dimensions), 5)
        self.assertIn(journey.readiness.readiness_band, list(ReadinessBand))
        self.assertTrue(len(journey.readiness.disclaimer) > 20)

    def test_02_new_candidate_clean_empty_state(self):
        """Validates that a fresh onboarding user receives genuine empty-state milestones without fake scores."""
        # Clean or create test-new-user
        new_uid = "test-fresh-candidate-18"
        u_old = self.db.query(User).filter(User.id == new_uid).first()
        if u_old:
            self.db.delete(u_old)
            self.db.commit()

        fresh_user = User(
            id=new_uid,
            email="fresh.candidate@example.com",
            name="Fresh Candidate",
            role="AIML Student",
            target_role="Machine Learning Engineer",
            xp=0,
            level=1,
            streak=0
        )
        self.db.add(fresh_user)
        self.db.commit()

        journey = get_career_journey_data(self.db, new_uid)
        self.assertEqual(journey.user_id, new_uid)

        # Profile in-progress/completed, Target Role completed
        self.assertEqual(journey.milestones[1].status, MilestoneStatus.COMPLETED)  # TARGET_ROLE

        # Resume, ATS, Coding, Interview should be NOT_STARTED
        self.assertEqual(journey.milestones[2].status, MilestoneStatus.NOT_STARTED)  # RESUME
        self.assertEqual(journey.milestones[3].status, MilestoneStatus.NOT_STARTED)  # RESUME_ANALYSIS
        self.assertEqual(journey.milestones[8].status, MilestoneStatus.NOT_STARTED)  # CODING
        self.assertEqual(journey.milestones[9].status, MilestoneStatus.NOT_STARTED)  # INTERVIEW
        self.assertEqual(journey.milestones[10].status, MilestoneStatus.NOT_STARTED)  # EVALUATION

        # Stats must show 0 fake numbers
        self.assertEqual(journey.stats.total_interviews, 0)
        self.assertEqual(journey.stats.average_interview_score, 0.0)
        self.assertIsNone(journey.stats.ats_score)
        self.assertEqual(journey.stats.drills_completed, 0)

        # Readiness band should be building foundations
        self.assertEqual(journey.readiness.readiness_band, ReadinessBand.BUILDING_FOUNDATIONS)

        # Cleanup
        self.db.delete(fresh_user)
        self.db.commit()

    def test_03_milestone_transition_with_activities(self):
        """Validates that adding real records deterministically advances milestones and evidence."""
        test_uid = "test-transition-user-18"
        # Cleanup if exists
        old = self.db.query(User).filter(User.id == test_uid).first()
        if old:
            self.db.delete(old)
            self.db.commit()

        u = User(
            id=test_uid,
            email="trans.candidate@example.com",
            name="Transition Candidate",
            role="AIML Engineer",
            target_role="Machine Learning Engineer"
        )
        self.db.add(u)
        self.db.commit()

        # Add Resume Analysis
        ra = ResumeAnalysis(
            id="ra-test-18",
            user_id=test_uid,
            filename="Candidate_ML_Resume.pdf",
            target_role="Machine Learning Engineer",
            ats_score=78,
            score_breakdown_json="[]",
            extracted_skills_json='["Python", "PyTorch", "SQL", "Docker"]',
            matched_skills_json='["Python", "PyTorch", "SQL"]',
            missing_skills_json='["Kubernetes"]',
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(ra)

        # Add 3 Challenges
        for i in range(3):
            c = Challenge(
                user_id=test_uid,
                challenge_id=f"chal-{i}",
                topic="ML System Design",
                question=f"Question {i}",
                score=85,
                completed=True,
                submitted_at=datetime.now(timezone.utc)
            )
            self.db.add(c)

        # Add 1 Mock Interview
        iv = Interview(
            id="iv-test-18",
            user_id=test_uid,
            role="Machine Learning Engineer",
            overall_score=82,
            passed=True,
            status="completed",
            feedback_summary="Strong comprehension of model serialization and gradient descent.",
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )
        self.db.add(iv)
        self.db.commit()

        journey = get_career_journey_data(self.db, test_uid)

        # Resume & ATS Milestones must now be COMPLETED
        self.assertEqual(journey.milestones[2].status, MilestoneStatus.COMPLETED)  # RESUME
        self.assertEqual(journey.milestones[3].status, MilestoneStatus.COMPLETED)  # RESUME_ANALYSIS
        self.assertEqual(journey.milestones[6].status, MilestoneStatus.COMPLETED)  # PRACTICE (3 drills)
        self.assertEqual(journey.milestones[9].status, MilestoneStatus.COMPLETED)  # INTERVIEW (1 session)
        self.assertEqual(journey.milestones[11].status, MilestoneStatus.COMPLETED) # FEEDBACK

        # Verified ATS score in stats
        self.assertEqual(journey.stats.ats_score, 78)
        self.assertEqual(journey.stats.total_interviews, 1)
        self.assertEqual(journey.stats.average_interview_score, 82.0)

        # Cleanup
        self.db.delete(u)
        self.db.commit()

    def test_04_career_journey_api_endpoints(self):
        """Validates HTTP endpoints: /api/career-journey and /api/career-journey/readiness."""
        # 1. Main endpoint
        resp = self.client.get("/api/career-journey?user_id=user-001")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user_id"], "user-001")
        self.assertEqual(len(data["milestones"]), 14)
        self.assertIn("readiness", data)
        self.assertIn("stats", data)
        self.assertIn("next_best_action", data)

        # 2. Readiness endpoint
        resp_readiness = self.client.get("/api/career-journey/readiness?user_id=user-001")
        self.assertEqual(resp_readiness.status_code, 200)
        readiness_data = resp_readiness.json()
        self.assertIn("readiness_band", readiness_data)
        self.assertEqual(len(readiness_data["dimensions"]), 5)
        self.assertTrue(len(readiness_data["disclaimer"]) > 10)

        # 3. Non-existent candidate handling
        resp_404 = self.client.get("/api/career-journey?user_id=non-existent-user-999")
        self.assertEqual(resp_404.status_code, 404)


if __name__ == "__main__":
    unittest.main()
