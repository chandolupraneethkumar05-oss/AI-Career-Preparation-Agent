"""
User Product Feedback Service
AI Career Preparation Agent
"""

import uuid
from typing import List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import User, ProductFeedback
from ..schemas.feedback import ProductFeedbackCreate, ProductFeedbackResponse


def utc_now():
    return datetime.now(timezone.utc)


def submit_feedback(
    db: Session,
    user_id: str,
    feedback_in: ProductFeedbackCreate
) -> ProductFeedbackResponse:
    """
    Validates and stores user feedback with anti-spam rate limiting (max 5 per hour).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=f"{user_id}@career-ai.dev",
            name="Candidate"
        )
        db.add(user)
        db.commit()

    # Anti-spam: max 5 submissions per user in the last hour
    one_hour_ago = utc_now() - timedelta(hours=1)
    recent_count = (
        db.query(ProductFeedback)
        .filter(
            ProductFeedback.user_id == user_id,
            ProductFeedback.created_at >= one_hour_ago
        )
        .count()
    )
    if recent_count >= 5:
        raise ValueError("Submission limit reached: You can submit up to 5 feedback items per hour.")

    feedback_id = f"fb-{uuid.uuid4().hex[:12]}"
    record = ProductFeedback(
        id=feedback_id,
        user_id=user_id,
        category=feedback_in.category.value,
        message=feedback_in.message.strip(),
        rating=feedback_in.rating,
        page_context=feedback_in.page_context,
        status="received",
        created_at=utc_now()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ProductFeedbackResponse(
        id=record.id,
        user_id=record.user_id,
        category=record.category,
        message=record.message,
        rating=record.rating,
        page_context=record.page_context,
        status=record.status,
        created_at=record.created_at.isoformat()
    )


def get_user_feedback(db: Session, user_id: str) -> List[ProductFeedbackResponse]:
    """Retrieves all feedback items submitted by the candidate."""
    items = (
        db.query(ProductFeedback)
        .filter(ProductFeedback.user_id == user_id)
        .order_by(desc(ProductFeedback.created_at))
        .all()
    )
    return [
        ProductFeedbackResponse(
            id=i.id,
            user_id=i.user_id,
            category=i.category,
            message=i.message,
            rating=i.rating,
            page_context=i.page_context,
            status=i.status,
            created_at=i.created_at.isoformat()
        )
        for i in items
    ]
