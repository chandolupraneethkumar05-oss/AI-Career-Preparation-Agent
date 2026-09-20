from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ...db.database import get_db, Session
from ...services.ai.voice.realtime_voice_service import (
    default_realtime_voice_service,
    VoiceSessionResponse,
    VoiceTurn
)

router = APIRouter()

class CreateVoiceSessionRequest(BaseModel):
    role: Optional[str] = "Machine Learning Engineer"
    difficulty: Optional[str] = "Intermediate"
    topic: Optional[str] = "System Design & Algorithms"
    interview_id: Optional[str] = None
    voice_name: Optional[str] = "Puck"

class AppendTurnRequest(BaseModel):
    session_id: str
    speaker: str
    text: str

class TranscriptResponse(BaseModel):
    session_id: str
    turns: List[VoiceTurn]


@router.post("/session", response_model=VoiceSessionResponse)
async def create_voice_session(req: CreateVoiceSessionRequest):
    try:
        session = await default_realtime_voice_service.create_session(
            role=req.role or "Machine Learning Engineer",
            difficulty=req.difficulty or "Intermediate",
            topic=req.topic or "System Design & Algorithms",
            interview_id=req.interview_id,
            voice_name=req.voice_name or "Puck"
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize voice session: {str(e)}")


@router.post("/transcript")
async def append_transcript_turn(req: AppendTurnRequest):
    default_realtime_voice_service.append_transcript_turn(
        session_id=req.session_id,
        speaker=req.speaker,
        text=req.text
    )
    return {"status": "recorded", "session_id": req.session_id}


@router.get("/transcript/{session_id}", response_model=TranscriptResponse)
async def get_transcript(session_id: str):
    turns = default_realtime_voice_service.get_transcript(session_id)
    return TranscriptResponse(session_id=session_id, turns=turns)
