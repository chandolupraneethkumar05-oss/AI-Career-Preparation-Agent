"""
Mock Interview Routes
AI Career Preparation Agent
"""

import os
import json
import logging
import uuid
import re
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Interview, InterviewRecording, User, utc_now
from ..deps import get_current_user, get_optional_current_user, verify_user_ownership
from ...core.security import create_stream_ticket, verify_stream_ticket, verify_consumed_ticket_for_range
from ...schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewDetailResponse,
    InterviewListResponse,
    InterviewStartRequest,
    InterviewSessionResponse,
    InterviewQuestionResponse,
    SubmitAnswerRequest,
    AnswerEvaluationResponse,
    AnswerSubmissionResponse,
    FinalInterviewReportResponse,
    QuickAnswerRequest,
    QuickAnswerResponse,
    RecordingMetadataCreate,
    RecordingMetadataResponse,
    CommunicationMetricsResponse,
    RecordingSegmentItem,
    TranscribeAudioResponse,
)
from ...services.interview_service import (
    save_interview,
    get_user_interviews,
    get_interview_detail
)
from ...services.interview_engine import default_interview_engine
from ...services.recording_storage_service import default_recording_storage, RecordingStorageError
from ...services.communication_analysis_service import default_communication_service
from ...services.skill_service import record_skill_evidence, sync_unified_skill_profile
from ...services.transcription_service import default_transcription_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])


# =========================================================================
# Generative AI Multi-Turn Interview Engine Endpoints
# =========================================================================

