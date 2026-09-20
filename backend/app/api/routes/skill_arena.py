"""
Skill Arena API Routes
AI Career Preparation Agent
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.skill_arena import (
    SkillArenaChallengeResponse,
    SkillArenaSubmitRequest,
    SkillArenaEvaluationResponse,
    SkillArenaAttemptResponse,
    SkillArenaStatsResponse
)
from ...services.skill_arena_service import (
    get_available_challenges,
    get_next_challenge,
    evaluate_submission,
    get_user_history,
    get_user_stats
)

router = APIRouter(prefix="/skill-arena", tags=["Skill Arena"])


@router.get("/challenges", response_model=List[SkillArenaChallengeResponse])
def list_challenges(
    user_id: str = Query("user-001", description="Candidate User ID"),
    mode: Optional[str] = Query(None, description="coding, debug, mcq, predict_output"),
    skill: Optional[str] = Query(None, description="Target skill"),
    difficulty: Optional[str] = Query(None, description="Foundational, Intermediate, Advanced"),
    db: Session = Depends(get_db)
):
    """Retrieves available challenges filtered by mode, skill, and difficulty."""
    return get_available_challenges(db, user_id=user_id, mode=mode, skill=skill, difficulty=difficulty)


@router.get("/next", response_model=SkillArenaChallengeResponse)
def get_next_recommended_challenge(
    user_id: str = Query("user-001", description="Candidate User ID"),
    target_role: Optional[str] = Query(None, description="Optional target role override"),
    mode: Optional[str] = Query(None, description="Optional mode filter: coding, debug, mcq, predict_output"),
    db: Session = Depends(get_db)
):
    """
    Returns the career-aware next challenge prioritized by candidate's
    largest competency gaps, calibrated difficulty, and anti-repetition.
    """
    return get_next_challenge(db, user_id=user_id, target_role=target_role, mode=mode)


@router.post("/submit", response_model=SkillArenaEvaluationResponse)
def submit_arena_solution(
    submission: SkillArenaSubmitRequest,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Safely evaluates candidate response (NO arbitrary server code execution),
    awards XP, logs activity, records SkillEvidence, and syncs unified profile.
    """
    return evaluate_submission(db, user_id=user_id, submission=submission)


@router.get("/history", response_model=List[SkillArenaAttemptResponse])
def get_arena_history(
    user_id: str = Query("user-001", description="Candidate User ID"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves candidate's past Skill Arena attempts in reverse chronological order."""
    return get_user_history(db, user_id=user_id, limit=limit)


@router.get("/stats", response_model=SkillArenaStatsResponse)
def get_arena_stats(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Returns candidate's aggregate metrics, accuracy rate, and skills practiced in Skill Arena."""
    return get_user_stats(db, user_id=user_id)
