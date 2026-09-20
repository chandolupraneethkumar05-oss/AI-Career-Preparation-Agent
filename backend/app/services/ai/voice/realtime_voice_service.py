import os, uuid, logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import httpx
from ....core.config import settings

logger = logging.getLogger('realtime_voice')

class VoiceTurn(BaseModel):
    speaker: str
    text: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VoiceSessionResponse(BaseModel):
    session_id: str
    interview_id: Optional[str] = None
    mode: str = 'live'
    token: str
    expires_at: str
    model: str
    voice_name: str
    websocket_url: Optional[str] = None
    system_instruction: str
    role: str
    difficulty: str
    topic: str

class RealtimeVoiceService:
    def __init__(self):
        self._transcripts: Dict[str, List[VoiceTurn]] = {}
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def _generate_system_instruction(self, role: str, difficulty: str, topic: str) -> str:
        return (
            f'You are a Senior Principal Technical Interviewer conducting a rigorous, professional, '
            f'real-time oral technical interview for a {role} position. '
            f'Difficulty Level: {difficulty}. '
            f'Primary Technical Focus: {topic}. '
            f'GUIDELINES FOR THE INTERVIEW:\n'
            f'1. Keep each speaking turn concise, natural, and conversational (1 to 3 sentences maximum).\n'
            f'2. Ask exactly ONE technical concept, architectural tradeoff, or problem-solving question at a time.\n'
            f'3. Probe candidate depth: if they give a high-level answer, ask for the underlying mechanism or failure mode.\n'
            f'4. The candidate may speak over you or interrupt (barge-in); immediately pause, listen, and adapt your response.\n'
            f'5. Maintain an encouraging yet discerning technical tone.\n'
            f'6. Begin immediately with a brief welcome and the first technical question.'
        )

    async def create_session(self, role: str = 'Machine Learning Engineer', difficulty: str = 'Intermediate', topic: str = 'System Design and Algorithms', interview_id: Optional[str] = None, voice_name: str = 'Puck') -> VoiceSessionResponse:
        session_id = f'vsession_{uuid.uuid4().hex[:12]}'
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(minutes=30)).isoformat()
        new_session_expire = (now + timedelta(minutes=2)).isoformat()
        model_name = 'models/gemini-2.0-flash-exp'
        system_instruction = self._generate_system_instruction(role, difficulty, topic)
        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        if gemini_api_key and not gemini_api_key.startswith('mock-') and not gemini_api_key.startswith('test-'):
            try:
                url = f'https://generativelanguage.googleapis.com/v1beta/auth_tokens?key={gemini_api_key}'
                payload = {'uses': 1, 'expireTime': expires_at, 'newSessionExpireTime': new_session_expire}
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        token_name = data.get('name', '')
                        ws_url = f'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token={token_name}'
                        session_resp = VoiceSessionResponse(session_id=session_id, interview_id=interview_id, mode='live', token=token_name, expires_at=expires_at, model=model_name, voice_name=voice_name, websocket_url=ws_url, system_instruction=system_instruction, role=role, difficulty=difficulty, topic=topic)
                        self._sessions[session_id] = session_resp.model_dump()
                        return session_resp
            except Exception as e:
                logger.error(f'Error provisioning ephemeral token: {e}')
        simulated_token = f'ephemeral_sim_{uuid.uuid4().hex}'
        session_resp = VoiceSessionResponse(session_id=session_id, interview_id=interview_id, mode='simulated', token=simulated_token, expires_at=expires_at, model=model_name, voice_name=voice_name, websocket_url=None, system_instruction=system_instruction, role=role, difficulty=difficulty, topic=topic)
        self._sessions[session_id] = session_resp.model_dump()
        return session_resp

    def append_transcript_turn(self, session_id: str, speaker: str, text: str) -> None:
        if session_id not in self._transcripts:
            self._transcripts[session_id] = []
        self._transcripts[session_id].append(VoiceTurn(speaker=speaker, text=text))

    def get_transcript(self, session_id: str) -> List[VoiceTurn]:
        return self._transcripts.get(session_id, [])

default_realtime_voice_service = RealtimeVoiceService()
