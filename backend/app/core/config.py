"""
Core Configuration Settings
AI Career Preparation Agent
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

try:
    from dotenv import load_dotenv
    # Automatically load environment variables from backend/.env, root .env, and Render secret files
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR.parent / ".env")
    load_dotenv(Path.cwd() / ".env")
    load_dotenv(Path("/etc/secrets/.env"))
    load_dotenv(Path("/etc/secrets/backend.env"))
except ImportError:
    pass

DEFAULT_DB_PATH = BASE_DIR / "career_agent.db"


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if origins:
            return origins
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1",
    ]


class Settings(BaseModel):
    PROJECT_NAME: str = "AI Career Preparation Agent API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # SQLite Database Configuration (Always resolve to canonical backend/career_agent.db)
    DATABASE_URL: str = (
        f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
        if not os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL") == "sqlite:///./career_agent.db"
        else os.getenv("DATABASE_URL")
    )

    # Recordings Media Storage Directory
    RECORDINGS_STORAGE_DIR: str = os.getenv(
        "RECORDINGS_STORAGE_DIR",
        (BASE_DIR / "storage" / "recordings").as_posix()
    )

    # CORS settings - scoped specifically to frontend Vite and preview hosts
    CORS_ORIGINS: list[str] = _parse_cors_origins()

    # Security API Key for Password Reset Authorization
    PASSWORD_RESET_API_KEY: str = os.getenv("PASSWORD_RESET_API_KEY", os.getenv("RESET_PASSWORD_API_KEY", "")).strip()

    # Dedicated Per-Interview-Mode AI API Keys
    INTERVIEW_TEXT_API_KEY: str = os.getenv("INTERVIEW_TEXT_API_KEY", "").strip()
    INTERVIEW_VIDEO_API_KEY: str = os.getenv("INTERVIEW_VIDEO_API_KEY", "").strip()
    INTERVIEW_FACE_TO_FACE_API_KEY: str = os.getenv("INTERVIEW_FACE_TO_FACE_API_KEY", "").strip()
    INTERVIEW_PEER_CHAMBER_API_KEY: str = os.getenv("INTERVIEW_PEER_CHAMBER_API_KEY", "").strip()
    INTERVIEW_REVERSE_MOCK_API_KEY: str = os.getenv("INTERVIEW_REVERSE_MOCK_API_KEY", "").strip()
    INTERVIEW_TECH_FOCUS_API_KEY: str = os.getenv("INTERVIEW_TECH_FOCUS_API_KEY", os.getenv("TECH_INTERVIEW_API_KEY", "")).strip()

    # Dedicated Skill Gap Assessment AI API Key
    SKILL_GAP_API_KEY: str = os.getenv("SKILL_GAP_API_KEY", "").strip()

    # Dedicated JIT Skill Primer AI API Key
    SKILL_PRIMER_API_KEY: str = os.getenv("SKILL_PRIMER_API_KEY", os.getenv("JIT_PRIMER_API_KEY", "")).strip()

    # Dedicated Resume ATS Score AI API Key
    RESUME_ATS_API_KEY: str = os.getenv("RESUME_ATS_API_KEY", os.getenv("ATS_SCORE_API_KEY", "")).strip()


settings = Settings()
