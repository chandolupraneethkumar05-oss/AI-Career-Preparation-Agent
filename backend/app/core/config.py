"""
Core Configuration Settings
AI Career Preparation Agent
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "career_agent.db"


class Settings(BaseModel):
    PROJECT_NAME: str = "AI Career Preparation Agent API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # SQLite Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
    )

    # CORS settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]


settings = Settings()
