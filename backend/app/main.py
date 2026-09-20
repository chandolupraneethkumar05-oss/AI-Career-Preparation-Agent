"""
FastAPI Main Application Entrypoint
AI Career Preparation Agent
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .db.database import init_db
from .api.router import api_router
from .services.scheduler import proactive_scheduler
from .models.schemas import HealthResponse

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables & seed data
    logger.info("Initializing SQLite database tables and core taxonomy...")
    try:
        init_db()
    except Exception as exc:
        logger.error(f"Database initialization encountered an error: {exc}")

    # Start proactive background scheduler
    logger.info("Starting proactive daily practice reminder scheduler...")
    proactive_scheduler.start()

    yield

    # Shutdown: Stop scheduler
    logger.info("Shutting down AI Career Preparation Agent Backend...")
    proactive_scheduler.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Autonomous career intelligence backend powering proactive practice reminders, "
        "activity tracking, ATS analysis, and SQLite persistence."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration allowing Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    """Adds essential production security headers to all HTTP responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Mount Unified API Router
app.include_router(api_router)


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """System health check probe."""
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        schedulerActive=proactive_scheduler.is_running
    )


@app.get("/api/ready", tags=["System"])
def readiness_check():
    """Readiness probe verifying SQLite database responsiveness and scheduler state."""
    try:
        from .db.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "scheduler": "running" if proactive_scheduler.is_running else "idle",
            "version": settings.VERSION
        }
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}")
        return {
            "status": "not_ready",
            "database": "disconnected",
            "error": str(exc)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
