"""
Weekly AI Career Report API Routes
AI Career Preparation Agent
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.weekly_report import (
    WeeklyReportResponse,
    WeeklyReportHistoryItem
)
from ...services.weekly_report_service import (
    generate_weekly_report,
    get_weekly_report_history,
    get_weekly_report_by_id
)
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/reports/weekly", tags=["Weekly AI Career Report"])


@router.get("", response_model=WeeklyReportResponse)
@router.get("/", response_model=WeeklyReportResponse)
def get_current_weekly_report(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current week's AI Career Report for candidate.
    Automatically generates it from database records if not already created.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return generate_weekly_report(db, user_id=effective_user_id, force_regenerate=False)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error compiling weekly report: {str(exc)}")


@router.post("/generate", response_model=WeeklyReportResponse)
def force_generate_weekly_report(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forces fresh re-synthesis of current week's AI Career Report based on newest activities.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return generate_weekly_report(db, user_id=effective_user_id, force_regenerate=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error generating weekly report: {str(exc)}")


@router.get("/history", response_model=List[WeeklyReportHistoryItem])
def list_weekly_report_history(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns historical weekly reports archive for the candidate.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_weekly_report_history(db, user_id=effective_user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error retrieving report history: {str(exc)}")


@router.get("/{report_id}", response_model=WeeklyReportResponse)
def get_weekly_report_details(
    report_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns specific historical weekly report by its ID.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return get_weekly_report_by_id(db, user_id=effective_user_id, report_id=report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error fetching report: {str(exc)}")
