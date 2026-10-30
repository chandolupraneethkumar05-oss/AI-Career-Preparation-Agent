"""
Peer-to-Peer Collaborative Video Chamber & Reverse Mock Interview Routes
AI Career Preparation Agent

Exposes:
- REST endpoints for room creation, status queries, and reverse interview actions.
- Real-time WebSocket signaling gateway for WebRTC Offer/Answer/ICE relay,
  shared code synchronization, and live AI Proctoring.
"""

import logging
import json
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Depends
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User, Interview
from ..deps import get_optional_current_user, get_current_user
from ...services.peer_room_service import (
    default_peer_room_service,
    default_reverse_interview_service,
    PeerRoom
)

logger = logging.getLogger("peer_room")

router = APIRouter(tags=["Peer Collaborative Interview & Reverse Mock"])


# =============================================================================
# Request & Response Schemas
# =============================================================================

class CreatePeerRoomRequest(BaseModel):
    role: str = Field(default="Software Engineer", description="Target job role")
    difficulty: str = Field(default="Intermediate", description="Beginner | Intermediate | Advanced")
    topic: Optional[str] = Field(default=None, description="Focus topic or syllabus domain")


class ReverseInterviewStartRequest(BaseModel):
    role: str = Field(default="Software Engineer", description="Target job role")
    difficulty: str = Field(default="Intermediate", description="Beginner | Intermediate | Advanced")


class ReverseInterviewAskRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, description="Interviewer question or hint to candidate")


class ReverseInterviewFinishRequest(BaseModel):
    session_id: str


# =============================================================================
# REST Endpoints
# =============================================================================

@router.post("/peer-rooms/create")
async def create_peer_room(payload: CreatePeerRoomRequest):
    """Creates a new collaborative WebRTC interview chamber."""
    try:
        room = await default_peer_room_service.create_room(
            role=payload.role,
            difficulty=payload.difficulty,
            topic=payload.topic
        )
        return {
            "success": True,
            "room_id": room.room_id,
            "role": room.role,
            "difficulty": room.difficulty,
            "topic": room.topic,
            "interviewer_url": f"/peer-room/{room.room_id}?role=interviewer",
            "candidate_url": f"/peer-room/{room.room_id}?role=candidate"
        }
    except Exception as exc:
        logger.error(f"Error creating peer room: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to create peer room: {str(exc)}")


@router.get("/peer-rooms/{room_id}")
async def get_peer_room(room_id: str):
    """Retrieves current room status, connected peers, and active questions."""
    room = default_peer_room_service.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Peer room not found")
    return {"success": True, "room": room.to_dict()}


@router.post("/peer-rooms/{room_id}/report")
async def get_or_generate_peer_report(room_id: str):
    """Generates or retrieves the joint 360° evaluation report for interviewer & candidate."""
    room = default_peer_room_service.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Peer room not found")
    
    if room.final_report:
        return {"success": True, "report": room.final_report}

    report = default_peer_room_service.generate_360_evaluation(room)
    return {"success": True, "report": report}


# =============================================================================
# Reverse Mock Interview REST Endpoints ("Be the Interviewer")
# =============================================================================

