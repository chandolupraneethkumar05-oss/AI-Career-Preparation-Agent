"""
Code Execution API Routes
AI Career Preparation Agent
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ...services.sandbox import (
    default_sandbox_manager,
    ExecutionJob,
    ExecutionResult,
    ExecutionStatus,
    TestCase
)
from ...services.skill_arena_catalog import get_challenge_by_id
from ...db.models import User
from ..deps import get_current_user

router = APIRouter(prefix="/execution", tags=["Secure Code Execution"])


class ExecutionSubmitRequest(BaseModel):
    code: str = Field(..., description="Candidate source code")
    challenge_id: Optional[str] = Field(None, description="Optional Skill Arena challenge ID")
    language: str = Field("python", description="Programming language (default: python)")
    preferred_mode: Optional[str] = Field(None, description="docker | process")


@router.get("/capabilities")
def get_execution_capabilities():
    """
    Reports host sandbox availability:
    - Docker container sandbox status
    - Local isolated process sandbox status
    """
    return default_sandbox_manager.get_system_capabilities()


@router.post("/jobs", response_model=ExecutionResult)
def submit_execution_job(
    request: ExecutionSubmitRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submits untrusted candidate code for isolated execution.
    Requires authenticated user; user ID is derived strictly from authentication context.
    Code is never executed inside the FastAPI server process (strictly no exec/eval).
    Loads server-side hidden test cases if a challenge_id is provided.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Submitted code cannot be empty.")

    # Retrieve test cases from server-side challenge definition if applicable
    test_cases: Optional[List[TestCase]] = None
    if request.challenge_id:
        challenge = get_challenge_by_id(request.challenge_id)
        if challenge and "test_cases" in challenge:
            test_cases = [
                TestCase(
                    input_data=tc.get("input", ""),
                    expected_output=tc.get("expected", ""),
                    is_hidden=tc.get("is_hidden", True),
                    description=tc.get("description")
                )
                for tc in challenge["test_cases"]
            ]

    # Create and run job via sandbox manager
    job = default_sandbox_manager.create_job(
        user_id=current_user.id,
        code=request.code,
        challenge_id=request.challenge_id,
        language=request.language
    )

    result = default_sandbox_manager.run_job(
        job=job,
        test_cases=test_cases,
        preferred_mode=request.preferred_mode
    )

    return result


@router.get("/jobs/{job_id}", response_model=ExecutionResult)
def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieves status and outputs for an execution job with strict tenant ownership check."""
    job = default_sandbox_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Execution job '{job_id}' not found.")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to another candidate's execution job.")

    result = default_sandbox_manager.get_result(job_id)
    if not result:
        return ExecutionResult(
            job_id=job.id,
            status=job.status,
            executor_type="unknown"
        )

    return result
