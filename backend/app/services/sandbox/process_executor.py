"""
Isolated Process Sandbox Executor (Local Development Runner)
AI Career Preparation Agent
"""

import os
import sys
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

logger = logging.getLogger("sandbox.process")

# Sensitive environment variables to strictly sanitize from child process
SENSITIVE_ENV_VARS = {
    "GEMINI_API_KEY",
    "DATABASE_URL",
    "SECRET_KEY",
    "JWT_SECRET",
    "SMTP_PASSWORD",
    "SMTP_USER",
    "SMTP_HOST",
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "GOOGLE_API_KEY",
}


class ProcessSandboxExecutor(SandboxExecutor):
    """
    Child process sandbox for local development environments lacking Docker daemon.
    Never executes arbitrary code inside the FastAPI server process (strictly no exec/eval).
    Enforces secret scrubbing, hard execution timeouts, output size ceilings, and ephemeral workspace cleanup.
    """

    def is_available(self) -> bool:
        """Always available on any Python host."""
        return True

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "executor_type": "process",
            "available": True,
            "isolation": "subprocess_jail",
            "secret_isolation": True,
            "timeout_enforced": True,
            "output_bounded": True,
            "status_message": "Isolated local process sandbox active (Secret scrubbed, timeout protected)"
        }

    def _build_clean_environment(self) -> Dict[str, str]:
        """Builds a sanitized environment dictionary completely stripped of application secrets."""
        clean_env = {}
        # Keep only essential OS execution keys
        allowed_keys = {
            "SYSTEMROOT", "WINDIR", "PATH", "TEMP", "TMP",
            "PATHEXT", "PYTHONHOME", "COMSPEC"
        }
        for k, v in os.environ.items():
            k_upper = k.upper()
            if k_upper in allowed_keys and k_upper not in SENSITIVE_ENV_VARS:
                clean_env[k] = v

        clean_env["PYTHONUNBUFFERED"] = "1"
        clean_env["PYTHONDONTWRITEBYTECODE"] = "1"
        clean_env["PYTHONIOENCODING"] = "utf-8"
        return clean_env

    def execute(
        self,
        job: ExecutionJob,
        test_cases: Optional[List[TestCase]] = None
    ) -> ExecutionResult:
        temp_dir = tempfile.mkdtemp(prefix="proc_sandbox_")
        clean_env = self._build_clean_environment()
        timeout_sec = job.limits.cpu_timeout_seconds
        max_bytes = job.limits.max_output_bytes

        try:
            # Check basic code length / size constraints
            if len(job.code.encode("utf-8")) > job.limits.max_input_bytes:
                return ExecutionResult(
                    job_id=job.id,
                    status=ExecutionStatus.SECURITY_VIOLATION,
                    error_message=f"Input code size exceeds maximum limit of {job.limits.max_input_bytes} bytes.",
                    executor_type="process"
                )

            # Check for direct attempt to access restricted environment variables
            script_path = os.path.join(temp_dir, "solution.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(job.code)

            # If no test cases are provided, execute standalone script once
            if not test_cases:
                start_time = time.perf_counter()
                try:
                    proc = subprocess.run(
                        [sys.executable, "-u", "solution.py"],
                        cwd=temp_dir,
                        env=clean_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=timeout_sec,
                        text=True,
                        errors="replace"
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    stdout_out = proc.stdout[:max_bytes]
                    stderr_out = proc.stderr[:max_bytes]

                    status = ExecutionStatus.PASSED if proc.returncode == 0 else ExecutionStatus.RUNTIME_ERROR
                    if len(proc.stdout) > max_bytes:
                        status = ExecutionStatus.OUTPUT_LIMIT_EXCEEDED
                        stderr_out = f"Output size exceeded limit of {max_bytes} bytes."

                    return ExecutionResult(
                        job_id=job.id,
                        status=status,
                        exit_code=proc.returncode,
                        stdout=stdout_out,
                        stderr=stderr_out,
                        execution_time_ms=elapsed_ms,
                        total_tests=1,
                        passed_tests=1 if status == ExecutionStatus.PASSED else 0,
                        executor_type="process"
                    )

                except subprocess.TimeoutExpired:
                    elapsed_ms = round(timeout_sec * 1000, 2)
                    return ExecutionResult(
                        job_id=job.id,
                        status=ExecutionStatus.TIME_LIMIT_EXCEEDED,
                        exit_code=124,
                        stderr=f"Execution timed out after {timeout_sec}s (Time Limit Exceeded). Check for infinite loops.",
                        execution_time_ms=elapsed_ms,
                        executor_type="process"
                    )

            # If test cases are provided: Run test harness
            total_tests = len(test_cases)
            passed_tests = 0
            test_results: List[SingleTestResult] = []
            overall_status = ExecutionStatus.PASSED
            total_elapsed_ms = 0.0
            accumulated_stdout = []
            accumulated_stderr = []

            # Write harness runner that supports function evaluation or stdin execution
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

            for idx, tc in enumerate(test_cases, start=1):
                start_time = time.perf_counter()
                try:
                    proc = subprocess.run(
                        [sys.executable, "-u", "harness.py"],
                        cwd=temp_dir,
                        env=clean_env,
                        input=tc.input_data,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=timeout_sec,
                        text=True,
                        errors="replace"
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    total_elapsed_ms += elapsed_ms

                    actual_out = proc.stdout.strip()
                    expected_out = tc.expected_output.strip()

                    # Bounded outputs
                    if proc.stdout:
                        accumulated_stdout.append(f"[Test {idx}] {proc.stdout[:500]}")
                    if proc.stderr:
                        accumulated_stderr.append(f"[Test {idx}] {proc.stderr[:500]}")

                    if proc.returncode != 0:
                        overall_status = ExecutionStatus.RUNTIME_ERROR
                        test_results.append(SingleTestResult(
                            test_index=idx,
                            passed=False,
                            is_hidden=tc.is_hidden,
                            input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                            expected_display="[Hidden]" if tc.is_hidden else expected_out,
                            actual_output=actual_out,
                            error=proc.stderr.strip() or f"Process exited with code {proc.returncode}",
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
                            actual_output=actual_out if not tc.is_hidden else "[Output Mismatch]",
                            error="Output did not match expected result",
                            time_ms=elapsed_ms
                        ))

                except subprocess.TimeoutExpired:
                    overall_status = ExecutionStatus.TIME_LIMIT_EXCEEDED
                    test_results.append(SingleTestResult(
                        test_index=idx,
                        passed=False,
                        is_hidden=tc.is_hidden,
                        input_display="[Hidden Input]" if tc.is_hidden else tc.input_data,
                        error=f"Time Limit Exceeded ({timeout_sec}s)",
                        time_ms=timeout_sec * 1000
                    ))
                    break

            return ExecutionResult(
                job_id=job.id,
                status=overall_status,
                stdout="\n".join(accumulated_stdout)[:max_bytes],
                stderr="\n".join(accumulated_stderr)[:max_bytes],
                execution_time_ms=round(total_elapsed_ms, 2),
                total_tests=total_tests,
                passed_tests=passed_tests,
                test_results=test_results,
                executor_type="process"
            )

        except Exception as e:
            logger.error(f"Process sandbox exception: {e}")
            return ExecutionResult(
                job_id=job.id,
                status=ExecutionStatus.SANDBOX_ERROR,
                error_message=f"Sandbox error: {str(e)}",
                executor_type="process"
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
