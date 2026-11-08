"""
Daily Conceptual Drill Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ...db.database import get_db
from ...db.models import Challenge, User
from ...schemas.challenge import (
    DailyChallengeResponse,
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    ChallengeHistoryItem,
    ChallengeHistoryResponse
)
from ...services.challenge_service import get_daily_challenge, submit_challenge_answer
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/challenges", tags=["Daily Challenges"])


@router.get("/daily", response_model=DailyChallengeResponse)
def get_daily_drill(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches today's dynamic conceptual drill tailored to candidate competency gaps."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    return get_daily_challenge(db, user_id=effective_user_id)


@router.post("/submit", response_model=ChallengeSubmitResponse)
def submit_drill(
    submission: ChallengeSubmitRequest,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluates conceptual drill submission, awards +50 XP, and updates streak."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    return submit_challenge_answer(db, user_id=effective_user_id, data=submission)


@router.get("/history", response_model=ChallengeHistoryResponse)
def get_challenge_history(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches past conceptual drill submissions for candidate."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    history = (
        db.query(Challenge)
        .filter(Challenge.user_id == effective_user_id)
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
