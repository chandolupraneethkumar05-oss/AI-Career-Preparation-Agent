"""
Autonomous Agent Recommendations Routes
AI Career Preparation Agent
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.recommendation import NextBestActionResponse
from ...services.recommendation_service import evaluate_next_best_action
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/recommendations", tags=["Agent Recommendations"])


@router.get("", response_model=NextBestActionResponse)
@router.get("/", response_model=NextBestActionResponse)
@router.get("/next-action", response_model=NextBestActionResponse)
def get_next_best_action(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate state autonomously and prescribes the optimal,
    highest-yield next preparation action with explainable reasoning.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    return evaluate_next_best_action(db, user_id=effective_user_id)
