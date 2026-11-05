"""
Test Suite: Technology-Focused Interviews, Resume Auto-Grounding, and JIT Skill Primers
AI Career Preparation Agent
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.db.database import Base, get_db
from backend.app.db.models import User, Interview, SkillEvidence, SkillGap, Activity, ResumeAnalysis
from backend.app.schemas.interview import InterviewStartRequest
from backend.app.services.interview_engine import default_interview_engine
from backend.app.services.primer_service import get_skill_primer, verify_primer_quiz
from backend.app.services.recommendation_service import evaluate_next_best_action

# Isolated in-memory SQLite database for test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Create test candidate
        user = User(
            id="test-tech-user-1",
            email="techuser@example.com",
            name="Alex Tech",
            target_role="Backend Engineer"
        )
        db.add(user)
        db.commit()
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_tech_focused_interview_start(db_session):
    """Verifies that an interview explicitly targeted to Java restricts questions to Java."""
    req = InterviewStartRequest(
        user_id="test-tech-user-1",
        role="Backend Engineer",
        difficulty="Intermediate",
        technologies=["Java"],
        strict_tech_focus=True,
        total_questions=5
    )

    session = default_interview_engine.start_session(db=db_session, user_id="test-tech-user-1", request=req)

    assert session.session_id.startswith("int_")
    assert session.technologies == ["Java"]
    assert session.strict_tech_focus is True
    assert session.current_question is not None

    q_text = session.current_question.question.lower()
    q_skill = session.current_question.skill.lower()
    # Question must relate directly to Java or core Java constructs (ExecutorService, JVM, volatile, etc.)
    java_markers = ["java", "executorservice", "jvm", "reentrantlock", "synchronized", "hashmap", "garbage collection"]
    assert any(m in q_text or m in q_skill for m in java_markers)


def test_jit_primer_retrieval():
    """Verifies that the JIT Primer returns structured 3-minute conceptual briefing."""
    primer = get_skill_primer("docker")
    assert primer.skill_name.lower() == "docker"
    assert "container" in primer.concept_title.lower() or "docker" in primer.concept_title.lower()
    assert len(primer.core_mental_models) >= 3
    assert "question" in primer.interview_golden_qa
    assert len(primer.verification_quiz) == 2


def test_jit_primer_verification(db_session):
    """Verifies that answering the 2-question primer quiz records evidence and awards XP."""
    answers = {1: 0, 2: 0}  # Correct answers
    res = verify_primer_quiz(
        db=db_session,
        user_id="test-tech-user-1",
        skill_name="Docker",
        answers=answers
    )

    assert res.passed is True
    assert res.score == 100
    assert res.awarded_xp == 35

    # Check evidence persisted in db
    evidence = (
        db_session.query(SkillEvidence)
        .filter(SkillEvidence.user_id == "test-tech-user-1", SkillEvidence.skill_name == "Docker")
        .first()
    )
    assert evidence is not None
    assert evidence.score >= 60


def test_recommendation_engine_prescribes_jit_primer_on_zero_baseline(db_session):
    """Verifies that a 0% demonstrated gap triggers a 3-minute primer action instead of blind testing."""
    # Seed ATS activity & prior interview so onboarding rules pass
    act = Activity(
        id="act-test-1",
        user_id="test-tech-user-1",
        type="resume_analyzed",
        related_module="ats",
        title="Resume Audited"
    )
    past_int = Interview(
        id="int_past_1",
        user_id="test-tech-user-1",
        role="Backend Engineer",
        status="completed",
        overall_score=75
    )
    # Seed a high-priority gap with 0% demonstrated score
    gap = SkillGap(
        user_id="test-tech-user-1",
        skill_name="Docker",
        category="DevOps",
        current_score=0,
        target_score=80,
        priority="high",
        source="ats"
    )
    db_session.add_all([act, past_int, gap])
    db_session.commit()

    nba = evaluate_next_best_action(db_session, user_id="test-tech-user-1")
    assert nba.action_type == "learn_concept"
    assert "primer" in nba.action.lower() or "primer" in nba.title.lower()
    assert "3 mins" in nba.estimated_effort
