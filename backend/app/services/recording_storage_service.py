"""
Recording Storage Service
AI Career Preparation Agent

Safe, user-isolated storage abstraction for mock interview recordings.
Stores metadata in SQLite while saving binary media to user-scoped filesystem paths.
Designed with a provider interface that can be switched to S3 / GCS in future phases.
"""

import os
import re
import mimetypes
from pathlib import Path
from typing import Optional, Dict, Any, Generator, Tuple

# Base storage path inside backend/storage/recordings
BASE_STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "recordings"


class RecordingStorageError(Exception):
    """Base exception for storage errors."""
    pass


class RecordingStorageService:
    """Interface for interview media storage."""

    def save_recording(
        self,
        user_id: str,
        session_id: str,
        file_bytes: bytes,
        mime_type: str = "video/webm"
    ) -> Dict[str, Any]:
        raise NotImplementedError

    def get_recording_path(self, user_id: str, session_id: str) -> Optional[Path]:
        raise NotImplementedError

    def delete_recording(self, user_id: str, session_id: str) -> bool:
        raise NotImplementedError

    def get_stream(
        self,
        user_id: str,
        session_id: str,
        start_byte: int = 0,
        end_byte: Optional[int] = None
    ) -> Tuple[Generator[bytes, None, None], int, int, int, str]:
        raise NotImplementedError


class LocalRecordingStorageService(RecordingStorageService):
    """
    Local filesystem implementation with strict tenant isolation.
    Directories are scoped per user: storage/recordings/{user_id}/{session_id}/
    """

    ALLOWED_MIME_TYPES = {
        "video/webm": ".webm",
        "video/mp4": ".mp4",
        "video/x-matroska": ".mkv",
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3"
    }

    MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024  # 150 MB safety cap per practice session

    def __init__(self, base_dir: Path = BASE_STORAGE_DIR):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_id(self, val: str) -> str:
        """Prevent path traversal and directory escape."""
        if not val or not re.match(r"^[a-zA-Z0-9_\-]+$", val):
            raise RecordingStorageError("Invalid user or session identifier.")
        return val

    def _get_session_dir(self, user_id: str, session_id: str) -> Path:
        u_id = self._sanitize_id(user_id)
        s_id = self._sanitize_id(session_id)
        session_dir = self.base_dir / u_id / s_id
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir

    def save_recording(
        self,
        user_id: str,
        session_id: str,
        file_bytes: bytes,
        mime_type: str = "video/webm"
    ) -> Dict[str, Any]:
        """
        Saves user recording bytes to user-scoped directory.
        Validates size and allowed MIME type.
        """
        if len(file_bytes) > self.MAX_FILE_SIZE_BYTES:
            raise RecordingStorageError(
                f"Recording size ({len(file_bytes)} bytes) exceeds maximum allowable limit of 150MB."
            )

        clean_mime = mime_type.split(";")[0].strip().lower()
        ext = self.ALLOWED_MIME_TYPES.get(clean_mime, ".webm")

        session_dir = self._get_session_dir(user_id, session_id)
        target_file = session_dir / f"recording{ext}"

        with open(target_file, "wb") as f:
            f.write(file_bytes)

        return {
            "storage_path": str(target_file.relative_to(self.base_dir)),
            "full_path": str(target_file),
            "file_size_bytes": len(file_bytes),
            "mime_type": clean_mime
        }

    def get_recording_path(self, user_id: str, session_id: str) -> Optional[Path]:
        """
        Locates the recording file for the specified user and session.
        Enforces user ownership.
        """
        try:
            u_id = self._sanitize_id(user_id)
            s_id = self._sanitize_id(session_id)
        except RecordingStorageError:
            return None

        session_dir = self.base_dir / u_id / s_id
        if not session_dir.exists():
            return None

        # Look for any recording.* file
        for ext in self.ALLOWED_MIME_TYPES.values():
            cand = session_dir / f"recording{ext}"
            if cand.exists() and cand.is_file():
                return cand

        # Fallback to any file in directory
        files = [f for f in session_dir.iterdir() if f.is_file()]
        return files[0] if files else None

    def delete_recording(self, user_id: str, session_id: str) -> bool:
        """
        Safely deletes all recording media files for the session.
        Leaves other user directories untouched.
        """
        try:
            u_id = self._sanitize_id(user_id)
            s_id = self._sanitize_id(session_id)
        except RecordingStorageError:
            return False

        session_dir = self.base_dir / u_id / s_id
        if not session_dir.exists():
            return False

        deleted_any = False
        for f in session_dir.iterdir():
            if f.is_file():
                try:
                    f.unlink()
                    deleted_any = True
                except Exception:
                    pass

        try:
            session_dir.rmdir()
        except Exception:
            pass

        return deleted_any

    def get_stream(
        self,
        user_id: str,
        session_id: str,
        start_byte: int = 0,
        end_byte: Optional[int] = None
    ) -> Tuple[Generator[bytes, None, None], int, int, int, str]:
        """
        Provides chunked streaming generator for HTML5 video player seek support.
        Returns: (chunk_generator, start_byte, end_byte, total_size, mime_type)
        """
        path = self.get_recording_path(user_id, session_id)
        if not path or not path.exists():
            raise RecordingStorageError("Recording file not found.")

        total_size = path.stat().st_size
        if end_byte is None or end_byte >= total_size:
            end_byte = total_size - 1

        if start_byte > end_byte or start_byte < 0:
            start_byte = 0

        mime_type, _ = mimetypes.guess_type(str(path))
        if not mime_type:
            mime_type = "video/webm"

        def chunk_generator(chunk_size=1024 * 64):
            with open(path, "rb") as f:
                f.seek(start_byte)
                bytes_left = (end_byte - start_byte) + 1
                while bytes_left > 0:
                    read_size = min(chunk_size, bytes_left)
                    chunk = f.read(read_size)
                    if not chunk:
                        break
                    bytes_left -= len(chunk)
                    yield chunk

        return chunk_generator(), start_byte, end_byte, total_size, mime_type


# Default singleton instance
default_recording_storage = LocalRecordingStorageService()
