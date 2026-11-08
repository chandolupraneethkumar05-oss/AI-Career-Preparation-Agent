"""
Proactive Reminders API Controller
AI Career Preparation Agent
"""

import os
import hmac
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Header
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import ReminderPreference, ReminderLog, User
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
from .deps import get_current_user, get_optional_current_user, verify_user_ownership

logger = logging.getLogger("reminders_api")

router = APIRouter(prefix="/reminders", tags=["Proactive Reminders"])


def verify_internal_operational_access(
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret"),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> bool:
    """
    Guards internal background scheduler triggers and status endpoints.
    Requires a valid internal service secret (X-Internal-Secret matching INTERNAL_SCHEDULER_KEY
    or INTERNAL_SERVICE_KEY) or an authenticated administrative/service identity (current_user.role == 'admin').
    Ordinary authenticated candidates without the internal secret are strictly rejected with 403 Forbidden.
    Unauthenticated callers without the internal secret are rejected with 401 Unauthorized.
    """
    internal_key = os.getenv("INTERNAL_SCHEDULER_KEY") or os.getenv("INTERNAL_SERVICE_KEY")

    if x_internal_secret:
        if internal_key and hmac.compare_digest(x_internal_secret, internal_key):
            return True
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid internal operational secret."
        )

    if current_user:
        user_role = (getattr(current_user, "role", "") or "").lower()
        if user_role in ["admin", "service", "system"]:
            return True
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges or internal service secret required."
        )

    raise HTTPException(
        status_code=401,
        detail="Authentication required for internal scheduler operations.",
        headers={"WWW-Authenticate": "Bearer"}
    )


@router.get("/preferences", response_model=ReminderPreferenceResponse)
@router.get("/preferences/{user_id}", response_model=ReminderPreferenceResponse)
def get_preferences(
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active proactive reminder preferences for candidate."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    pref = reminder_service.get_preferences(user_id=effective_user_id, db=db)
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
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save candidate proactive reminder preferences."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        updated = reminder_service.update_preferences(user_id=effective_user_id, data=prefs, db=db)
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
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update reminder preferences")
        raise HTTPException(status_code=400, detail="Failed to update reminder preferences.")


@router.get("/status", response_model=ReminderStatusResponse)
@router.get("/status/{user_id}", response_model=ReminderStatusResponse)
def get_reminder_status(
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns real-time status: whether user has practiced today, whether reminder was sent,
    and scheduled local reminder time in user's timezone.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    return reminder_service.get_reminder_status(user_id=effective_user_id, db=db)


@router.post("/test", response_model=ReminderTestResponse)
@router.post("/test/{user_id}", response_model=ReminderTestResponse)
def test_reminder(
    req: Optional[ReminderTestRequest] = None,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers an immediate test reminder using the real agent decision pipeline.
    In development mode, logs formatted notification and records to reminder_logs table.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        payload = req.model_dump(exclude_none=True) if req else {}
        result = reminder_service.dispatch_reminder(
            user_id=effective_user_id,
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
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to trigger test reminder")
        raise HTTPException(status_code=500, detail="Failed to trigger test reminder.")


@router.get("/history", response_model=List[ReminderLogResponse])
@router.get("/history/{user_id}", response_model=List[ReminderLogResponse])
def get_reminder_history(
    user_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches reminder dispatch history and audit logs from SQLite database."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    logs = reminder_service.get_reminder_history(user_id=effective_user_id, db=db, limit=limit)
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


@router.post("/check-now", dependencies=[Depends(verify_internal_operational_access)])
def trigger_scheduler_cycle():
    """
    Development/Testing utility: forces an immediate scheduler evaluation cycle
    across all active candidates without waiting for the 60-second timer.
    Protected internal operational endpoint.
    """
    results = proactive_scheduler.run_check_cycle()
    return {
        "status": "success",
        "evaluated_at": proactive_scheduler.last_check_time,
        "dispatches": results
    }


@router.get("/scheduler/status", dependencies=[Depends(verify_internal_operational_access)])
def get_scheduler_status():
    """
    Checks background proactive reminder scheduler loop telemetry.
    Protected internal operational endpoint.
    """
    return proactive_scheduler.get_status()
