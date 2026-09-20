"""
Docker-based Isolated Sandbox Executor
AI Career Preparation Agent
"""

import os
import time
import shutil
import tempfile
import subprocess
import logging
from typing import List, Optional, Dict, Any

from .base_executor import SandboxExecutor
from .models import (
    ExecutionJob,
    ExecutionResult,
    ExecutionStatus,
    TestCase,
    SingleTestResult
)

logger = logging.getLogger("sandbox.docker")


class DockerSandboxExecutor(SandboxExecutor):
    """
    Executes untrusted user code inside a disposable, unprivileged Docker container.
    Enforces network isolation, memory limits, CPU caps, read-only root, and no host mounts.
    """

    def __init__(self, image: str = "python:3.11-slim"):
        self.image = image
        self._available: Optional[bool] = None

    def is_available(self) -> bool:
        """Checks whether Docker CLI is installed and the daemon is reachable."""
        if self._available is not None:
            return self._available

        docker_bin = shutil.which("docker")
        if not docker_bin:
            self._available = False
            return False

        try:
            res = subprocess.run(
                [docker_bin, "info"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=3
            )
            self._available = (res.returncode == 0)
        except Exception as e:
            logger.debug(f"Docker availability check failed: {e}")
            self._available = False

        return self._available

    def get_capabilities(self) -> Dict[str, Any]:
        available = self.is_available()
        return {
            "executor_type": "docker",
            "available": available,
            "image": self.image,
            "isolation": "container",
            "network_disabled": True,
            "read_only_root": True,
            "non_root_user": True,
            "cgroups_enforced": True,
            "status_message": "Docker container sandbox active" if available else "Docker daemon not available on host"
        }

    def execute(
        self,
        job: ExecutionJob,
        test_cases: Optional[List[TestCase]] = None
    ) -> ExecutionResult:
        if not self.is_available():
            return ExecutionResult(
                job_id=job.id,
                status=ExecutionStatus.SANDBOX_ERROR,
                error_message="Docker sandbox executor is not available on this host.",
                executor_type="docker"
            )

        # Temporary workspace for candidate code
        temp_dir = tempfile.mkdtemp(prefix="docker_sandbox_")
        container_name = f"sandbox_job_{job.id[:12]}"
        docker_bin = shutil.which("docker") or "docker"

        try:
            # Write script to isolated temp directory
            script_path = os.path.join(temp_dir, "solution.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(job.code)

            # Build Docker execution command with strict security flags
            timeout_sec = job.limits.cpu_timeout_seconds
            mem_mb = job.limits.memory_limit_mb
            pids = job.limits.pids_limit

            harness_path = os.path.join(temp_dir, "harness.py")
            with open(harness_path, "w", encoding="utf-8") as f:
                f.write(
                    "import sys, os\n"
                    "input_text = sys.stdin.read()\n"
                    "trimmed = input_text.strip()\n"
                    "executed = False\n"
                    "try:\n"
                    "    import solution\n"
                    "    if ';' in trimmed or '\\n' in trimmed or trimmed.startswith('print(') or '=' in trimmed:\n"
                    "        exec(trimmed, solution.__dict__)\n"
                    "        executed = True\n"
                    "    elif trimmed:\n"
                    "        val = eval(trimmed, solution.__dict__)\n"
                    "        print(val if val is not None else 'None')\n"
                    "        executed = True\n"
                    "except (SyntaxError, NameError):\n"
                    "    executed = False\n"
                    "except Exception:\n"
                    "    import traceback\n"
                    "    traceback.print_exc()\n"
                    "    sys.exit(1)\n"
                    "if not executed:\n"
                    "    import subprocess\n"
                    "    p = subprocess.run([sys.executable, '-u', 'solution.py'], input=input_text, text=True, capture_output=True)\n"
                    "    sys.stdout.write(p.stdout)\n"
                    "    sys.stderr.write(p.stderr)\n"
                    "    sys.exit(p.returncode)\n"
                )

            entry_script = "harness.py" if test_cases else "solution.py"

            base_cmd = [
                docker_bin, "run",
                "-i",
                "--rm",
                "--network", "none",
                f"--memory={mem_mb}m",
                f"--memory-swap={mem_mb}m",
                "--cpus=1.0",
                f"--pids-limit={pids}",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
                "--user", "1000:1000",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges:true",
                "-v", f"{temp_dir}:/workspace:ro",
                "-w", "/workspace",
                "-e", "PYTHONUNBUFFERED=1",
                "-e", "PYTHONDONTWRITEBYTECODE=1",
                self.image,
                "python", entry_script
            ]

            if not test_cases:
                start_time = time.perf_counter()
                try:
                    proc = subprocess.run(
                        base_cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=timeout_sec + 1.0,
                        text=True,
                        errors="replace"
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    stdout_out = proc.stdout[:job.limits.max_output_bytes]
                    stderr_out = proc.stderr[:job.limits.max_output_bytes]

                    if proc.returncode == 0:
                        status = ExecutionStatus.PASSED
                    elif proc.returncode == 137:
                        status = ExecutionStatus.MEMORY_LIMIT_EXCEEDED
                        stderr_out = f"Memory limit of {mem_mb}MB exceeded (OOM killed)."
                    else:
                        status = ExecutionStatus.RUNTIME_ERROR

                    return ExecutionResult(
                        job_id=job.id,
                        status=status,
                        exit_code=proc.returncode,
                        stdout=stdout_out,
                        stderr=stderr_out,
                        execution_time_ms=elapsed_ms,
                        total_tests=1,
                        passed_tests=1 if status == ExecutionStatus.PASSED else 0,
                        executor_type="docker"
                    )

                except subprocess.TimeoutExpired:
                    elapsed_ms = round(timeout_sec * 1000, 2)
                    return ExecutionResult(
                        job_id=job.id,
                        status=ExecutionStatus.TIME_LIMIT_EXCEEDED,
                        exit_code=124,
                        stderr=f"Execution timed out after {timeout_sec} seconds (Time Limit Exceeded).",
                        execution_time_ms=elapsed_ms,
                        executor_type="docker"
                    )

            # If test cases are provided: Run test harness in Docker
            total_tests = len(test_cases)
            passed_tests = 0
            test_results: List[SingleTestResult] = []
            overall_status = ExecutionStatus.PASSED
            total_elapsed_ms = 0.0

            for idx, tc in enumerate(test_cases, start=1):
                start_time = time.perf_counter()
                try:
                    proc = subprocess.run(
                        base_cmd,
                        input=tc.input_data,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=timeout_sec + 1.0,
                        text=True,
                        errors="replace"
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    total_elapsed_ms += elapsed_ms

                    actual_out = proc.stdout.strip()
                    expected_out = tc.expected_output.strip()

                    if proc.returncode != 0:
                        overall_status = ExecutionStatus.RUNTIME_ERROR
                        test_results.append(SingleTestResult(
                            test_index=idx,
                            passed=False,
                            is_hidden=tc.is_hidden,
                            input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                            expected_display="[Hidden]" if tc.is_hidden else expected_out,
                            actual_output=actual_out,
                            error=proc.stderr.strip() or f"Container exited with code {proc.returncode}",
                            time_ms=elapsed_ms
                        ))
                    elif actual_out == expected_out:
                        passed_tests += 1
                        test_results.append(SingleTestResult(
                            test_index=idx,
                            passed=True,
                            is_hidden=tc.is_hidden,
                            input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                            expected_display="[Hidden]" if tc.is_hidden else expected_out,
                            actual_output=actual_out,
                            time_ms=elapsed_ms
                        ))
                    else:
                        if overall_status == ExecutionStatus.PASSED:
                            overall_status = ExecutionStatus.FAILED
                        test_results.append(SingleTestResult(
                            test_index=idx,
                            passed=False,
                            is_hidden=tc.is_hidden,
                            input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                            expected_display="[Hidden]" if tc.is_hidden else expected_out,
                            actual_output=actual_out,
                            time_ms=elapsed_ms
                        ))

                except subprocess.TimeoutExpired:
                    overall_status = ExecutionStatus.TIME_LIMIT_EXCEEDED
                    test_results.append(SingleTestResult(
                        test_index=idx,
                        passed=False,
                        is_hidden=tc.is_hidden,
                        input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                        expected_display="[Hidden]" if tc.is_hidden else expected_out,
                        error=f"Timeout after {timeout_sec}s",
                        time_ms=round(timeout_sec * 1000, 2)
                    ))
                    break

            return ExecutionResult(
                job_id=job.id,
                status=overall_status,
                execution_time_ms=total_elapsed_ms,
                total_tests=total_tests,
                passed_tests=passed_tests,
                test_results=test_results,
                executor_type="docker"
            )

        except Exception as e:
            logger.error(f"Docker execution exception: {e}")
            return ExecutionResult(
                job_id=job.id,
                status=ExecutionStatus.SANDBOX_ERROR,
                error_message=f"Sandbox internal error: {str(e)}",
                executor_type="docker"
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
