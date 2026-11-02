"""
Regression & Robustness Test Suite for Skill Arena Service & API
Tests empty pool handling, daily mode normalization, role fallbacks, and catalog resilience.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from backend.app.db.database import Base
from backend.app.db.models import User, SkillArenaAttempt
from backend.app.services.skill_arena_catalog import SKILL_ARENA_CATALOG
from backend.app.services.skill_arena_service import (
    get_available_challenges,
    get_next_challenge,
    normalize_challenge_mode,
    evaluate_submission
)
from backend.app.schemas.skill_arena import SkillArenaSubmitRequest


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    # Seed test user
    user = User(
        id="test-user-001",
        email="test@candidate.com",
        name="Test Candidate",
        target_role="Frontend Developer",
        xp=0,
        level=1,
        streak=1
    )
    db.add(user)
    db.commit()

    yield db
    db.close()


def test_normalize_challenge_mode():
    """Verify challenge mode normalization across valid, alias, and open modes."""
    assert normalize_challenge_mode("daily") is None
    assert normalize_challenge_mode("all") is None
    assert normalize_challenge_mode("any") is None
    assert normalize_challenge_mode("") is None
    assert normalize_challenge_mode(None) is None
    assert normalize_challenge_mode("code") == "coding"
    assert normalize_challenge_mode("coding") == "coding"
    assert normalize_challenge_mode("debug") == "debug"
    assert normalize_challenge_mode("predict") == "predict_output"
    assert normalize_challenge_mode("predict_output") == "predict_output"
    assert normalize_challenge_mode("mcq") == "mcq"


def test_scenario_valid_challenge_mode(test_db):
    """Test standard valid challenge modes (coding, debug, mcq, predict_output)."""
    for mode in ["coding", "debug", "mcq", "predict_output"]:
        res = get_next_challenge(test_db, user_id="test-user-001", mode=mode)
        assert res is not None
        assert res.mode == mode
        assert res.id is not None
        assert len(res.question) > 5


def test_scenario_daily_practice_selection(test_db):
    """Test daily practice selection ('mode=daily' must never cause IndexError)."""
    res = get_next_challenge(test_db, user_id="test-user-001", mode="daily")
    assert res is not None
    assert res.id is not None
    assert res.mode in ["coding", "debug", "mcq", "predict_output"]


def test_scenario_unknown_role_fallback(test_db):
    """Test selection when requested role has no direct specialization matches."""
    res = get_next_challenge(test_db, user_id="test-user-001", target_role="Quantum Cryogenic Engineer")
    assert res is not None
    assert res.id is not None
    # Falls back gracefully to standard engineering curriculum
    assert len(res.title) > 0


def test_scenario_no_challenges_for_requested_mode(test_db):
    """Test selection when an unknown or unpopulated mode is requested."""
    res = get_next_challenge(test_db, user_id="test-user-001", mode="non_existent_mode_xyz")
    assert res is not None
    assert res.id is not None


def test_scenario_all_challenges_completed(test_db):
    """Test selection when user has completed all challenges in the catalog."""
    for c in SKILL_ARENA_CATALOG:
        att = SkillArenaAttempt(
            user_id="test-user-001",
            challenge_id=c["id"],
            mode=c["mode"],
            skill=c["skill"],
            difficulty=c["difficulty"],
            score=100,
            correctness=True,
            xp_earned=40,
            time_spent_seconds=60
        )
        test_db.add(att)
    test_db.commit()

    # Must still select a challenge (recycling uncompleted/candidates pool without crashing)
    res = get_next_challenge(test_db, user_id="test-user-001")
    assert res is not None
    assert res.already_completed is True


def test_scenario_all_challenges_recently_attempted(test_db):
    """Test selection when user has recent attempts on challenges."""
    for c in SKILL_ARENA_CATALOG[:4]:
        att = SkillArenaAttempt(
            user_id="test-user-001",
            challenge_id=c["id"],
            mode=c["mode"],
            skill=c["skill"],
            difficulty=c["difficulty"],
            score=50,
            correctness=False,
            xp_earned=0,
            time_spent_seconds=30
        )
        test_db.add(att)
    test_db.commit()

    res = get_next_challenge(test_db, user_id="test-user-001")
    assert res is not None
    assert res.id is not None


def test_scenario_empty_catalog_handling(test_db, monkeypatch):
    """Test graceful handling when catalog is empty (must raise HTTP 404, not unhandled 500 IndexError)."""
    import backend.app.services.skill_arena_service as sas
    monkeypatch.setattr(sas, "SKILL_ARENA_CATALOG", [])

    with pytest.raises(HTTPException) as excinfo:
        sas.get_next_challenge(test_db, user_id="test-user-001")
    assert excinfo.value.status_code == 404

    # Also test evaluate_submission with empty catalog
    sub = SkillArenaSubmitRequest(
        challenge_id="invalid-id-999",
        user_answer="pass",
        time_spent_seconds=10
    )
    with pytest.raises(HTTPException) as excinfo_eval:
        sas.evaluate_submission(test_db, user_id="test-user-001", submission=sub)
    assert excinfo_eval.value.status_code == 404


def test_get_available_challenges_daily(test_db):
    """Verify get_available_challenges with mode='daily' returns all challenges instead of empty list."""
    daily_challenges = get_available_challenges(test_db, user_id="test-user-001", mode="daily")
    assert len(daily_challenges) > 0
    assert len(daily_challenges) == len(SKILL_ARENA_CATALOG)
