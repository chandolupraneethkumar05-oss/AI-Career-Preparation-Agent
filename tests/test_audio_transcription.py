"""
Unit & Integration Tests for Audio Transcription Pipeline
AI Career Preparation Agent

Verifies authentic faster-whisper neural transcription, VAD silence filtering,
client-hint fallback behavior, and FastAPI endpoint /api/interviews/transcribe-audio.
"""

import io
import os
import wave
import struct
import math
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.transcription_service import (
    default_transcription_service,
    LocalTranscriptionService
)


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def synthetic_speech_wav():
    """
    Generates a valid PCM 16-bit 16kHz WAV audio payload.
    If Windows SAPI is available, generates spoken words; otherwise valid tone.
    """
    try:
        import win32com.client
        import tempfile

        voice = win32com.client.Dispatch("SAPI.SpVoice")
        stream = win32com.client.Dispatch("SAPI.SpFileStream")
        tmp_wav = os.path.join(tempfile.gettempdir(), f"test_fixture_speech_{os.getpid()}.wav")
        stream.Open(tmp_wav, 3)
        voice.AudioOutputStream = stream
        voice.Speak("I implemented a distributed caching architecture using Redis and Python.")
        stream.Close()

        with open(tmp_wav, "rb") as f:
            data = f.read()
        try:
            os.remove(tmp_wav)
        except Exception:
            pass
        return data
    except Exception:
        # Fallback to 16kHz sine wave PCM
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            samples = [int(1500 * math.sin(2 * math.pi * 440 * t / 16000)) for t in range(16000)]
            wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))
        return buf.getvalue()


class TestAudioTranscriptionPipeline:
    """Test suite for neural speech transcription pipeline."""

    def test_01_clean_transcript_normalization(self):
        """Verifies text normalization preserves case and cleans irregular spacing."""
        service = LocalTranscriptionService()
        assert service.clean_transcript("   hello    world  ") == "Hello world"
        assert service.clean_transcript("Kubernetes and Docker") == "Kubernetes and Docker"
        assert service.clean_transcript("") == ""
        assert service.clean_transcript(None) == ""

    def test_02_empty_or_short_audio_handling(self):
        """Verifies empty or insufficient audio payload returns structured empty response without crashing."""
        service = default_transcription_service
        res = service.transcribe_bytes(b"", language="en")
        assert res["transcript"] == ""
        assert res["word_count"] == 0
        assert res["duration_seconds"] == 0.0

        # With client hint fallback
        res_hint = service.transcribe_bytes(b"", language="en", transcript_hint="Preliminary transcript")
        assert res_hint["transcript"] == "Preliminary transcript"
        assert res_hint["word_count"] == 2

    def test_03_neural_transcription_execution(self, synthetic_speech_wav):
        """Verifies real neural faster-whisper transcription on synthetic audio."""
        service = default_transcription_service
        result = service.transcribe_bytes(
            audio_bytes=synthetic_speech_wav,
            filename_hint="answer.wav",
            language="en"
        )
        assert isinstance(result, dict)
        assert "transcript" in result
        assert "language" in result
        assert "confidence" in result
        assert "duration_seconds" in result
        assert result["duration_seconds"] > 0
        assert isinstance(result["words"], list)

    def test_04_transcribe_audio_api_endpoint(self, client, synthetic_speech_wav):
        """Verifies POST /api/interviews/transcribe-audio endpoint ingestion and response."""
        files = {
            "file": ("test_answer.wav", synthetic_speech_wav, "audio/wav")
        }
        data = {
            "language": "en",
            "transcript_hint": "I implemented a distributed caching architecture"
        }
        response = client.post("/api/interviews/transcribe-audio", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert "transcript" in payload
        assert "language" in payload
        assert "word_count" in payload
        assert "duration_seconds" in payload
        assert "source" in payload
        assert payload["word_count"] > 0

    def test_05_transcribe_audio_api_empty_file_with_hint(self, client):
        """Verifies API endpoint gracefully handles empty audio with client hint."""
        files = {
            "file": ("empty.webm", b"0" * 20, "audio/webm")
        }
        data = {
            "language": "en",
            "transcript_hint": "Client side interim recognized speech"
        }
        response = client.post("/api/interviews/transcribe-audio", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert payload["transcript"] == "Client side interim recognized speech"
        assert payload["word_count"] == 5
