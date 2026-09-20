"""
Proactive Reminder Service & Duplicate Prevention Engine
AI Career Preparation Agent
"""

import logging
from datetime import datetime, timezone
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

        # Condition 2: Valid email required
        if not pref.email or "@" not in pref.email:
            return False, "No valid email address configured", None

        # Condition 3: Timezone local time resolution
        user_tz = get_user_timezone(pref.timezone)
        dt_aware = current_datetime if current_datetime.tzinfo else current_datetime.replace(tzinfo=timezone.utc)
        local_now = dt_aware.astimezone(user_tz)

        # Condition 4: Frequency check (weekdays only)
        if pref.frequency == "weekdays" and local_now.weekday() >= 5:
            return False, "Weekend skipped for weekday-only frequency", local_now

        # Condition 5: Preferred time reached
        pref_time_str = pref.preferred_time or pref.time or "19:00"
        try:
            target_hour, target_min = map(int, pref_time_str.split(":"))
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

        # Condition 7: Duplicate prevention (database check for today's local date)
        today_date_str = local_now.strftime("%Y-%m-%d")
        already_sent = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .filter(ReminderLog.reminder_date == today_date_str)
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

        # Call Email Service
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

        # Log into reminder_logs table in SQLite to ensure audit trail and prevent duplicates
        log_entry = ReminderLog(
            user_id=user_id,
            reminder_date=today_date_str,
            reminder_type=drill_info["reminder_type"],
            subject=result["subject"],
            message=drill_info["drill_prompt"],
            status=result["status"],
            sent_at=utc_now(),
            created_at=utc_now()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        return result

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
