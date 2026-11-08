"""
Proactive Reminder Service & Duplicate Prevention Engine
AI Career Preparation Agent
"""

import logging
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import User, ReminderPreference, ReminderLog, SkillGap, Interview
from ..schemas.reminder import (
    ReminderPreferenceUpdate,
    ReminderPreferenceResponse,
    ReminderStatusResponse,
    ReminderTestResponse
)
from .activity_service import has_practiced_today
from .recommendation_service import evaluate_next_best_action
from .email_service import get_email_service

logger = logging.getLogger("reminder_service")

PLACEHOLDER_EMAILS = {
    "candidate@example.com",
    "user@example.com",
    "test@example.com",
    "demo@example.com",
    "placeholder@example.com"
}


def is_valid_delivery_email(email: Optional[str]) -> bool:
    """
    Validates candidate email address for reminder delivery.
    Rejects missing, malformed, or default placeholder addresses.
    """
    if not email or not isinstance(email, str):
        return False
    email_clean = email.strip().lower()
    if email_clean in PLACEHOLDER_EMAILS:
        return False
    if "@" not in email_clean or "." not in email_clean.split("@")[-1]:
        return False
    import re
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email_clean):
        return False
    return True



def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_user_timezone(tz_name: Optional[str]) -> ZoneInfo:
    """Safely resolves timezone with fallback to Asia/Kolkata."""
    if not tz_name:
        return ZoneInfo("Asia/Kolkata")
    try:
        return ZoneInfo(tz_name.strip())
    except Exception:
        logger.warning(f"Unrecognized timezone '{tz_name}', falling back to Asia/Kolkata")
        return ZoneInfo("Asia/Kolkata")