@router.post("/interviews/reverse/start")
async def start_reverse_interview(
    payload: ReverseInterviewStartRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Initializes a reverse mock interview session where user tests AI applicant Alex."""
    user_id = current_user.id if current_user else "guest_user"
    sess = default_reverse_interview_service.start_session(
        user_id=user_id,
        target_role=payload.role,
        difficulty=payload.difficulty
    )
    return {
        "success": True,
        "session": sess.to_dict(),
        "opening_turn": sess.turns[0]
    }


@router.post("/interviews/reverse/ask")
async def ask_candidate_reverse(payload: ReverseInterviewAskRequest):
    """User poses a question, probe, or hint; AI candidate Alex responds realistically."""
    res = default_reverse_interview_service.candidate_respond(
        session_id=payload.session_id,
        user_question_or_hint=payload.message
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return {"success": True, "turn": res}


@router.post("/interviews/reverse/finish")
async def finish_reverse_interview(payload: ReverseInterviewFinishRequest):
    """Concludes reverse mock session and generates an assessment of the user's interviewing skills."""
    res = default_reverse_interview_service.evaluate_interviewer(session_id=payload.session_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return {"success": True, "evaluation": res}


# =============================================================================
# Real-Time WebRTC & AI Proctor WebSocket Gateway
# =============================================================================

@router.websocket("/ws/peer-room/{room_id}")
async def peer_room_websocket(websocket: WebSocket, room_id: str):
    """
    WebSocket signaling hub for 2-person WebRTC video chamber:
    - Relays SDP Offers, SDP Answers, and ICE candidates between interviewer and candidate.
    - Synchronizes collaborative code sandbox in real time.
    - Curates AI questions and provides secret teleprompter to the interviewer.
    - Delivers live AI co-pilot suggestions as candidate answers.
    - Emits joint 360° evaluation report at session conclusion.
    """
    await websocket.accept()

    room = default_peer_room_service.get_room(room_id)
    if not room:
        # Auto-create if direct link entered
        room = await default_peer_room_service.create_room(
            role="Software Engineer",
            difficulty="Intermediate",
            topic="Collaborative Engineering Interview"
        )
        room.room_id = room_id
        default_peer_room_service._rooms[room_id] = room

    assigned_role: Optional[str] = None
    user_id: Optional[str] = None

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                continue

            msg_type = data.get("type")

            # -------------------------------------------------------------
            # 1. Join / Role Assignment
            # -------------------------------------------------------------
            if msg_type == "join":
                client_role = data.get("role", "candidate")
                user_id = data.get("userId") or f"user_{id(websocket)}"
                user_name = data.get("userName") or ("Interviewer" if client_role == "interviewer" else "Candidate")

                res = await default_peer_room_service.register_participant(
                    room_id=room_id,
                    client_role=client_role,
                    user_id=user_id,
                    user_name=user_name,
                    ws=websocket
                )

                assigned_role = res["assigned_role"]
                # Send confirmation to joining peer
                await websocket.send_json({
                    "type": "joined",
                    "role": assigned_role,
                    "userName": user_name,
                    "room": room.to_dict()
                })

                # Notify other peer that someone entered
                other_ws = _get_other_ws(room, assigned_role)
                if other_ws:
                    await other_ws.send_json({
                        "type": "peer_joined",
                        "peerRole": assigned_role,
                        "peerName": user_name,
                        "room": room.to_dict()
                    })
                    # If this was the second person to join, trigger WebRTC initiation
                    await other_ws.send_json({"type": "initiate_offer"})

            # -------------------------------------------------------------
            # 2. WebRTC Signaling (Offer, Answer, ICE Candidate)
            # -------------------------------------------------------------
            elif msg_type in ("signal_offer", "signal_answer", "signal_ice"):
                other_ws = _get_other_ws(room, assigned_role)
                if other_ws:
                    await other_ws.send_json(data)

            # -------------------------------------------------------------
            # 3. Media Controls State Relay (e.g. Mute Audio, Camera Off)
            # -------------------------------------------------------------
            elif msg_type == "media_state":
                other_ws = _get_other_ws(room, assigned_role)
                if other_ws:
                    await other_ws.send_json(data)

            # -------------------------------------------------------------
            # 4. Collaborative Code Synchronization
            # -------------------------------------------------------------
            elif msg_type == "code_sync":
                room.shared_code = data.get("code", "")
                other_ws = _get_other_ws(room, assigned_role)
                if other_ws:
                    await other_ws.send_json({
                        "type": "code_sync",
                        "code": room.shared_code
                    })

            # -------------------------------------------------------------
            # 5. AI Proctor: Request Calibrated Question (Teleprompter)
            # -------------------------------------------------------------
            elif msg_type == "request_ai_question":
                q_num = len(room.questions) + 1
                question_obj = default_peer_room_service.generate_ai_question(
                    role=room.role,
                    difficulty=room.difficulty,
                    topic=room.topic,
                    question_num=q_num
                )
                room.current_question = question_obj
                room.questions.append(question_obj)

                # Send privately to interviewer as teleprompter
                await websocket.send_json({
                    "type": "ai_question_suggested",
                    "question": question_obj
                })

            # -------------------------------------------------------------
            # 6. Push Question to Candidate Screen
            # -------------------------------------------------------------
            elif msg_type == "push_question_to_candidate":
                if room.current_question:
                    # Broadcast to both (candidate sees question prompt; interviewer sees active indicator)
                    payload = {
                        "type": "active_question",
                        "question": room.current_question.get("question"),
                        "topic": room.current_question.get("topic"),
                        "difficulty": room.current_question.get("difficulty"),
                        "id": room.current_question.get("id")
                    }
                    if room.candidate and room.candidate.get("ws"):
                        await room.candidate["ws"].send_json(payload)
                    if room.interviewer and room.interviewer.get("ws"):
                        await room.interviewer["ws"].send_json(payload)

            # -------------------------------------------------------------
            # 7. Real-Time Transcript Utterance & AI Co-Pilot Hint
            # -------------------------------------------------------------
            elif msg_type == "transcript_utterance":
                text = data.get("text", "").strip()
                speaker = assigned_role or data.get("speaker", "candidate")
                if text:
                    utterance = {
                        "speaker": speaker,
                        "text": text,
                        "timestamp": default_peer_room_service.generate_room_code()
                    }
                    room.transcript.append(utterance)

                    # Relay transcript update to other peer
                    other_ws = _get_other_ws(room, assigned_role)
                    if other_ws:
                        await other_ws.send_json({
                            "type": "transcript_update",
                            "utterance": utterance
                        })

                    # If candidate spoke and there is an active question, generate real-time AI hint for interviewer
                    if speaker == "candidate" and room.current_question and room.interviewer and room.interviewer.get("ws"):
                        # Accumulate candidate text for this question
                        cand_speech = " ".join([
                            u["text"] for u in room.transcript if u.get("speaker") == "candidate"
                        ])
                        hint = default_peer_room_service.evaluate_live_answer(
                            question=room.current_question,
                            answer_text=cand_speech
                        )
                        await room.interviewer["ws"].send_json({
                            "type": "ai_copilot_hint",
                            "hint": hint
                        })

            # -------------------------------------------------------------
            # 8. Interviewer Private Notes & Rating
            # -------------------------------------------------------------
            elif msg_type == "submit_note":
                note_text = data.get("note", "")
                rating = data.get("rating", 3)
                room.interviewer_notes.append({
                    "question_id": room.current_question.get("id") if room.current_question else None,
                    "note": note_text,
                    "rating": rating
                })
                await websocket.send_json({"type": "note_saved", "success": True})

            # -------------------------------------------------------------
            # 9. Conclude Session & Broadcast 360° Joint Report
            # -------------------------------------------------------------
            elif msg_type == "conclude_session":
                room.status = "concluded"
                report = default_peer_room_service.generate_360_evaluation(room)
                payload = {
                    "type": "session_concluded",
                    "report": report
                }
                # Broadcast report to both interviewer and candidate
                if room.interviewer and room.interviewer.get("ws"):
                    await room.interviewer["ws"].send_json(payload)
                if room.candidate and room.candidate.get("ws"):
                    await room.candidate["ws"].send_json(payload)

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from room {room_id}")
    except Exception as exc:
        logger.error(f"WebSocket error in room {room_id}: {exc}")
    finally:
        await default_peer_room_service.unregister_participant(room_id, websocket)
        other_ws = _get_other_ws(room, assigned_role)
        if other_ws:
            try:
                await other_ws.send_json({
                    "type": "peer_left",
                    "peerRole": assigned_role
                })
            except Exception:
                pass


def _get_other_ws(room: PeerRoom, role: Optional[str]) -> Optional[WebSocket]:
    """Helper to return the opposite peer's active WebSocket connection."""
    if not room:
        return None
    if role == "interviewer":
        return room.candidate.get("ws") if room.candidate else None
    elif role == "candidate":
        return room.interviewer.get("ws") if room.interviewer else None
    return None
