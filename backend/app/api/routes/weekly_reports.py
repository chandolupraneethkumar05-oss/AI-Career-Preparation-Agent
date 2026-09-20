"""
Weekly AI Career Report API Routes
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.weekly_report import (
    WeeklyReportResponse,
    WeeklyReportHistoryItem
)
from ...services.weekly_report_service import (
    generate_weekly_report,
    get_weekly_report_history,
    get_weekly_report_by_id
)

router = APIRouter(prefix="/reports/weekly", tags=["Weekly AI Career Report"])


@router.get("", response_model=WeeklyReportResponse)
@router.get("/", response_model=WeeklyReportResponse)
def get_current_weekly_report(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Returns the current week's AI Career Report for candidate.
    Automatically generates it from database records if not already created.
    """
    try:
        return generate_weekly_report(db, user_id=user_id, force_regenerate=False)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error compiling weekly report: {str(exc)}")


@router.post("/generate", response_model=WeeklyReportResponse)
def force_generate_weekly_report(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Forces fresh re-synthesis of current week's AI Career Report based on newest activities.
    """
    try:
        return generate_weekly_report(db, user_id=user_id, force_regenerate=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error generating weekly report: {str(exc)}")


@router.get("/history", response_model=List[WeeklyReportHistoryItem])
def list_weekly_report_history(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Returns historical weekly reports archive for the candidate.
    """
    try:
        return get_weekly_report_history(db, user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error retrieving report history: {str(exc)}")


@router.get("/{report_id}", response_model=WeeklyReportResponse)
def get_weekly_report_details(
    report_id: str,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Returns specific historical weekly report by its ID.
    """
    try:
        return get_weekly_report_by_id(db, user_id=user_id, report_id=report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error fetching report: {str(exc)}")
