"""
Daily Conceptual Drill Routes
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ...db.database import get_db
from ...db.models import Challenge
from ...schemas.challenge import (
    DailyChallengeResponse,
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    ChallengeHistoryItem,
    ChallengeHistoryResponse
)
from ...services.challenge_service import get_daily_challenge, submit_challenge_answer

router = APIRouter(prefix="/challenges", tags=["Daily Challenges"])


@router.get("/daily", response_model=DailyChallengeResponse)
def get_daily_drill(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Fetches today's dynamic conceptual drill tailored to candidate competency gaps."""
    return get_daily_challenge(db, user_id=user_id)


@router.post("/submit", response_model=ChallengeSubmitResponse)
def submit_drill(
    submission: ChallengeSubmitRequest,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Evaluates conceptual drill submission, awards +50 XP, and updates streak."""
    return submit_challenge_answer(db, user_id=user_id, data=submission)


@router.get("/history", response_model=ChallengeHistoryResponse)
def get_challenge_history(
    user_id: str = Query("user-001", description="Candidate User ID"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetches past conceptual drill submissions for candidate."""
    history = (
        db.query(Challenge)
        .filter(Challenge.user_id == user_id)
        .order_by(desc(Challenge.submitted_at))
        .limit(limit)
        .all()
    )
    items = [
        ChallengeHistoryItem(
            id=c.id,
            challenge_id=c.challenge_id,
            topic=c.topic,
            difficulty=c.difficulty,
            score=c.score,
            xp_earned=c.xp_earned,
            completed=c.completed,
            submitted_at=c.submitted_at
        )
        for c in history
    ]
    return ChallengeHistoryResponse(
        challenges=items,
        total_completed=len(items)
    )
