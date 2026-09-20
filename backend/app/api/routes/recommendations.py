"""
Autonomous Agent Recommendations Routes
AI Career Preparation Agent
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.recommendation import NextBestActionResponse
from ...services.recommendation_service import evaluate_next_best_action

router = APIRouter(prefix="/recommendations", tags=["Agent Recommendations"])


@router.get("", response_model=NextBestActionResponse)
@router.get("/", response_model=NextBestActionResponse)
@router.get("/next-action", response_model=NextBestActionResponse)
def get_next_best_action(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate state autonomously and prescribes the optimal,
    highest-yield next preparation action with explainable reasoning.
    """
    return evaluate_next_best_action(db, user_id=user_id)
