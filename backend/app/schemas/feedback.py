"""
Pydantic Schemas for User Product Feedback
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FeedbackCategory(str, Enum):
    BUG = "bug"
    INTERVIEW_FLOW = "interview_flow"
    SCORING = "scoring"
    FEATURE_REQUEST = "feature_request"
    UI_UX = "ui_ux"
    GENERAL = "general"


class ProductFeedbackCreate(BaseModel):
    """User submission of product feedback or issue report."""
    category: FeedbackCategory
    message: str = Field(..., min_length=3, max_length=2000, description="Constructive feedback or bug description")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Overall satisfaction rating (1-5)")
    page_context: Optional[str] = Field(None, max_length=128, description="URL or page route where feedback originated")


class ProductFeedbackResponse(BaseModel):
    """Product feedback response record."""
    id: str
    user_id: str
    category: str
    message: str
    rating: Optional[int] = None
    page_context: Optional[str] = None
    status: str = "received"
    created_at: str

    model_config = ConfigDict(from_attributes=True)