class ProactiveReminderService:
    """
    Evaluates candidate reminder eligibility, personalizes prompts,
    dispatches emails (development mode vs SMTP), and prevents duplicate notifications.
    """

    def get_preferences(self, user_id: str, db: Session) -> ReminderPreference:
        """Retrieves or creates candidate reminder preferences."""
        pref = (
            db.query(ReminderPreference)
            .filter(ReminderPreference.user_id == user_id)
            .first()
        )
        if not pref:
            now = utc_now()
            pref = ReminderPreference(
                user_id=user_id,
                enabled=False,
                time="19:00",
                preferred_time="19:00",
                method="email",
                email="candidate@example.com",
                timezone="Asia/Kolkata",
                frequency="daily",
                target_role="Machine Learning Engineer",
                created_at=now,
                updated_at=now
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        else:
            dirty = False
            if not pref.created_at:
                pref.created_at = utc_now()
                dirty = True
            if not pref.updated_at:
                pref.updated_at = utc_now()
                dirty = True
            if dirty:
                db.commit()
                db.refresh(pref)
        return pref

    def update_preferences(
        self, user_id: str, data: ReminderPreferenceUpdate, db: Session
    ) -> ReminderPreference:
        """Updates and persists candidate reminder settings."""
        pref = self.get_preferences(user_id, db)

        if data.enabled is not None:
            pref.enabled = data.enabled
        if data.preferred_time is not None:
            pref.preferred_time = data.preferred_time
            pref.time = data.preferred_time
        elif data.time is not None:
            pref.preferred_time = data.time
            pref.time = data.time
        if data.method is not None:
            pref.method = data.method
        if data.email is not None:
            pref.email = data.email
        if data.timezone is not None:
            pref.timezone = data.timezone
        if data.frequency is not None:
            pref.frequency = data.frequency
        if data.target_role is not None:
            pref.target_role = data.target_role

        pref.updated_at = utc_now()
        db.commit()
        db.refresh(pref)
        return pref

    def should_send_daily_reminder(
        self, user_id: str, current_datetime: datetime, db: Session
    ) -> Tuple[bool, str, Optional[datetime]]:
        """
        Determines if a candidate should receive a proactive reminder at current_datetime.
        Evaluates 7 conditions including timezone local time, meaningful practice detection,
        and database duplicate prevention.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, f"User {user_id} not found in database", None

        pref = (
            db.query(ReminderPreference)
            .filter(ReminderPreference.user_id == user_id)
            .first()
        )

        # Condition 1: Reminders must be enabled
        if not pref or not pref.enabled:
            return False, "Proactive reminders are disabled by user", None

        # Condition 2: Valid candidate email required (non-placeholder)
        if not is_valid_delivery_email(pref.email):
            return False, "Configured email address is a placeholder or invalid (e.g. candidate@example.com)", None

        # Condition 3: Timezone local time resolution
        user_tz = get_user_timezone(pref.timezone)
        dt_aware = current_datetime if current_datetime.tzinfo else current_datetime.replace(tzinfo=timezone.utc)
        local_now = dt_aware.astimezone(user_tz)

        # Condition 4: Frequency check (weekdays only)
        if pref.frequency == "weekdays" and local_now.weekday() >= 5:
            return False, "Weekend skipped for weekday-only frequency", local_now

        # Condition 5: Preferred time reached
        pref_time_str = pref.preferred_time or pref.time or "19:00"
        target_hour, target_min = 19, 0
        try:
            if ":" in str(pref_time_str):
                parts = str(pref_time_str).split(":", 1)
                h, m = int(parts[0]), int(parts[1])
                if 0 <= h <= 23 and 0 <= m <= 59:
                    target_hour, target_min = h, m
        except Exception:
            target_hour, target_min = 19, 0

        target_time = local_now.replace(hour=target_hour, minute=target_min, second=0, microsecond=0)
        if local_now < target_time:
            return (
                False,
                f"Preferred reminder time ({pref_time_str}) not yet reached in {pref.timezone} (current: {local_now.strftime('%H:%M')})",
                local_now
            )

        # Condition 6: Meaningful activity auto-suppression
        if has_practiced_today(db, user_id):
            return False, "User has already completed meaningful career practice today", local_now

        # Condition 7: Duplicate prevention (database check for today's local date, excluding test dispatches)
        today_date_str = local_now.strftime("%Y-%m-%d")
        already_sent = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .filter(ReminderLog.reminder_date == today_date_str)
            .filter(ReminderLog.reminder_type != "test_reminder")
            .filter(ReminderLog.status.in_(["sent", "development"]))
            .first()
        )
        if already_sent:
            return False, f"Reminder has already been dispatched for today ({today_date_str})", local_now

        return True, "Eligible for proactive daily practice reminder", local_now

    def generate_personalized_reminder(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Synthesizes a personalized, high-yield practice prompt matching Prompt Section 16:
        1. Important unresolved skill gap (e.g. SQL, Docker, Kubernetes)
        2. Repeated interview weakness (e.g. Communication STAR clarity < 70%)
        3. Today's personalized challenge / NBA recommendation
        4. Streak preservation (if streak > 0)
        5. General daily practice
        """
        user = db.query(User).filter(User.id == user_id).first()
        target_role = user.target_role if user else "Machine Learning Engineer"
        streak = user.streak if user else 0

        # 1. Important unresolved skill gap
        critical_gap = (
            db.query(SkillGap)
            .filter(SkillGap.user_id == user_id)
            .filter(SkillGap.priority == "high")
            .order_by(SkillGap.current_score.asc())
            .first()
        )
        if critical_gap:
            skill = critical_gap.skill_name
            return {
                "reminder_type": "skill_gap_reminder",
                "primary_skill": skill,
                "drill_title": f"Bridge Your {skill} Competency Gap",
                "drill_prompt": f"{skill} is currently one of your highest-priority skill gaps. Spend 15 minutes practicing {skill} today to keep your progress moving.",
                "subject": f"⚡ Action Required: Bridge your {skill} gap today"
            }

        # 2. Repeated interview weakness (e.g. Communication STAR clarity < 70%)
        latest_interview = (
            db.query(Interview)
            .filter(Interview.user_id == user_id)
            .order_by(desc(Interview.created_at))
            .first()
        )
        if latest_interview:
            rubrics = latest_interview.rubric_scores or {}
            clarity = rubrics.get("clarity", 100)
            if clarity <= 10:
                clarity *= 10
            if clarity < 70:
                return {
                    "reminder_type": "communication_drill_reminder",
                    "primary_skill": "Communication (STAR)",
                    "drill_title": "Structure a 60-Second Behavioral Response",
                    "drill_prompt": "Your recent communication scores have been lower than your technical scores. Try today's STAR behavioral challenge.",
                    "subject": "🎯 AI Coach: Sharpen your interview communication structure today"
                }

        # 3. Next-Best-Action recommendation
        nba = evaluate_next_best_action(db, user_id)
        if nba and nba.action_type in ["communication_practice", "confidence_drill", "skill_challenge"]:
            skill = nba.primary_skill or target_role
            return {
                "reminder_type": "nba_recommendation_reminder",
                "primary_skill": skill,
                "drill_title": nba.headline or nba.title,
                "drill_prompt": nba.reason,
                "subject": f"🎯 AI Coach: {nba.headline}"
            }

        # 4. Streak preservation (if streak > 0)
        if streak > 0:
            return {
                "reminder_type": "streak_preservation_reminder",
                "primary_skill": "Daily Consistency",
                "drill_title": f"Protect Your {streak}-Day Practice Streak",
                "drill_prompt": f"You haven't practiced today. Complete your daily interview challenge to keep your {streak}-day streak going.",
                "subject": f"🔥 Keep your {streak}-day streak alive!"
            }

        # 5. General daily conceptual practice
        return {
            "reminder_type": "daily_practice_prompt",
            "primary_skill": target_role,
            "drill_title": f"Core {target_role} Conceptual Challenge",
            "drill_prompt": "You haven't completed today's preparation yet. A quick 10-minute challenge is waiting for you.",
            "subject": "⏰ AI Career Coach: Daily 10-minute practice pending"
        }

    def dispatch_reminder(
        self,
        user_id: str,
        db: Session,
        is_test: bool = False,
        custom_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes reminder dispatch. Sends email via EmailService and logs record to SQLite.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        pref = self.get_preferences(user_id, db)
        user_tz = get_user_timezone(pref.timezone)
        local_now = utc_now().astimezone(user_tz)
        today_date_str = local_now.strftime("%Y-%m-%d")

        # If not a test dispatch, verify full eligibility
        if not is_test:
            eligible, reason, _ = self.should_send_daily_reminder(user_id, utc_now(), db)
            if not eligible:
                logger.info(f"Skipping reminder for {user_id}: {reason}")
                return {"status": "skipped", "reason": reason, "delivered": False, "email_sent": False}

        # Generate personalized drill prompt or use custom test payload
        if custom_payload:
            drill_info = {
                "reminder_type": "test_reminder",
                "primary_skill": custom_payload.get("weakSkill") or "Communication (STAR Method)",
                "drill_title": f"Targeted {custom_payload.get('weakSkill', 'Career')} Drill",
                "drill_prompt": f"Practice prompt generated for {custom_payload.get('targetRole', user.target_role)}.",
                "subject": f"🔥 Proactive Practice Drill: {custom_payload.get('weakSkill', 'Career Preparation')}"
            }
            recipient = custom_payload.get("email") or pref.email
            role = custom_payload.get("targetRole") or user.target_role
            name = custom_payload.get("candidateName") or user.name
            streak = custom_payload.get("currentStreak", user.streak)
        else:
            drill_info = self.generate_personalized_reminder(user_id, db)
            recipient = pref.email
            role = user.target_role
            name = user.name
            streak = user.streak

        # Verify valid non-placeholder email before production dispatch
        if not is_test and not is_valid_delivery_email(recipient):
            logger.info(f"Skipping production reminder for {user_id}: placeholder or invalid email.")
            return {
                "status": "skipped",
                "reason": "Configured email address is a placeholder or invalid (e.g. candidate@example.com)",
                "delivered": False,
                "email_sent": False
            }

        # Atomic pre-reservation to prevent concurrent multi-worker dispatch races
        log_entry = None
        if not is_test:
            existing_log = db.query(ReminderLog).filter(
                ReminderLog.user_id == user_id,
                ReminderLog.reminder_date == today_date_str,
                ReminderLog.reminder_type != "test_reminder"
            ).first()

            if existing_log:
                if existing_log.status in ["sent", "development"]:
                    logger.info(f"Reminder already claimed/dispatched today for {user_id}")
                    return {"status": "skipped", "reason": "Already dispatched or claimed today", "delivered": False, "email_sent": False}
                elif existing_log.status == "pending":
                    # Check if pending record is stale (> 300 seconds)
                    created_ts = existing_log.created_at or existing_log.sent_at or utc_now()
                    if created_ts.tzinfo is None:
                        created_ts = created_ts.replace(tzinfo=timezone.utc)
                    age_seconds = (utc_now() - created_ts).total_seconds()
                    if age_seconds < 300:
                        logger.info(f"Concurrent reminder dispatch currently pending for {user_id} (age: {age_seconds:.1f}s)")
                        return {"status": "skipped", "reason": "Concurrent worker currently processing dispatch", "delivered": False, "email_sent": False}
                    # Stale pending record: reclaim it safely via database-level atomic conditional update
                    stale_cutoff = utc_now() - timedelta(seconds=300)
                    rows_updated = (
                        db.query(ReminderLog)
                        .filter(
                            ReminderLog.id == existing_log.id,
                            ReminderLog.status == "pending",
                            ReminderLog.created_at <= stale_cutoff
                        )
                        .update(
                            {
                                ReminderLog.status: "pending",
                                ReminderLog.created_at: utc_now(),
                                ReminderLog.message: "Reclaiming stale pending dispatch..."
                            },
                            synchronize_session=False
                        )
                    )
                    try:
                        db.commit()
                    except Exception:
                        db.rollback()
                        rows_updated = 0

                    if rows_updated == 0:
                        logger.info(f"Another worker already claimed stale reminder for {user_id}")
                        return {"status": "skipped", "reason": "Concurrent worker already claimed reminder", "delivered": False, "email_sent": False}
                    log_entry = existing_log
                elif existing_log.status == "failed":
                    # Allow safe retry of failed dispatch via database-level atomic conditional update
                    rows_updated = (
                        db.query(ReminderLog)
                        .filter(
                            ReminderLog.id == existing_log.id,
                            ReminderLog.status == "failed"
                        )
                        .update(
                            {
                                ReminderLog.status: "pending",
                                ReminderLog.sent_at: utc_now(),
                                ReminderLog.created_at: utc_now(),
                                ReminderLog.message: "Retrying failed dispatch..."
                            },
                            synchronize_session=False
                        )
                    )
                    try:
                        db.commit()
                    except Exception:
                        db.rollback()
                        rows_updated = 0

                    if rows_updated == 0:
                        logger.info(f"Another worker already claimed retry for {user_id}")
                        return {"status": "skipped", "reason": "Concurrent worker already claimed retry", "delivered": False, "email_sent": False}
                    log_entry = existing_log
                else:
                    log_entry = existing_log
            else:
                log_entry = ReminderLog(
                    user_id=user_id,
                    reminder_date=today_date_str,
                    reminder_type=drill_info["reminder_type"],
                    subject=drill_info["subject"],
                    message="Dispatching...",
                    status="pending",
                    sent_at=utc_now(),
                    created_at=utc_now()
                )
                try:
                    db.add(log_entry)
                    db.commit()
                    db.refresh(log_entry)
                except Exception as insert_exc:
                    db.rollback()
                    logger.warning(f"Concurrent multi-worker reminder race prevented: {insert_exc}")
                    return {"status": "skipped", "reason": "Concurrent worker already claimed reminder", "delivered": False, "email_sent": False}

        # Call Email Service with strict error handling and audit tracking
        try:
            email_svc = get_email_service()
            result = email_svc.send_email(
                recipient_email=recipient,
                candidate_name=name,
                target_role=role,
                current_streak=streak,
                drill_title=drill_info["drill_title"],
                drill_prompt=drill_info["drill_prompt"],
                primary_skill=drill_info["primary_skill"],
                subject=drill_info["subject"]
            )

            if log_entry:
                log_entry.status = result.get("status", "sent")
                log_entry.subject = result.get("subject", drill_info["subject"])
                log_entry.message = drill_info["drill_prompt"]
                log_entry.sent_at = utc_now()
                db.commit()
            elif is_test:
                # Isolate test reminders with unique key so they never overwrite or block production reminders
                import uuid
                test_date_key = f"test_{today_date_str}_{uuid.uuid4().hex[:8]}"
                test_log = ReminderLog(
                    user_id=user_id,
                    reminder_date=test_date_key,
                    reminder_type="test_reminder",
                    subject=result.get("subject", drill_info["subject"]),
                    message=drill_info["drill_prompt"],
                    status=result.get("status", "development"),
                    sent_at=utc_now(),
                    created_at=utc_now()
                )
                try:
                    db.add(test_log)
                    db.commit()
                except Exception as t_exc:
                    db.rollback()
                    logger.warning(f"Could not record test reminder log: {t_exc}")

            return result
        except Exception as send_err:
            if log_entry:
                try:
                    log_entry.status = "failed"
                    log_entry.message = f"Delivery failed: {str(send_err)}"
                    db.commit()
                except Exception:
                    db.rollback()
            raise

    def get_reminder_status(self, user_id: str, db: Session) -> ReminderStatusResponse:
        """Computes comprehensive reminder status for candidate settings."""
        pref = self.get_preferences(user_id, db)
        user_tz = get_user_timezone(pref.timezone)
        local_now = utc_now().astimezone(user_tz)
        today_date_str = local_now.strftime("%Y-%m-%d")

        practiced = has_practiced_today(db, user_id)
        already_sent = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .filter(ReminderLog.reminder_date == today_date_str)
            .filter(ReminderLog.reminder_type != "test_reminder")
            .filter(ReminderLog.status.in_(["sent", "development"]))
            .first()
        ) is not None

        last_log = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .order_by(desc(ReminderLog.sent_at))
            .first()
        )

        if not pref.enabled:
            status_msg = "Proactive daily reminders are currently disabled."
        elif practiced:
            status_msg = "You're all caught up for today! Proactive reminder is on standby."
        elif already_sent:
            status_msg = f"Today's practice reminder was already dispatched at {pref.preferred_time} ({pref.timezone})."
        else:
            status_msg = f"Today's practice is pending. Reminder scheduled for {pref.preferred_time} ({pref.timezone})."

        return ReminderStatusResponse(
            enabled=pref.enabled,
            preferred_time=pref.preferred_time or pref.time or "19:00",
            method=pref.method,
            email=pref.email,
            timezone=pref.timezone,
            current_local_time=local_now.strftime("%H:%M %Z"),
            practiced_today=practiced,
            reminder_sent_today=already_sent,
            last_reminder=last_log.sent_at.isoformat() if last_log else None,
            status_message=status_msg
        )

    def get_reminder_history(self, user_id: str, db: Session, limit: int = 20) -> List[ReminderLog]:
        """Fetches past reminder dispatch logs."""
        return (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .order_by(desc(ReminderLog.sent_at))
            .limit(limit)
            .all()
        )


reminder_service = ProactiveReminderService()
