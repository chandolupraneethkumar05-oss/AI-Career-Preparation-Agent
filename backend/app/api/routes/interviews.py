"""
Mock Interview Routes
AI Career Preparation Agent
"""

import json
import uuid
import re
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Interview, InterviewRecording, utc_now
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

router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])


# =========================================================================
# Generative AI Multi-Turn Interview Engine Endpoints
# =========================================================================

@router.post("/start", response_model=InterviewSessionResponse)
def start_interview_session(
    request: InterviewStartRequest,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Initializes a dynamic, multi-turn AI mock interview session.
    Retrieves syllabus knowledge chunks from the RAG knowledge base
    conditioned on user profile and generates personalized question #1.
    """
    try:
        effective_user_id = request.user_id or user_id
        return default_interview_engine.start_session(db=db, user_id=effective_user_id, request=request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{session_id}/current-question", response_model=InterviewSessionResponse)
def get_current_question(
    session_id: str,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves the currently active question for an ongoing session.
    Guarantees candidate tenant isolation.
    """
    try:
        return default_interview_engine.get_current_question(db=db, user_id=user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/answer", response_model=AnswerSubmissionResponse)
def submit_answer(
    session_id: str,
    answer_in: SubmitAnswerRequest,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate's answer across 5 axes (Technical Accuracy, Relevance,
    Communication Quality, Completeness, Confidence Indicators).
    Dynamically generates the next question or completes the interview.
    """
    try:
        effective_user_id = answer_in.user_id or user_id
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
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Concludes an interview session, calculates aggregate hiring rubrics,
    synchronizes Skill Gaps, logs verified +100 XP activity, and recommends Next-Best-Action.
    """
    try:
        return default_interview_engine.complete_session(db=db, user_id=user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/detail")
def get_interview_transcript(
    session_id: str,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Returns complete multi-turn interview transcript, per-turn answers, and 5-axis evaluations.
    """
    try:
        return default_interview_engine.get_session_detail(db=db, user_id=user_id, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-answer", response_model=QuickAnswerResponse)
def generate_quick_answer(
    request: QuickAnswerRequest,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized, question-aware quick answer for candidate preview/editing.
    Does NOT submit an answer, update scores, or advance the interview session.
    """
    try:
        effective_user_id = request.user_id or user_id
        return default_interview_engine.generate_quick_answer(
            db=db,
            user_id=effective_user_id,
            request=request
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=InterviewListResponse)
def list_interviews(
    user_id: str = Query("user-001", description="Candidate User ID"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves all past mock interview sessions for the candidate."""
    interviews = get_user_interviews(db, user_id=user_id, limit=limit)
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
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Saves a completed mock interview session, awards +100 XP,
    and updates candidate skill gap models.
    """
    interview = save_interview(db, user_id=user_id, data=interview_in)
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


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview(
    interview_id: str,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Retrieves comprehensive interview question answers and AI evaluation."""
    interview = get_interview_detail(db, user_id=user_id, interview_id=interview_id)
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

@router.post("/{session_id}/recording", response_model=RecordingMetadataResponse)
async def save_interview_recording(
    session_id: str,
    user_id: str = Query("user-001", description="Candidate User ID"),
    recording_mode: str = Form("video"),
    duration_seconds: float = Form(0.0),
    mime_type: str = Form("video/webm"),
    segments_json: Optional[str] = Form("[]"),
    communication_metrics_json: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Saves metadata and optional binary media for a recorded mock interview session.
    Calculates communication metrics, saves to user-scoped storage,
    records Communication & Delivery skill evidence, and updates Unified Skill Profile.
    """
    interview = (
        db.query(Interview)
        .filter(Interview.id == session_id, Interview.user_id == user_id)
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

    if file:
        try:
            file_bytes = await file.read()
            file_size_bytes = len(file_bytes)
            save_res = default_recording_storage.save_recording(
                user_id=user_id,
                session_id=session_id,
                file_bytes=file_bytes,
                mime_type=file.content_type or mime_type
            )
            storage_path = save_res["storage_path"]
            mime_type = save_res["mime_type"]
        except RecordingStorageError as rse:
            raise HTTPException(status_code=400, detail=str(rse))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to persist recording media: {str(e)}")

    # Check for existing recording to update or create
    existing_rec = (
        db.query(InterviewRecording)
        .filter(InterviewRecording.session_id == session_id, InterviewRecording.user_id == user_id)
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
        db.commit()
        db.refresh(existing_rec)
        rec = existing_rec
    else:
        rec_id = f"rec_{uuid.uuid4().hex[:12]}"
        rec = InterviewRecording(
            id=rec_id,
            user_id=user_id,
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
        db.commit()
        db.refresh(rec)

    # Record granular Communication and Delivery skill evidence for candidate profile
    comm_score = parsed_metrics.get("clarity_score", 80)
    wpm = parsed_metrics.get("speaking_pace_wpm", 135)
    pace_score = 90 if 120 <= wpm <= 160 else (75 if 100 <= wpm <= 175 else 60)
    delivery_score = round((comm_score * 0.6) + (pace_score * 0.4))

    try:
        record_skill_evidence(
            db=db,
            user_id=user_id,
            skill_name="Communication",
            source_type="interview",
            source_id=session_id,
            score=comm_score,
            evidence_text=f"Speaking pace {wpm} WPM | Fillers: {parsed_metrics.get('filler_words_count', 0)}",
            confidence="high"
        )
        record_skill_evidence(
            db=db,
            user_id=user_id,
            skill_name="Delivery",
            source_type="interview",
            source_id=session_id,
            score=delivery_score,
            evidence_text=f"Clarity {comm_score}% | Pace status: {parsed_metrics.get('pace_status', 'optimal')}",
            confidence="medium"
        )
        sync_unified_skill_profile(db=db, user_id=user_id, target_role=interview.role)
    except Exception as ev_err:
        pass

    stream_url = f"/api/interviews/{session_id}/recording/stream?user_id={user_id}" if rec.storage_path else None

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
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves recording metadata and timeline segments.
    Enforces strict user ownership: recording.user_id == user_id.
    """
    rec = (
        db.query(InterviewRecording)
        .filter(
            InterviewRecording.session_id == session_id,
            InterviewRecording.user_id == user_id,
            InterviewRecording.status != "deleted"
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="No active recording found for this session.")

    stream_url = f"/api/interviews/{session_id}/recording/stream?user_id={user_id}" if rec.storage_path else None

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


@router.get("/{session_id}/recording/stream")
def stream_interview_recording(
    session_id: str,
    request: Request,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Streams the recorded video/audio media with HTTP Range support for video seeking.
    Enforces tenant isolation: user_id must own the recording.
    """
    rec = (
        db.query(InterviewRecording)
        .filter(
            InterviewRecording.session_id == session_id,
            InterviewRecording.user_id == user_id,
            InterviewRecording.status != "deleted"
        )
        .first()
    )
    if not rec or not rec.storage_path:
        raise HTTPException(status_code=404, detail="Recording media not found for streaming.")

    path = default_recording_storage.get_recording_path(user_id=user_id, session_id=session_id)
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
            user_id=user_id,
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
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Deletes the interview recording file and metadata.
    Preserves interview evaluation scores, rubrics, and skill history.
    Enforces user ownership.
    """
    rec = (
        db.query(InterviewRecording)
        .filter(InterviewRecording.session_id == session_id, InterviewRecording.user_id == user_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found or already deleted.")

    # Remove media files from user storage
    default_recording_storage.delete_recording(user_id=user_id, session_id=session_id)

    # Soft delete in database
    rec.status = "deleted"
    rec.storage_path = None
    rec.deleted_at = utc_now()
    db.commit()

    return {
        "status": "deleted",
        "session_id": session_id,
        "message": "Recording successfully deleted. Interview feedback and skill history have been preserved."
    }


@router.post("/{session_id}/communication-analysis", response_model=CommunicationMetricsResponse)
def analyze_session_communication(
    session_id: str,
    payload: Dict[str, Any],
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """
    Runs communication and verbal delivery analysis on transcripts.
    """
    transcript = payload.get("transcript", "")
    duration = float(payload.get("duration", 0.0))
    is_behavioral = bool(payload.get("is_behavioral", False))

    metrics = default_communication_service.analyze_answer(
        transcript=transcript,
        duration_seconds=duration,
        is_behavioral=is_behavioral
    )
    return CommunicationMetricsResponse(**metrics)
