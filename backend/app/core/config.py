"""
Core Configuration Settings
AI Career Preparation Agent
"""

import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Automatically load environment variables from backend/.env and root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

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


settings = Settings()
