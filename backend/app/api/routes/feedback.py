"""
User Product Feedback API Routes
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.feedback import (
    ProductFeedbackCreate,
    ProductFeedbackResponse
)
from ...services.feedback_service import (
    submit_feedback,
    get_user_feedback
)

router = APIRouter(prefix="/feedback", tags=["Product Feedback"])


@router.post("", response_model=ProductFeedbackResponse)
@router.post("/", response_model=ProductFeedbackResponse)
def submit_product_feedback(
    feedback_in: ProductFeedbackCreate,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Submits user product feedback, bug reports, or evaluation rubric feedback.
    Enforces a rate limit of 5 submissions per hour per user.
    """
    try:
        return submit_feedback(db, user_id=user_id, feedback_in=feedback_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error submitting feedback: {str(exc)}")


@router.get("/mine", response_model=List[ProductFeedbackResponse])
def get_my_feedback_history(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves the list of feedback submissions submitted by the candidate.
    """
    try:
        return get_user_feedback(db, user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error fetching feedback: {str(exc)}")