@router.post("/start", response_model=InterviewSessionResponse)
def start_interview_session(
    request: InterviewStartRequest,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initializes a dynamic, multi-turn AI mock interview session.
    Retrieves syllabus knowledge chunks from the RAG knowledge base
    conditioned on user profile and generates personalized question #1.
    """
    try:
        effective_user_id = verify_user_ownership(request.user_id or user_id, current_user)
        return default_interview_engine.start_session(db=db, user_id=effective_user_id, request=request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{session_id}/current-question", response_model=InterviewSessionResponse)
def get_current_question(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the currently active question for an ongoing session.
    Guarantees candidate tenant isolation.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return default_interview_engine.get_current_question(db=db, user_id=effective_user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/answer", response_model=AnswerSubmissionResponse)
def submit_answer(
    session_id: str,
    answer_in: SubmitAnswerRequest,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate's answer across 5 axes (Technical Accuracy, Relevance,
    Communication Quality, Completeness, Confidence Indicators).
    Dynamically generates the next question or completes the interview.
    """
    effective_user_id = verify_user_ownership(answer_in.user_id or user_id, current_user)
    try:
        return default_interview_engine.submit_answer(
            db=db,
            user_id=effective_user_id,
            session_id=session_id,
            request=answer_in
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/complete", response_model=FinalInterviewReportResponse)
def complete_interview_session(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Concludes an interview session, calculates aggregate hiring rubrics,
    synchronizes Skill Gaps, logs verified +100 XP activity, and recommends Next-Best-Action.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return default_interview_engine.complete_session(db=db, user_id=effective_user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/detail")
def get_interview_transcript(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns complete multi-turn interview transcript, per-turn answers, and 5-axis evaluations.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    try:
        return default_interview_engine.get_session_detail(db=db, user_id=effective_user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-answer", response_model=QuickAnswerResponse)
def generate_quick_answer(
    request: QuickAnswerRequest,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized, question-aware quick answer for candidate preview/editing.
    Does NOT submit an answer, update scores, or advance the interview session.
    """
    try:
        effective_user_id = verify_user_ownership(request.user_id or user_id, current_user)
        return default_interview_engine.generate_quick_answer(
            db=db,
            user_id=effective_user_id,
            request=request
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Quick-answer generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe-audio", response_model=TranscribeAudioResponse)
async def transcribe_audio_payload(
    file: UploadFile = File(..., description="Binary audio payload (WebM, WAV, OGG, MP4)"),
    language: Optional[str] = Form("en", description="Target speech language code (e.g. en, es, hi, te)"),
    transcript_hint: Optional[str] = Form(None, description="Optional client-side transcript hint"),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests candidate verbal audio recording and executes speech-to-text transcription
    using the faster-whisper neural ASR engine. Filters background noise with VAD
    and extracts structured transcript tokens for interview answer evaluation.
    """
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
        if len(audio_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Uploaded audio file exceeds maximum allowed size (25 MB).")

        result = default_transcription_service.transcribe_bytes(
            audio_bytes=audio_bytes,
            filename_hint=file.filename or "audio.webm",
            language=language,
            transcript_hint=transcript_hint
        )
        return TranscribeAudioResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Audio transcription failed")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")



@router.get("", response_model=InterviewListResponse)
def list_interviews(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all past mock interview sessions for the candidate."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    interviews = get_user_interviews(db, user_id=effective_user_id, limit=limit)
    total_count = len(interviews)
    avg_score = round(sum(i.overall_score for i in interviews) / total_count, 1) if total_count > 0 else 0.0

    items = [
        InterviewResponse(
            id=i.id,
            user_id=i.user_id,
            role=i.role,
            interview_type=i.interview_type,
            difficulty=i.difficulty,
            overall_score=i.overall_score,
            passed=i.passed,
            questions_count=i.questions_count,
            feedback_summary=i.feedback_summary,
            rubric_scores=i.rubric_scores,
            created_at=i.created_at
        )
        for i in interviews
    ]

    return InterviewListResponse(
        interviews=items,
        total_count=total_count,
        average_score=avg_score
    )


@router.post("", response_model=InterviewResponse)
def create_interview(
    interview_in: InterviewCreate,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a completed mock interview session, awards +100 XP,
    and updates candidate skill gap models.
    """
    effective_user_id = verify_user_ownership(interview_in.user_id or user_id, current_user)
    interview = save_interview(db, user_id=effective_user_id, data=interview_in)
    return InterviewResponse(
        id=interview.id,
        user_id=interview.user_id,
        role=interview.role,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        overall_score=interview.overall_score,
        passed=interview.passed,
        questions_count=interview.questions_count,
        feedback_summary=interview.feedback_summary,
        rubric_scores=interview.rubric_scores,
        created_at=interview.created_at
    )


@router.get("/compare/sessions")
def compare_interview_sessions(
    base_id: str = Query(..., description="Base interview ID (older round)"),
    target_id: str = Query(..., description="Target interview ID (newer round)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compares two mock interview sessions for the candidate, computing
    score progression, rubric dimension deltas, and competency trends.
    """
    base = db.query(Interview).filter(Interview.id == base_id, Interview.user_id == current_user.id).first()
    target = db.query(Interview).filter(Interview.id == target_id, Interview.user_id == current_user.id).first()

    if not base or not target:
        raise HTTPException(status_code=404, detail="One or both interview sessions not found or unauthorized")

    base_rubrics = base.rubric_scores or {}
    target_rubrics = target.rubric_scores or {}

    rubric_deltas = {}
    for dim in ["technicalKnowledge", "communicationSTAR", "problemSolving", "systemDesign", "confidenceDelivery"]:
        b_val = base_rubrics.get(dim, base.overall_score)
        t_val = target_rubrics.get(dim, target.overall_score)
        rubric_deltas[dim] = {
            "base": b_val,
            "target": t_val,
            "delta": t_val - b_val
        }

    score_delta = target.overall_score - base.overall_score
    if score_delta > 0:
        verdict = f"Readiness improved by +{score_delta} points across rounds."
    elif score_delta < 0:
        verdict = f"Readiness decreased by {score_delta} points. Revisit weak technical dimensions."
    else:
        verdict = "Score remained steady across rounds."

    return {
        "success": True,
        "base_session": {
            "id": base.id,
            "role": base.role,
            "difficulty": base.difficulty,
            "overall_score": base.overall_score,
            "passed": base.passed,
            "created_at": base.started_at.isoformat() if base.started_at else None
        },
        "target_session": {
            "id": target.id,
            "role": target.role,
            "difficulty": target.difficulty,
            "overall_score": target.overall_score,
            "passed": target.passed,
            "created_at": target.started_at.isoformat() if target.started_at else None
        },
        "overall_score_delta": score_delta,
        "rubric_deltas": rubric_deltas,
        "verdict": verdict
    }


@router.get("/{session_id}/export")
def export_interview_report(
    session_id: str,
    format: str = Query("json", description="Export format: json or html"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates an exportable performance report for a completed mock interview session.
    Suitable for PDF printing or external archival.
    """
    interview = db.query(Interview).filter(Interview.id == session_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found or unauthorized")

    rubrics = interview.rubric_scores or {}
    report_data = {
        "candidate_name": current_user.name,
        "candidate_email": current_user.email,
        "session_id": interview.id,
        "role": interview.role,
        "difficulty": interview.difficulty,
        "overall_score": interview.overall_score,
        "passed": interview.passed,
        "date": interview.started_at.strftime("%Y-%m-%d %H:%M UTC") if interview.started_at else "N/A",
        "feedback_summary": interview.feedback_summary,
        "rubrics": rubrics,
        "questions_count": interview.questions_count,
        "status": interview.status
    }

    if format.lower() == "html":
        from fastapi.responses import HTMLResponse
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Performance Report - {interview.role}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }}
        .header {{ border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 25px; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; background: #ecfdf5; color: #047857; }}
        .score {{ font-size: 36px; font-weight: 800; color: #059669; margin: 10px 0; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }}
        .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }}
        .card h4 {{ margin: 0 0 5px 0; font-size: 13px; color: #64748b; }}
        .card p {{ margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; }}
        .summary {{ background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Interview Performance Audit</h1>
        <p>Candidate: <strong>{current_user.name}</strong> ({current_user.email}) | Date: {report_data['date']}</p>
        <p>Target Role: <strong>{interview.role}</strong> ({interview.difficulty})</p>
    </div>
    <div class="score">Score: {interview.overall_score}/100 <span class="badge">{'PASSED' if interview.passed else 'NEEDS WORK'}</span></div>
    <h3>Rubric Dimensions</h3>
    <div class="grid">
        <div class="card"><h4>Technical Knowledge</h4><p>{rubrics.get('technicalKnowledge', interview.overall_score)}/100</p></div>
        <div class="card"><h4>STAR Communication</h4><p>{rubrics.get('communicationSTAR', interview.overall_score)}/100</p></div>
        <div class="card"><h4>Problem Solving</h4><p>{rubrics.get('problemSolving', interview.overall_score)}/100</p></div>
        <div class="card"><h4>System Design</h4><p>{rubrics.get('systemDesign', interview.overall_score)}/100</p></div>
        <div class="card"><h4>Confidence & Delivery</h4><p>{rubrics.get('confidenceDelivery', interview.overall_score)}/100</p></div>
    </div>
    <div class="summary">
        <h3>Executive Assessment</h3>
        <p>{interview.feedback_summary or 'Session completed successfully.'}</p>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_content)

    return {"success": True, "report": report_data}


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview(
    interview_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves comprehensive interview question answers and AI evaluation."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    interview = get_interview_detail(db, user_id=effective_user_id, interview_id=interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")

    answers_data = []
    try:
        answers_data = json.loads(interview.answers_json) if interview.answers_json else []
    except Exception:
        pass

    return InterviewDetailResponse(
        id=interview.id,
        user_id=interview.user_id,
        role=interview.role,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        overall_score=interview.overall_score,
        passed=interview.passed,
        questions_count=interview.questions_count,
        feedback_summary=interview.feedback_summary,
        rubric_scores=interview.rubric_scores,
        created_at=interview.created_at,
        answers=answers_data
    )


# =========================================================================
# Phase 15: Video Interview Recording & Communication Analysis Endpoints
# =========================================================================

def _detect_and_validate_media_format(chunk: bytes, client_content_type: Optional[str] = None, fallback_mime: str = "video/webm") -> str:
    """
    Inspects binary magic bytes to safely validate uploaded audio/video formats.
    Does not rely solely on client-supplied headers or filename extensions.
    Supported formats: WebM, MP4, WAV, OGG, MP3.
    """
    if len(chunk) >= 4 and chunk[:4] == b"\x1a\x45\xdf\xa3":
        if client_content_type and "audio" in client_content_type.lower():
            return "audio/webm"
        return "video/webm"

    if len(chunk) >= 8 and (chunk[4:8] in (b"ftyp", b"moov") or chunk[:4] in (b"\x00\x00\x00\x18", b"\x00\x00\x00\x20")):
        return "video/mp4"

    if len(chunk) >= 12 and chunk[:4] == b"RIFF" and chunk[8:12] == b"WAVE":
        return "audio/wav"

    if len(chunk) >= 4 and chunk[:4] == b"OggS":
        return "audio/ogg"

    if len(chunk) >= 3 and (chunk[:3] == b"ID3" or chunk[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
        return "audio/mpeg"

    raise HTTPException(
        status_code=415,
        detail="Unsupported or invalid media format. Allowed formats: WebM, MP4, WAV, OGG, MP3."
    )


@router.post("/{session_id}/recording", response_model=RecordingMetadataResponse)
async def save_interview_recording(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    recording_mode: str = Form("video"),
    duration_seconds: float = Form(0.0),
    mime_type: str = Form("video/webm"),
    segments_json: Optional[str] = Form("[]"),
    communication_metrics_json: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves metadata and optional binary media for a recorded mock interview session.
    Calculates communication metrics, saves to user-scoped storage,
    records Communication & Delivery skill evidence, and updates Unified Skill Profile.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    interview = (
        db.query(Interview)
        .filter(Interview.id == session_id, Interview.user_id == effective_user_id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview session {session_id} not found for this candidate.")

    # Parse segments
    parsed_segments = []
    try:
        if segments_json:
            parsed_segments = json.loads(segments_json)
    except Exception:
        parsed_segments = []

    # Parse or compute communication metrics
    parsed_metrics = {}
    if communication_metrics_json:
        try:
            parsed_metrics = json.loads(communication_metrics_json)
        except Exception:
            parsed_metrics = {}

    if not parsed_metrics and parsed_segments:
        # Compute communication metrics from segments
        segment_results = []
        for seg in parsed_segments:
            seg_metrics = default_communication_service.analyze_answer(
                transcript=seg.get("transcript", ""),
                duration_seconds=seg.get("duration", 0.0),
                is_behavioral=(interview.interview_type or "").lower() == "behavioral"
            )
            segment_results.append(seg_metrics)
        parsed_metrics = default_communication_service.aggregate_session_metrics(segment_results)
    elif not parsed_metrics:
        # Default baseline metrics
        parsed_metrics = default_communication_service.aggregate_session_metrics([])

    storage_path = None
    file_size_bytes = 0
    final_target = None

    if file and file.filename:
        # Configurable maximum recording file size (default 100MB)
        max_size = int(os.getenv("MAX_RECORDING_SIZE_BYTES", str(100 * 1024 * 1024)))
        chunk_size = 1024 * 64
        total_read = 0
        temp_path = None
        try:
            session_dir = default_recording_storage._get_session_dir(effective_user_id, session_id)
            temp_path = session_dir / f"upload_{uuid.uuid4().hex[:8]}.tmp"
            first_chunk = True
            clean_mime = None

            with open(temp_path, "wb") as f_out:
                while True:
                    chunk = await file.read(chunk_size)
                    if not chunk:
                        break
                    total_read += len(chunk)
                    if total_read > max_size:
                        raise HTTPException(
                            status_code=413,
                            detail=f"Uploaded recording exceeds maximum allowable size limit of {max_size // (1024 * 1024)}MB."
                        )
                    if first_chunk:
                        clean_mime = _detect_and_validate_media_format(chunk, file.content_type, mime_type)
                        first_chunk = False
                    f_out.write(chunk)

            if total_read == 0:
                raise HTTPException(status_code=400, detail="The uploaded recording file is empty.")

            ext = default_recording_storage.ALLOWED_MIME_TYPES.get(clean_mime, ".webm")
            final_target = session_dir / f"recording{ext}"
            if temp_path.exists():
                temp_path.replace(final_target)

            storage_path = str(final_target.relative_to(default_recording_storage.base_dir))
            file_size_bytes = total_read
            mime_type = clean_mime
        except HTTPException:
            if temp_path and temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            raise
        except Exception as e:
            if temp_path and temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.exception("Failed to persist recording media")
            raise HTTPException(status_code=500, detail="Failed to persist recording media.")

    # Check for existing recording to update or create
    existing_rec = (
        db.query(InterviewRecording)
        .filter(InterviewRecording.session_id == session_id, InterviewRecording.user_id == effective_user_id)
        .first()
    )

    now = utc_now()
    if existing_rec:
        existing_rec.recording_mode = recording_mode
        existing_rec.duration_seconds = duration_seconds
        existing_rec.mime_type = mime_type
        if storage_path:
            existing_rec.storage_path = storage_path
            existing_rec.file_size_bytes = file_size_bytes
        existing_rec.segments_json = json.dumps(parsed_segments)
        existing_rec.communication_metrics_json = json.dumps(parsed_metrics)
        existing_rec.status = "ready"
        existing_rec.deleted_at = None
        try:
            db.commit()
            db.refresh(existing_rec)
        except Exception as db_exc:
            db.rollback()
            if final_target and final_target.exists():
                try:
                    final_target.unlink()
                except Exception:
                    pass
            logger.exception("Database commit failed for recording metadata")
            raise HTTPException(status_code=500, detail="Failed to save recording metadata to database.")
        rec = existing_rec
    else:
        rec_id = f"rec_{uuid.uuid4().hex[:12]}"
        rec = InterviewRecording(
            id=rec_id,
            user_id=effective_user_id,
            session_id=session_id,
            storage_path=storage_path,
            recording_mode=recording_mode,
            duration_seconds=duration_seconds,
            mime_type=mime_type,
            file_size_bytes=file_size_bytes,
            status="ready",
            segments_json=json.dumps(parsed_segments),
            communication_metrics_json=json.dumps(parsed_metrics),
            created_at=now
        )
        db.add(rec)
        try:
            db.commit()
            db.refresh(rec)
        except Exception as db_exc:
            db.rollback()
            if final_target and final_target.exists():
                try:
                    final_target.unlink()
                except Exception:
                    pass
            logger.exception("Database commit failed for recording metadata")
            raise HTTPException(status_code=500, detail="Failed to save recording metadata to database.")

    # Record granular Communication and Delivery skill evidence for candidate profile
    comm_score = parsed_metrics.get("clarity_score", 80)
    wpm = parsed_metrics.get("speaking_pace_wpm", 135)
    pace_score = 90 if 120 <= wpm <= 160 else (75 if 100 <= wpm <= 175 else 60)
    delivery_score = round((comm_score * 0.6) + (pace_score * 0.4))

    try:
        record_skill_evidence(
            db=db,
            user_id=effective_user_id,
            skill_name="Communication",
            source_type="interview",
            source_id=session_id,
            score=comm_score,
            evidence_text=f"Speaking pace {wpm} WPM | Fillers: {parsed_metrics.get('filler_words_count', 0)}",
            confidence="high"
        )
        record_skill_evidence(
            db=db,
            user_id=effective_user_id,
            skill_name="Delivery",
            source_type="interview",
            source_id=session_id,
            score=delivery_score,
            evidence_text=f"Clarity {comm_score}% | Pace status: {parsed_metrics.get('pace_status', 'optimal')}",
            confidence="medium"
        )
        sync_unified_skill_profile(db=db, user_id=effective_user_id, target_role=interview.role)
    except Exception as ev_err:
        pass

    stream_url = f"/api/interviews/{session_id}/recording/stream?user_id={effective_user_id}" if rec.storage_path else None

    return RecordingMetadataResponse(
        id=rec.id,
        session_id=rec.session_id,
        user_id=rec.user_id,
        recording_mode=rec.recording_mode,
        duration_seconds=rec.duration_seconds,
        mime_type=rec.mime_type,
        file_size_bytes=rec.file_size_bytes,
        status=rec.status,
        stream_url=stream_url,
        segments=rec.segments,
        communication_metrics=rec.communication_metrics,
        created_at=rec.created_at
    )


@router.get("/{session_id}/recording", response_model=RecordingMetadataResponse)
def get_interview_recording(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves recording metadata and timeline segments.
    Enforces strict user ownership: recording.user_id == user_id.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    rec = (
        db.query(InterviewRecording)
        .filter(
            InterviewRecording.session_id == session_id,
            InterviewRecording.user_id == effective_user_id,
            InterviewRecording.status != "deleted"
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="No active recording found for this session.")

    stream_url = f"/api/interviews/{session_id}/recording/stream?user_id={effective_user_id}" if rec.storage_path else None

    return RecordingMetadataResponse(
        id=rec.id,
        session_id=rec.session_id,
        user_id=rec.user_id,
        recording_mode=rec.recording_mode,
        duration_seconds=rec.duration_seconds,
        mime_type=rec.mime_type,
        file_size_bytes=rec.file_size_bytes,
        status=rec.status,
        stream_url=stream_url,
        segments=rec.segments,
        communication_metrics=rec.communication_metrics,
        created_at=rec.created_at
    )


@router.post("/{session_id}/recording/stream-ticket")
def issue_recording_stream_ticket(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Issues a short-lived (120s), single-purpose playback ticket for HTML5 media streaming.
    Prevents long-lived master bearer credentials from being leaked in URLs, browser history, or logs.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    rec = (
        db.query(InterviewRecording)
        .filter(
            InterviewRecording.session_id == session_id,
            InterviewRecording.user_id == effective_user_id,
            InterviewRecording.status != "deleted"
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Active recording not found for this session.")

    ticket = create_stream_ticket(user_id=effective_user_id, session_id=session_id, expires_in_seconds=120)
    return {
        "ticket": ticket,
        "session_id": session_id,
        "expires_in_seconds": 120,
        "stream_url": f"/api/interviews/{session_id}/recording/stream?ticket={ticket}"
    }


@router.get("/{session_id}/recording/stream")
def stream_interview_recording(
    session_id: str,
    request: Request,
    ticket: Optional[str] = Query(None, description="Short-lived streaming ticket"),
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Streams the recorded video/audio media with HTTP Range support for video seeking.
    Authenticates via either:
    1. Short-lived single-purpose stream ticket (?ticket=...)
    2. Authenticated user session via Authorization: Bearer <token> header
    """
    range_header = request.headers.get("range")
    effective_user_id = None
    if ticket:
        ticket_user_id = verify_stream_ticket(ticket, session_id=session_id, db=db)
        if not ticket_user_id and range_header:
            # Allow active playback session range requests (seeking/scrubbing) using previously consumed ticket
            ticket_user_id = verify_consumed_ticket_for_range(ticket, session_id=session_id, db=db)
        if not ticket_user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired media playback ticket. Please request a new playback ticket."
            )
        effective_user_id = ticket_user_id
    elif current_user:
        effective_user_id = verify_user_ownership(user_id, current_user)
    else:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid streaming ticket or authorization credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    rec = (
        db.query(InterviewRecording)
        .filter(
            InterviewRecording.session_id == session_id,
            InterviewRecording.user_id == effective_user_id,
            InterviewRecording.status != "deleted"
        )
        .first()
    )
    if not rec or not rec.storage_path:
        raise HTTPException(status_code=404, detail="Recording media not found for streaming.")

    path = default_recording_storage.get_recording_path(user_id=effective_user_id, session_id=session_id)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Media file on disk was not found.")

    total_size = path.stat().st_size
    range_header = request.headers.get("range")

    start_byte = 0
    end_byte = total_size - 1

    if range_header:
        # e.g., bytes=0-1024
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start_byte = int(match.group(1))
            if match.group(2):
                end_byte = int(match.group(2))

    try:
        generator, s_byte, e_byte, f_size, m_type = default_recording_storage.get_stream(
            user_id=effective_user_id,
            session_id=session_id,
            start_byte=start_byte,
            end_byte=end_byte
        )
    except RecordingStorageError as e:
        raise HTTPException(status_code=404, detail=str(e))

    content_length = (e_byte - s_byte) + 1
    headers = {
        "Content-Range": f"bytes {s_byte}-{e_byte}/{f_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": m_type
    }

    status_code = 206 if range_header else 200
    return StreamingResponse(generator, status_code=status_code, headers=headers)


@router.delete("/{session_id}/recording")
def delete_interview_recording(
    session_id: str,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes the interview recording file and metadata.
    Preserves interview evaluation scores, rubrics, and skill history.
    Enforces user ownership.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    rec = (
        db.query(InterviewRecording)
        .filter(InterviewRecording.session_id == session_id, InterviewRecording.user_id == effective_user_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found or already deleted.")

    # Soft delete in database first to guarantee database transaction consistency
    rec.status = "deleted"
    rec.storage_path = None
    rec.deleted_at = utc_now()
    try:
        db.commit()
    except Exception as db_err:
        db.rollback()
        logger.exception(f"Database commit failed during recording deletion for session {session_id}")
        raise HTTPException(status_code=500, detail="Failed to delete recording record.")

    # Remove media files from user storage after database state is safely committed
    try:
        default_recording_storage.delete_recording(user_id=effective_user_id, session_id=session_id)
    except Exception as storage_err:
        logger.warning(f"Storage cleanup warning for session {session_id}: {storage_err}")

    return {
        "status": "deleted",
        "session_id": session_id,
        "message": "Recording successfully deleted. Interview feedback and skill history have been preserved."
    }


@router.post("/{session_id}/communication-analysis", response_model=CommunicationMetricsResponse)
def analyze_session_communication(
    session_id: str,
    payload: Dict[str, Any],
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Runs communication and verbal delivery analysis on transcripts.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    interview = (
        db.query(Interview)
        .filter(Interview.id == session_id, Interview.user_id == effective_user_id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview session {session_id} not found.")

    transcript = payload.get("transcript", "")
    duration = float(payload.get("duration", 0.0))
    is_behavioral = bool(payload.get("is_behavioral", False))

    metrics = default_communication_service.analyze_answer(
        transcript=transcript,
        duration_seconds=duration,
        is_behavioral=is_behavioral
    )
    return CommunicationMetricsResponse(**metrics)
