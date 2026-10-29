"""
Real Audio Transcription Service
AI Career Preparation Agent

Provides production-grade, neural speech-to-text transcription powered by faster-whisper.
Accepts raw audio bytes (WebM, WAV, MP3, OGG, M4A) or multi-part audio blobs.
Includes automatic Voice Activity Detection (VAD) to filter background silence,
multi-language speech recognition, and fallback client transcript normalization.
"""

import os
import io
import re
import logging
import tempfile
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Global singleton for lazily cached Whisper model
_WHISPER_MODEL = None

try:
    import av
    if hasattr(av, "open"):
        _orig_av_open = av.open
        def _safe_av_open(*args, **kwargs):
            kwargs.pop("metadata_errors", None)
            return _orig_av_open(*args, **kwargs)
        av.open = _safe_av_open
except Exception:
    pass


def get_whisper_model(model_size: str = "tiny"):
    """
    Lazily loads and caches the faster-whisper model singleton on CPU.
    Uses int8 quantization for ultra-fast, memory-efficient inference.
    """
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        try:
            from faster_whisper import WhisperModel
            logger.info(f"Initializing faster-whisper ('{model_size}', device='cpu', compute_type='int8')...")
            _WHISPER_MODEL = WhisperModel(model_size, device="cpu", compute_type="int8")
            logger.info("faster-whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize faster-whisper model: {e}")
            raise
    return _WHISPER_MODEL


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

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        filename_hint: str = "audio.webm",
        language: Optional[str] = "en",
        transcript_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError


class LocalTranscriptionService(TranscriptionService):
    """
    Production-ready transcription engine powered by faster-whisper on CPU.
    Processes audio streams in any standard browser container (WebM, WAV, OGG, MP4).
    Filters background noise with Voice Activity Detection (VAD) and extracts
    authentic verbal transcripts for interview answer evaluation.
    """

    def __init__(self, model_size: str = "tiny"):
        self.model_size = model_size

    def clean_transcript(self, text: Optional[str]) -> str:
        """
        Normalizes transcribed verbal text without removing conversational delivery words.
        """
        if not text:
            return ""

        # Normalize whitespace while preserving word boundaries
        cleaned = re.sub(r"\s+", " ", text).strip()
        # Capitalize first letter if needed
        if cleaned and cleaned[0].islower():
            cleaned = cleaned[0].upper() + cleaned[1:]
        return cleaned

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        filename_hint: str = "audio.webm",
        language: Optional[str] = "en",
        transcript_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribes raw audio bytes (WebM, WAV, MP3, OGG) using faster-whisper.
        Returns a structured dictionary containing transcript, language, confidence, and tokens.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            hint_clean = self.clean_transcript(transcript_hint) if transcript_hint else ""
            return {
                "transcript": hint_clean,
                "language": language or "en",
                "confidence": 0.8 if hint_clean else 0.0,
                "duration_seconds": 0.0,
                "word_count": len(hint_clean.split()) if hint_clean else 0,
                "words": hint_clean.split() if hint_clean else [],
                "source": "client_hint" if hint_clean else "empty_audio"
            }

        # Determine file suffix from hint
        suffix = ".webm"
        if filename_hint:
            lower = filename_hint.lower()
            for ext in [".wav", ".webm", ".ogg", ".mp3", ".m4a", ".flac"]:
                if lower.endswith(ext):
                    suffix = ext
                    break

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                temp_path = tmp.name

            model = get_whisper_model(self.model_size)

            # Map language code
            lang_param = None
            if language and language not in ("auto", "all"):
                # Normalize standard short codes (e.g. "en", "es", "hi", "te")
                lang_param = language.split("-")[0].lower()

            segments, info = model.transcribe(
                temp_path,
                language=lang_param,
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=400)
            )

            seg_texts = []
            for seg in segments:
                t = seg.text.strip()
                if t:
                    seg_texts.append(t)

            raw_text = " ".join(seg_texts)
            cleaned = self.clean_transcript(raw_text)

            # If VAD detected only silence or no speech, check if client provided a non-empty hint
            source = "whisper_neural"
            if not cleaned and transcript_hint and transcript_hint.strip():
                cleaned = self.clean_transcript(transcript_hint)
                source = "client_hint_fallback"

            words = cleaned.split() if cleaned else []
            confidence = round(float(info.language_probability), 3) if info else 1.0
            duration = round(float(info.duration), 2) if info else 0.0
            detected_lang = info.language if info else (lang_param or "en")

            return {
                "transcript": cleaned,
                "language": detected_lang,
                "confidence": confidence,
                "duration_seconds": duration,
                "word_count": len(words),
                "words": words,
                "source": source
            }
        except Exception as e:
            logger.warning(f"Whisper transcription failed: {e}. Checking fallback.")
            if transcript_hint and transcript_hint.strip():
                hint_clean = self.clean_transcript(transcript_hint)
                return {
                    "transcript": hint_clean,
                    "language": language or "en",
                    "confidence": 0.7,
                    "duration_seconds": 0.0,
                    "word_count": len(hint_clean.split()),
                    "words": hint_clean.split(),
                    "source": "client_hint_fallback"
                }
            return {
                "transcript": "",
                "language": language or "en",
                "confidence": 0.0,
                "duration_seconds": 0.0,
                "word_count": 0,
                "words": [],
                "source": f"error: {str(e)}"
            }
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        transcript_hint: Optional[str] = None,
        language: str = "en"
    ) -> str:
        """
        Maintains backward compatibility with simple transcribe signature.
        Returns cleaned string transcript directly.
        """
        if audio_bytes and len(audio_bytes) >= 100:
            result = self.transcribe_bytes(
                audio_bytes=audio_bytes,
                language=language,
                transcript_hint=transcript_hint
            )
            if result.get("transcript"):
                return result["transcript"]

        if transcript_hint and transcript_hint.strip():
            return self.clean_transcript(transcript_hint)

        return ""


# Singleton instance
default_transcription_service = LocalTranscriptionService()
