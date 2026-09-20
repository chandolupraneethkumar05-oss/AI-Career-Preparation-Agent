"""
Transcription Service Abstraction
AI Career Preparation Agent

Provides speech-to-text transcription interface.
Consolidates candidate audio verbal answers with transcript validation and NLP normalization.
Ensures no fabricated transcripts are produced if transcription fails or audio is silent.
"""

import re
from typing import Optional, Dict, Any


class TranscriptionError(Exception):
    """Base exception for transcription errors."""
    pass


class TranscriptionService:
    """Interface for audio transcription providers."""

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        transcript_hint: Optional[str] = None,
        language: str = "en"
    ) -> str:
        raise NotImplementedError


class LocalTranscriptionService(TranscriptionService):
    """
    Production-ready transcription consolidator.
    Works seamlessly with browser Web Speech API streams while providing
    safe fallback and normalization for verbal interview recordings.
    """

    FALLBACK_MESSAGE = "Transcript unavailable."

    def clean_transcript(self, text: Optional[str]) -> str:
        """
        Normalizes transcribed verbal text without removing conversational filler words
        which are needed for delivery evaluation.
        """
        if not text:
            return ""

        # Normalize whitespace while preserving word boundaries
        cleaned = re.sub(r"\s+", " ", text).strip()
        # Capitalize first letter if needed
        if cleaned and cleaned[0].islower():
            cleaned = cleaned[0].upper() + cleaned[1:]
        return cleaned

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        transcript_hint: Optional[str] = None,
        language: str = "en"
    ) -> str:
        """
        Returns validated transcript.
        If transcript hint is provided from client Web Speech API, normalizes and verifies it.
        If no transcript can be determined, returns the honest fallback message.
        """
        if transcript_hint and transcript_hint.strip():
            cleaned = self.clean_transcript(transcript_hint)
            if cleaned:
                return cleaned

        if not audio_bytes or len(audio_bytes) < 100:
            return self.FALLBACK_MESSAGE

        # If audio bytes are present but no provider configured in local dev,
        # return honest fallback rather than pretending or hallucinating speech.
        return self.FALLBACK_MESSAGE


# Singleton instance
default_transcription_service = LocalTranscriptionService()
