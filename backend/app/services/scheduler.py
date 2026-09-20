"""
Background Proactive Scheduler
Asynchronous evaluation loop running during the FastAPI application lifecycle.
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from ..db.database import SessionLocal
from ..db.models import ReminderPreference
from .reminder_service import reminder_service

logger = logging.getLogger("scheduler")


class ProactiveScheduler:
    """
    Evaluates enabled candidate reminder preferences on a periodic cycle (default 60s).
    Dispatches personalized practice reminders if the candidate has not practiced today
    and has not already received a reminder for today's date.
    """

    def __init__(self, check_interval_seconds: int = 60):
        self.interval = check_interval_seconds
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.start_time: Optional[datetime] = None
        self.last_check_time: Optional[str] = None
        self.total_dispatched = 0

    def run_check_cycle(self) -> List[Dict[str, Any]]:
        """
        Executes a single evaluation pass across all active candidate reminder preferences.
        Can be invoked automatically by the background loop or manually via API for testing.
        """
        self.last_check_time = datetime.now(timezone.utc).isoformat()
        dispatched_results = []

        db = SessionLocal()
        try:
            enabled_prefs = (
                db.query(ReminderPreference)
                .filter(ReminderPreference.enabled == True)
                .all()
            )

            for pref in enabled_prefs:
                try:
                    eligible, reason, local_dt = reminder_service.should_send_daily_reminder(
                        user_id=pref.user_id,
                        current_datetime=datetime.now(timezone.utc),
                        db=db
                    )
                    if eligible:
                        logger.info(f"Triggering proactive reminder for user {pref.user_id}...")
                        result = reminder_service.dispatch_reminder(user_id=pref.user_id, db=db, is_test=False)
                        dispatched_results.append({
                            "user_id": pref.user_id,
                            "dispatched": True,
                            "result": result
                        })
                        self.total_dispatched += 1
                    else:
                        logger.debug(f"User {pref.user_id} skipped: {reason}")
                except Exception as user_exc:
                    logger.error(f"Error processing reminder for user {pref.user_id}: {user_exc}")
        finally:
            db.close()

        return dispatched_results

    async def _loop(self):
        logger.info(f"Proactive Daily Reminder scheduler loop active (cycle: {self.interval}s)")
        while self.is_running:
            try:
                self.run_check_cycle()
            except Exception as loop_exc:
                logger.error(f"Error in scheduler tick: {loop_exc}")

            try:
                await asyncio.sleep(self.interval)
            except asyncio.CancelledError:
                logger.info("Scheduler task cancelled cleanly.")
                break

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.start_time = datetime.now(timezone.utc)
            self.task = asyncio.create_task(self._loop())
            logger.info("Background proactive practice scheduler activated.")

    def stop(self):
        if self.is_running:
            self.is_running = False
            if self.task:
                self.task.cancel()
            logger.info("Background proactive practice scheduler stopped.")

    def get_status(self) -> Dict[str, Any]:
        return {
            "active": self.is_running,
            "intervalSeconds": self.interval,
            "startedAt": self.start_time.isoformat() if self.start_time else None,
            "lastCheckTime": self.last_check_time,
            "totalDispatched": self.total_dispatched
        }


# Global singleton instance
proactive_scheduler = ProactiveScheduler()
