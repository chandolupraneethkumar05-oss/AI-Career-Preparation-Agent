"""
Data Models and Enums for Secure Sandbox Execution
AI Career Preparation Agent
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ExecutionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    COMPILE_ERROR = "COMPILE_ERROR"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    SECURITY_VIOLATION = "SECURITY_VIOLATION"
    SANDBOX_ERROR = "SANDBOX_ERROR"


class TestCase(BaseModel):
    """Hidden server-side test case definition."""
    input_data: str = ""
    expected_output: str = ""
    is_hidden: bool = True
    description: Optional[str] = None


class SingleTestResult(BaseModel):
    """Result for a single test case execution."""
    test_index: int
    passed: bool
    is_hidden: bool
    input_display: str
    expected_display: Optional[str] = None
    actual_output: str = ""
    error: Optional[str] = None
    time_ms: float = 0.0


class ExecutionLimits(BaseModel):
    """Configurable resource limits for sandbox execution."""
    cpu_timeout_seconds: float = 2.0
    memory_limit_mb: int = 256
    max_output_bytes: int = 65536  # 64 KB
    max_input_bytes: int = 65536
    pids_limit: int = 64
    network_enabled: bool = False


class ExecutionJob(BaseModel):
    """Job submitted for execution."""
    id: str
    user_id: str
    challenge_id: Optional[str] = None
    language: str = "python"
    code: str
    status: ExecutionStatus = ExecutionStatus.PENDING
    limits: ExecutionLimits = Field(default_factory=ExecutionLimits)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExecutionResult(BaseModel):
    """Final output from sandbox execution."""
    job_id: str
    status: ExecutionStatus
    exit_code: int = 0
    stdout: str = ""
    stderr: str = ""
    execution_time_ms: float = 0.0
    memory_used_mb: float = 0.0
    total_tests: int = 0
    passed_tests: int = 0
    test_results: List[SingleTestResult] = Field(default_factory=list)
    error_message: Optional[str] = None
    executor_type: str = "unknown"
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
