"""
Background Proactive Scheduler
Asynchronous evaluation loop running during the FastAPI application lifecycle.
"""

import asyncio
import inspect
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Callable, Union

from ..db.database import SessionLocal
from ..db.models import ReminderPreference
from .reminder_service import reminder_service

logger = logging.getLogger("scheduler")


async def _invoke_handler(handler: Callable[[], Any]) -> Any:
    """
    Executes a registered job handler safely.
    - If the handler is an async coroutine function, it is awaited directly on the event loop.
    - If the handler is synchronous, it is executed off-thread via asyncio.to_thread
      to prevent blocking the main event loop.
    - If a synchronous callable returns a coroutine, that coroutine is awaited.
    """
    is_coro_fn = inspect.iscoroutinefunction(handler)
    if not is_coro_fn and hasattr(handler, "__call__"):
        is_coro_fn = inspect.iscoroutinefunction(handler.__call__)

    if is_coro_fn:
        return await handler()

    result = await asyncio.to_thread(handler)
    if inspect.isawaitable(result):
        return await result
    return result


class ProactiveScheduler:
    """
    Evaluates enabled candidate reminder preferences on a periodic cycle (default 60s)
    and executes registered background recurring jobs (such as expired ticket cleanup).
    Dispatches personalized practice reminders if the candidate has not practiced today
    and has not already received a reminder for today's date.
    """

    def __init__(
        self,
        check_interval_seconds: int = 60,
        ticket_cleanup_interval_seconds: int = 86400,
        ticket_cleanup_retry_seconds: int = 300
    ):
        self.interval = check_interval_seconds
        self.ticket_cleanup_interval = ticket_cleanup_interval_seconds
        self.ticket_cleanup_retry_interval = ticket_cleanup_retry_seconds
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.start_time: Optional[datetime] = None
        self.last_check_time: Optional[str] = None
        self.last_ticket_cleanup_time: Optional[str] = None
        self.total_dispatched = 0
        self._registered_jobs: Dict[str, Dict[str, Any]] = {}

        # Register recurring ticket cleanup job (daily by default: 86400s, retry in 300s)
        self.register_job(
            job_id="cleanup_expired_tickets",
            name="Cleanup Expired Consumed Stream Tickets",
            interval_seconds=self.ticket_cleanup_interval,
            retry_interval_seconds=self.ticket_cleanup_retry_interval,
            handler=lambda: self.cleanup_expired_tickets(raise_on_error=True)
        )

    def register_job(
        self,
        job_id: str,
        name: str,
        interval_seconds: int,
        handler: Callable[[], Any],
        retry_interval_seconds: int = 300
    ) -> bool:
        """
        Registers a recurring scheduled task with the scheduler.
        Supports both synchronous callables (dispatched off-thread via asyncio.to_thread)
        and asynchronous coroutine handlers (awaited on the event loop).
        Prevents duplicate registrations if a job with the same job_id is already registered.
        """
        if job_id in self._registered_jobs:
            logger.debug(f"Job '{job_id}' is already registered with scheduler. Skipping duplicate.")
            return False

        self._registered_jobs[job_id] = {
            "name": name,
            "interval_seconds": interval_seconds,
            "retry_interval_seconds": retry_interval_seconds,
            "handler": handler,
            "last_run": None,
            "last_run_time": None,
            "last_failed_at": None,
            "last_status": None,
            "is_running": False
        }
        logger.info(f"Registered scheduled job '{job_id}' ({name}) every {interval_seconds}s (retry: {retry_interval_seconds}s).")
        return True

    def get_registered_jobs(self) -> Dict[str, Any]:
        """Returns metadata for all registered recurring jobs."""
        return {
            jid: {
                "name": j["name"],
                "interval_seconds": j["interval_seconds"],
                "retry_interval_seconds": j.get("retry_interval_seconds", 300),
                "last_run_time": j["last_run_time"],
                "last_status": j.get("last_status"),
                "is_running": j.get("is_running", False)
            }
            for jid, j in self._registered_jobs.items()
        }

    def cleanup_expired_tickets(self, raise_on_error: bool = False) -> int:
        """
        Executes a cleanup pass to purge expired consumed stream tickets.
        Uses a fresh, short-lived database session, guarantees session closure in finally block,
        and logs exceptions. If raise_on_error is True, re-raises so the scheduler loop
        can register the failure and trigger the retry interval.
        """
        db = SessionLocal()
        try:
            from ..core.security import cleanup_expired_consumed_tickets
            deleted = cleanup_expired_consumed_tickets(db)
            self.last_ticket_cleanup_time = datetime.now(timezone.utc).isoformat()
            if deleted > 0:
                logger.info(f"Cleaned up {deleted} expired consumed stream tickets.")
            return deleted
        except Exception as exc:
            logger.error(f"Error during consumed ticket cleanup: {exc}", exc_info=True)
            if raise_on_error:
                raise
            return 0
        finally:
            db.close()

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
                    db.rollback()
                    logger.error(f"Error processing reminder for user {pref.user_id}: {user_exc}", exc_info=True)
        finally:
            db.close()

        return dispatched_results

    async def _run_pending_jobs(
        self,
        current_time: Optional[Union[datetime, Callable[[], datetime]]] = None,
        completion_time: Optional[Union[datetime, Callable[[], datetime]]] = None
    ):
        """
        Evaluates and runs any registered jobs whose schedule or retry interval has arrived.
        Updates last_run ONLY upon successful completion with the actual completion timestamp.
        On failure, records the actual failure timestamp in last_failed_at so the job retries
        after retry_interval_seconds. Prevents concurrent duplicate executions of the same job.
        Supports both synchronous and asynchronous handlers safely.
        """
        def _get_time(t: Optional[Union[datetime, Callable[[], datetime]]]) -> datetime:
            if callable(t):
                return t()
            if isinstance(t, datetime):
                return t
            return datetime.now(timezone.utc)

        eval_time = _get_time(current_time)

        for job_id, job in list(self._registered_jobs.items()):
            if job.get("is_running", False):
                continue

            last_run = job.get("last_run")
            last_failed_at = job.get("last_failed_at")
            last_status = job.get("last_status")
            job_interval = job.get("interval_seconds", 86400)
            retry_interval = job.get("retry_interval_seconds", 300)

            is_due = False
            if last_status == "failed" and last_failed_at is not None:
                if (eval_time - last_failed_at).total_seconds() >= retry_interval:
                    is_due = True
            elif last_run is None:
                is_due = True
            elif (eval_time - last_run).total_seconds() >= job_interval:
                is_due = True

            if is_due:
                job["is_running"] = True
                try:
                    handler = job["handler"]
                    await _invoke_handler(handler)
                    completed_at = _get_time(completion_time) if completion_time is not None else _get_time(current_time)
                    job["last_run"] = completed_at
                    job["last_run_time"] = completed_at.isoformat()
                    job["last_status"] = "success"
                    job["last_failed_at"] = None
                except Exception as job_exc:
                    failed_at = _get_time(completion_time) if completion_time is not None else _get_time(current_time)
                    job["last_status"] = "failed"
                    job["last_failed_at"] = failed_at
                    logger.error(f"Error executing scheduled job '{job_id}': {job_exc}", exc_info=True)
                finally:
                    job["is_running"] = False

    async def _loop(self):
        logger.info(f"Proactive Daily Reminder scheduler loop active (cycle: {self.interval}s)")
        while self.is_running:
            # 1. Proactive reminder check cycle
            try:
                await asyncio.to_thread(self.run_check_cycle)
            except Exception as loop_exc:
                logger.error(f"Error in scheduler tick: {loop_exc}")

            # 2. Evaluate registered recurring jobs with retry logic
            try:
                await self._run_pending_jobs()
            except Exception as jobs_exc:
                logger.error(f"Error running pending recurring jobs: {jobs_exc}")

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
            "lastTicketCleanupTime": self.last_ticket_cleanup_time,
            "totalDispatched": self.total_dispatched,
            "registeredJobs": list(self._registered_jobs.keys())
        }


# Global singleton instance
proactive_scheduler = ProactiveScheduler()
