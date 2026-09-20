"""
Resume & ATS Analysis API Endpoints
AI Career Preparation Agent
"""

from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..schemas.resume import (
    ResumeAnalysisResponse,
    ResumeHistoryResponse
)
from ..services.resume_extractor import ResumeExtractionError
from ..services.resume_analysis_service import resume_analysis_service

router = APIRouter(prefix="/resume", tags=["Resume & ATS Analysis"])


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    rawText: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    targetRole: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    jobDescription: Optional[str] = Form(None),
    user_id: Optional[str] = Form("user-001"),
    userId: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Analyzes uploaded PDF/DOCX resume file or text against target career role.
    Computes explainable ATS-style score, extracts canonical skills, identifies
    core vs optional missing skills, persists to SQLite, and updates Skill Gap & Recommendations.
    """
    effective_user_id = userId or user_id or "user-001"
    effective_role = targetRole or target_role or "Machine Learning Engineer"
    effective_job_desc = jobDescription or job_description

    file_bytes = b""
    filename = "pasted_resume.txt"

    if file:
        filename = file.filename or "uploaded_resume.pdf"
        try:
            file_bytes = await file.read()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(exc)}")
    elif rawText:
        text_content = rawText.strip()
        if not text_content:
            raise HTTPException(status_code=400, detail="The provided resume text is empty.")
        file_bytes = text_content.encode("utf-8")
        filename = "pasted_resume.txt"
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF or DOCX file, or provide resume text.")

    try:
        result = resume_analysis_service.analyze_resume_document(
            file_bytes=file_bytes,
            filename=filename,
            target_role=effective_role,
            job_description=effective_job_desc,
            user_id=effective_user_id,
            db=db
        )
        return result
    except ResumeExtractionError as ext_err:
        raise HTTPException(status_code=400, detail=ext_err.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(exc)}")


@router.get("/latest", response_model=ResumeAnalysisResponse)
@router.get("/latest/{user_id}", response_model=ResumeAnalysisResponse)
def get_latest_resume(
    user_id: str = "user-001",
    db: Session = Depends(get_db)
):
    """Retrieves the candidate's latest saved ATS resume analysis."""
    analysis = resume_analysis_service.get_latest_analysis(db=db, user_id=user_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="No resume analysis found for this candidate.")
    return analysis


@router.get("/history", response_model=ResumeHistoryResponse)
@router.get("/history/{user_id}", response_model=ResumeHistoryResponse)
def get_resume_history(
    user_id: str = "user-001",
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Retrieves chronological resume analysis history for candidate."""
    return resume_analysis_service.get_analysis_history(db=db, user_id=user_id, limit=limit)


@router.get("/{analysis_id}", response_model=ResumeAnalysisResponse)
def get_resume_analysis_by_id(
    analysis_id: str,
    user_id: Optional[str] = Query(None, description="Optional user ID for ownership validation"),
    db: Session = Depends(get_db)
):
    """Retrieves a specific resume analysis record."""
    analysis = resume_analysis_service.get_analysis_by_id(db=db, analysis_id=analysis_id, user_id=user_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Resume analysis record not found.")
    return analysis


# Backwards compatibility alias for prototype /parse endpoint
@router.post("/parse")
async def parse_resume_legacy(
    file: Optional[UploadFile] = File(None),
    rawText: Optional[str] = Form(None),
    targetRole: Optional[str] = Form("Machine Learning Engineer"),
    db: Session = Depends(get_db)
):
    """Legacy compatibility endpoint pointing to genuine analysis service."""
    res = await analyze_resume(
        file=file,
        rawText=rawText,
        targetRole=targetRole,
        user_id="user-001",
        db=db
    )
    return {
        "status": "success",
        "data": res
    }
