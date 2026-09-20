"""
Database Engine & Session Management
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
Vignan University — Department of AIML (MLOPS)
"""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from ..core.config import settings

logger = logging.getLogger("db")

# SQLite requires check_same_thread=False when used across multiple FastAPI request threads
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an isolated SQLAlchemy database session.
    Guarantees session teardown on request conclusion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initializes database tables and seeds initial taxonomy and default user if empty.
    """
    from . import models  # noqa: F401 Ensure models are registered on Base.metadata

    logger.info(f"Creating SQLite database tables at: {settings.DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # Lightweight SQLite schema auto-migration for newly added columns
    try:
        with engine.connect() as conn:
            cursor = conn.exec_driver_sql("PRAGMA table_info(reminder_preferences)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            if existing_cols:
                if "preferred_time" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE reminder_preferences ADD COLUMN preferred_time VARCHAR(16) DEFAULT '19:00'")
                if "timezone" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE reminder_preferences ADD COLUMN timezone VARCHAR(64) DEFAULT 'Asia/Kolkata'")
                if "created_at" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE reminder_preferences ADD COLUMN created_at DATETIME")
                conn.commit()

            cursor = conn.exec_driver_sql("PRAGMA table_info(interviews)")
            int_cols = [row[1] for row in cursor.fetchall()]
            if int_cols:
                if "status" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN status VARCHAR(32) DEFAULT 'completed'")
                if "interview_language" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN interview_language VARCHAR(16) DEFAULT 'en'")
                if "feedback_language" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN feedback_language VARCHAR(16) DEFAULT 'en'")
                if "started_at" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN started_at DATETIME")
                if "completed_at" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN completed_at DATETIME")
                if "current_question_index" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN current_question_index INTEGER DEFAULT 0")
                if "recommendations_json" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN recommendations_json TEXT DEFAULT '[]'")
                if "strengths_json" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN strengths_json TEXT DEFAULT '[]'")
                if "weaknesses_json" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN weaknesses_json TEXT DEFAULT '[]'")
                if "interview_mode" not in int_cols:
                    conn.exec_driver_sql("ALTER TABLE interviews ADD COLUMN interview_mode VARCHAR(16) DEFAULT 'text'")
                conn.commit()

            cursor = conn.exec_driver_sql("PRAGMA table_info(answer_evaluations)")
            eval_cols = [row[1] for row in cursor.fetchall()]
            if eval_cols:
                if "missing_concepts_json" not in eval_cols:
                    conn.exec_driver_sql("ALTER TABLE answer_evaluations ADD COLUMN missing_concepts_json TEXT DEFAULT '[]'")
                if "detected_topics_json" not in eval_cols:
                    conn.exec_driver_sql("ALTER TABLE answer_evaluations ADD COLUMN detected_topics_json TEXT DEFAULT '[]'")
                if "recommended_follow_up_type" not in eval_cols:
                    conn.exec_driver_sql("ALTER TABLE answer_evaluations ADD COLUMN recommended_follow_up_type VARCHAR(64)")
                if "recommended_difficulty" not in eval_cols:
                    conn.exec_driver_sql("ALTER TABLE answer_evaluations ADD COLUMN recommended_difficulty VARCHAR(32)")
                conn.commit()

            cursor = conn.exec_driver_sql("PRAGMA table_info(profiles)")
            prof_cols = [row[1] for row in cursor.fetchall()]
            if prof_cols:
                if "feedback_language" not in prof_cols:
                    conn.exec_driver_sql("ALTER TABLE profiles ADD COLUMN feedback_language VARCHAR(16) DEFAULT 'en'")
                conn.commit()

            cursor = conn.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table' AND name='skill_evidences'")
            if not cursor.fetchone():
                conn.exec_driver_sql("""
                    CREATE TABLE IF NOT EXISTS skill_evidences (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id VARCHAR(64) NOT NULL,
                        skill_name VARCHAR(64) NOT NULL,
                        source_type VARCHAR(32) NOT NULL,
                        source_id VARCHAR(64),
                        score INTEGER NOT NULL,
                        evidence_text TEXT,
                        confidence VARCHAR(16) DEFAULT 'medium',
                        created_at DATETIME NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    )
                """)
                conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_skill_evidences_user_id ON skill_evidences(user_id)")
                conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_skill_evidences_skill_name ON skill_evidences(skill_name)")
                conn.commit()

            cursor = conn.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table' AND name='interview_recordings'")
            if not cursor.fetchone():
                conn.exec_driver_sql("""
                    CREATE TABLE IF NOT EXISTS interview_recordings (
                        id VARCHAR(64) PRIMARY KEY,
                        user_id VARCHAR(64) NOT NULL,
                        session_id VARCHAR(64) NOT NULL UNIQUE,
                        storage_path VARCHAR(255) NOT NULL,
                        recording_mode VARCHAR(16) DEFAULT 'video',
                        duration_seconds FLOAT DEFAULT 0.0,
                        mime_type VARCHAR(64) DEFAULT 'video/webm',
                        file_size_bytes INTEGER DEFAULT 0,
                        status VARCHAR(32) DEFAULT 'ready',
                        segments_json TEXT DEFAULT '[]',
                        communication_metrics_json TEXT DEFAULT '{}',
                        created_at DATETIME NOT NULL,
                        deleted_at DATETIME,
                        FOREIGN KEY(user_id) REFERENCES users(id),
                        FOREIGN KEY(session_id) REFERENCES interviews(id)
                    )
                """)
                conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_interview_recordings_user_id ON interview_recordings(user_id)")
                conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_interview_recordings_session_id ON interview_recordings(session_id)")
                conn.commit()

            # Phase 17: Real Interview Experiences & Question Knowledge Base
            conn.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS interview_experiences (
                    id VARCHAR(64) PRIMARY KEY,
                    user_id VARCHAR(64) NOT NULL,
                    role VARCHAR(128) NOT NULL,
                    experience_level VARCHAR(32) DEFAULT 'entry',
                    round_type VARCHAR(64) DEFAULT 'technical',
                    company VARCHAR(128),
                    company_disclosure VARCHAR(32) DEFAULT 'industry_only',
                    industry VARCHAR(128) DEFAULT 'Technology',
                    difficulty VARCHAR(32) DEFAULT 'medium',
                    outcome VARCHAR(32) DEFAULT 'undisclosed',
                    experience_text TEXT NOT NULL,
                    topics_json TEXT DEFAULT '[]',
                    preparation_tips TEXT,
                    resume_summary_json TEXT DEFAULT '{}',
                    moderation_status VARCHAR(32) DEFAULT 'PENDING',
                    moderation_notes TEXT,
                    pii_scan_status VARCHAR(32) DEFAULT 'CLEAN',
                    pii_detected_categories_json TEXT DEFAULT '[]',
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """)
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_interview_experiences_user_id ON interview_experiences(user_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_interview_experiences_role ON interview_experiences(role)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_interview_experiences_moderation_status ON interview_experiences(moderation_status)")

            conn.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS interview_experience_questions (
                    id VARCHAR(64) PRIMARY KEY,
                    experience_id VARCHAR(64) NOT NULL,
                    question_text TEXT NOT NULL,
                    round_type VARCHAR(64) DEFAULT 'technical',
                    topic VARCHAR(64) DEFAULT 'General',
                    difficulty VARCHAR(32) DEFAULT 'medium',
                    created_at DATETIME NOT NULL,
                    FOREIGN KEY(experience_id) REFERENCES interview_experiences(id) ON DELETE CASCADE
                )
            """)
            cursor = conn.exec_driver_sql("PRAGMA table_info(users)")
            user_cols = [row[1] for row in cursor.fetchall()]
            if user_cols and "streak_recovery_used_at" not in user_cols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN streak_recovery_used_at DATETIME")
                conn.commit()
    except Exception as mig_exc:
        logger.warning(f"Schema migration warning: {mig_exc}")

    # Seed default user and core skill taxonomies if needed
    db = SessionLocal()
    try:
        models.seed_initial_data(db)
    except Exception as exc:
        logger.error(f"Error seeding initial data: {exc}")
        db.rollback()
    finally:
        db.close()
