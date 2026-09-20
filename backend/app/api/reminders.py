"""
Proactive Reminders API Controller
AI Career Preparation Agent
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import ReminderPreference, ReminderLog
from ..schemas.reminder import (
    ReminderPreferenceBase,
    ReminderPreferenceUpdate,
    ReminderPreferenceResponse,
    ReminderStatusResponse,
    ReminderLogResponse,
    ReminderTestRequest,
    ReminderTestResponse
)
from ..services.reminder_service import reminder_service
from ..services.scheduler import proactive_scheduler

router = APIRouter(prefix="/reminders", tags=["Proactive Reminders"])


@router.get("/preferences", response_model=ReminderPreferenceResponse)
@router.get("/preferences/{user_id}", response_model=ReminderPreferenceResponse)
def get_preferences(
    user_id: str = "user-001",
    db: Session = Depends(get_db)
):
    """Retrieve active proactive reminder preferences for candidate."""
    pref = reminder_service.get_preferences(user_id=user_id, db=db)
    return ReminderPreferenceResponse(
        id=pref.id,
        user_id=pref.user_id,
        enabled=pref.enabled,
        preferred_time=pref.preferred_time or pref.time or "19:00",
        time=pref.preferred_time or pref.time or "19:00",
        method=pref.method,
        email=pref.email,
        timezone=pref.timezone or "Asia/Kolkata",
        frequency=pref.frequency,
        target_role=pref.target_role,
        created_at=pref.created_at,
        updated_at=pref.updated_at
    )


@router.put("/preferences", response_model=ReminderPreferenceResponse)
@router.put("/preferences/{user_id}", response_model=ReminderPreferenceResponse)
def update_preferences(
    prefs: ReminderPreferenceUpdate,
    user_id: str = "user-001",
    db: Session = Depends(get_db)
):
    """Save candidate proactive reminder preferences."""
    try:
        updated = reminder_service.update_preferences(user_id=user_id, data=prefs, db=db)
        return ReminderPreferenceResponse(
            id=updated.id,
            user_id=updated.user_id,
            enabled=updated.enabled,
            preferred_time=updated.preferred_time or updated.time or "19:00",
            time=updated.preferred_time or updated.time or "19:00",
            method=updated.method,
            email=updated.email,
            timezone=updated.timezone or "Asia/Kolkata",
            frequency=updated.frequency,
            target_role=updated.target_role,
            created_at=updated.created_at,
            updated_at=updated.updated_at
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to update reminder preferences: {str(exc)}")


@router.get("/status", response_model=ReminderStatusResponse)
@router.get("/status/{user_id}", response_model=ReminderStatusResponse)
def get_reminder_status(
    user_id: str = "user-001",
    db: Session = Depends(get_db)
):
    """
    Returns real-time status: whether user has practiced today, whether reminder was sent,
    and scheduled local reminder time in user's timezone.
    """
    return reminder_service.get_reminder_status(user_id=user_id, db=db)


@router.post("/test", response_model=ReminderTestResponse)
@router.post("/test/{user_id}", response_model=ReminderTestResponse)
def test_reminder(
    req: Optional[ReminderTestRequest] = None,
    user_id: str = "user-001",
    db: Session = Depends(get_db)
):
    """
    Triggers an immediate test reminder using the real agent decision pipeline.
    In development mode, logs formatted notification and records to reminder_logs table.
    """
    try:
        payload = req.model_dump(exclude_none=True) if req else {}
        result = reminder_service.dispatch_reminder(
            user_id=user_id,
            db=db,
            is_test=True,
            custom_payload=payload if payload else None
        )
        return ReminderTestResponse(
            status=result["status"],
            delivered=result.get("delivered", False),
            email_sent=result.get("email_sent", False),
            deliveryMode=result.get("mode", "development"),
            recipient=result["recipient"],
            subject=result["subject"],
            bodyPreview=result["bodyPreview"],
            htmlContent=result["htmlContent"],
            timestamp=result["timestamp"],
            explanation=result["explanation"]
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to trigger test reminder: {str(exc)}")


@router.get("/history", response_model=List[ReminderLogResponse])
@router.get("/history/{user_id}", response_model=List[ReminderLogResponse])
def get_reminder_history(
    user_id: str = "user-001",
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetches reminder dispatch history and audit logs from SQLite database."""
    logs = reminder_service.get_reminder_history(user_id=user_id, db=db, limit=limit)
    return [
        ReminderLogResponse(
            id=log.id,
            user_id=log.user_id,
            reminder_date=log.reminder_date,
            reminder_type=log.reminder_type,
            subject=log.subject,
            message=log.message,
            status=log.status,
            sent_at=log.sent_at
        )
        for log in logs
    ]


@router.post("/check-now")
def trigger_scheduler_cycle():
    """
    Development/Testing utility: forces an immediate scheduler evaluation cycle
    across all active candidates without waiting for the 60-second timer.
    """
    results = proactive_scheduler.run_check_cycle()
    return {
        "status": "success",
        "evaluated_at": proactive_scheduler.last_check_time,
        "dispatches": results
    }


@router.get("/scheduler/status")
def get_scheduler_status():
    """Checks background proactive reminder scheduler loop telemetry."""
    return proactive_scheduler.get_status()
