"""
Structured Logging, Correlation Tracking & AI Telemetry
AI Career Preparation Agent
"""

import json
import logging
import re
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Request Correlation ID Context Variable for async request tracing
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="-")

# Sensitive keys to scrub from logs
SENSITIVE_PATTERNS = [
    re.compile(r"(password|token|secret|api_key|access_token|authorization|bearer)\s*[:=]\s*['\"]?([^'\",\s]+)", re.IGNORECASE),
    re.compile(r"('password'|'token'|'secret'|'api_key'|'access_token'):\s*['\"]([^'\"]+)['\"]", re.IGNORECASE),
    re.compile(r"(\"password\"|\"token\"|\"secret\"|\"api_key\"|\"access_token\"):\s*\"([^\"]+)\"", re.IGNORECASE)
]


def redact_sensitive_data(message: str) -> str:
    """Scans and masks credentials, passwords, and tokens from log messages."""
    redacted = message
    for pattern in SENSITIVE_PATTERNS:
        redacted = pattern.sub(r"\1=***REDACTED***", redacted)
    return redacted


class StructuredJsonFormatter(logging.Formatter):
    """
    Emits single-line JSON log events containing correlation ID, module,
    log severity, and automatic credential redaction.
    """

    def format(self, record: logging.LogRecord) -> str:
        cid = correlation_id_ctx.get("-")
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_sensitive_data(record.getMessage()),
            "correlation_id": cid,
        }

        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        # Include custom extra metadata if passed
        for key in ("event", "method", "path", "status_code", "duration_ms", "provider", "model"):
            if hasattr(record, key):
                log_payload[key] = getattr(record, key)

        return json.dumps(log_payload)


class AIMetricsTracker:
    """Thread-safe telemetry tracking for AI provider invocations and fallback cascades."""

    def __init__(self):
        self._total_requests = 0
        self._provider_calls: Dict[str, int] = {}
        self._provider_failures: Dict[str, int] = {}
        self._fallback_count = 0

    def record_call(self, provider: str):
        self._total_requests += 1
        self._provider_calls[provider] = self._provider_calls.get(provider, 0) + 1

    def record_failure(self, provider: str, error: str):
        self._provider_failures[provider] = self._provider_failures.get(provider, 0) + 1
        cid = correlation_id_ctx.get("-")
        logger = logging.getLogger("ai_telemetry")
        logger.warning(
            f"AI Provider Failure: {provider} failed with {error}",
            extra={"event": "ai_failure", "provider": provider, "correlation_id": cid}
        )

    def record_fallback(self):
        self._fallback_count += 1

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "total_requests": self._total_requests,
            "provider_calls": dict(self._provider_calls),
            "provider_failures": dict(self._provider_failures),
            "fallbacks_invoked": self._fallback_count
        }


ai_metrics_tracker = AIMetricsTracker()


def setup_structured_logging():
    """Configures root logger with structured JSON output and security redactions."""
    root_logger = logging.getLogger()
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(StructuredJsonFormatter())
    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)
