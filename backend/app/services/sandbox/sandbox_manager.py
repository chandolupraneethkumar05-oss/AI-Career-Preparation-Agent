"""
Sandbox Manager and Job Coordinator
AI Career Preparation Agent
"""

import os
import uuid
import logging
from typing import Dict, Optional, List, Any

from .models import (
    ExecutionJob,
    ExecutionResult,
    ExecutionStatus,
    TestCase
)
from .base_executor import SandboxExecutor
from .docker_executor import DockerSandboxExecutor
from .process_executor import ProcessSandboxExecutor

logger = logging.getLogger("sandbox.manager")


class SandboxManager:
    """
    Coordinates code execution requests, selects the highest available isolation tier,
    and manages execution jobs and results.
    """

    def __init__(self):
        self.docker_executor = DockerSandboxExecutor()
        self.process_executor = ProcessSandboxExecutor()
        self._jobs: Dict[str, ExecutionJob] = {}
        self._results: Dict[str, ExecutionResult] = {}

    def get_system_capabilities(self) -> Dict[str, Any]:
        """Inspects all execution backends and returns host capability telemetry."""
        docker_caps = self.docker_executor.get_capabilities()
        process_caps = self.process_executor.get_capabilities()

        # Determine active default executor (process is default for fast isolated execution unless overridden)
        configured_default = os.getenv("SANDBOX_DEFAULT_EXECUTOR", "process").lower()
        if configured_default == "docker" and docker_caps["available"]:
            default_exec = "docker"
        elif process_caps["available"]:
            default_exec = "process"
        elif docker_caps["available"]:
            default_exec = "docker"
        else:
            default_exec = "process"

        return {
            "default_executor": default_exec,
            "docker": docker_caps,
            "process": process_caps
        }

    def get_executor(self, preferred_mode: Optional[str] = None) -> SandboxExecutor:
        """Selects appropriate sandbox executor based on preference and host availability."""
        configured_default = os.getenv("SANDBOX_DEFAULT_EXECUTOR", "process").lower()
        mode = (preferred_mode or configured_default).lower()

        if mode in ("docker", "container"):
            if self.docker_executor.is_available():
                return self.docker_executor
            raise RuntimeError(
                "Docker container sandbox was requested, but the Docker daemon is unreachable or not installed. Host execution is not permitted when container isolation is requested."
            )

        if mode == "process" and self.process_executor.is_available():
            return self.process_executor

        # Default fallback hierarchy: prefer process executor if available
        if self.process_executor.is_available():
            return self.process_executor
        if self.docker_executor.is_available():
            return self.docker_executor
        return self.process_executor

    def create_job(
        self,
        user_id: str,
        code: str,
        challenge_id: Optional[str] = None,
        language: str = "python"
    ) -> ExecutionJob:
        """Instantiates a new ExecutionJob with unique ID."""
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        job = ExecutionJob(
            id=job_id,
            user_id=user_id,
            challenge_id=challenge_id,
            language=language,
            code=code,
            status=ExecutionStatus.PENDING
        )
        self._jobs[job_id] = job
        return job

    def run_job(
        self,
        job: ExecutionJob,
        test_cases: Optional[List[TestCase]] = None,
        preferred_mode: Optional[str] = None
    ) -> ExecutionResult:
        """Synchronously executes the job and stores the result."""
        job.status = ExecutionStatus.RUNNING
        try:
            executor = self.get_executor(preferred_mode)
        except RuntimeError as mode_err:
            res = ExecutionResult(
                job_id=job.id,
                status=ExecutionStatus.SANDBOX_ERROR,
                error_message=str(mode_err),
                executor_type="docker"
            )
            job.status = res.status
            self._results[job.id] = res
            return res

        try:
            result = executor.execute(job, test_cases=test_cases)
            job.status = result.status
            self._results[job.id] = result
            return result
        except Exception as e:
            logger.error(f"Sandbox execution error on job {job.id}: {e}")
            res = ExecutionResult(
                job_id=job.id,
                status=ExecutionStatus.SANDBOX_ERROR,
                error_message=str(e),
                executor_type="unknown"
            )
            job.status = ExecutionStatus.SANDBOX_ERROR
            self._results[job.id] = res
            return res

    def get_job(self, job_id: str) -> Optional[ExecutionJob]:
        return self._jobs.get(job_id)

    def get_result(self, job_id: str) -> Optional[ExecutionResult]:
        return self._results.get(job_id)


# Global singleton instance
default_sandbox_manager = SandboxManager()
