"""
Interview Service
AI Career Preparation Agent
"""

import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import Interview, SkillGap, User
from ..schemas.interview import InterviewCreate
from ..schemas.activity import ActivityCreate
from .activity_service import record_activity


def utc_now():
    return datetime.now(timezone.utc)


def save_interview(db: Session, user_id: str, data: InterviewCreate) -> Interview:
    """
    Saves a completed mock interview session, awards +100 XP,
    and updates candidate skill gap models based on rubric scores.
    """
    now = utc_now()
    interview_id = data.id or f"int-{int(now.timestamp() * 1000)}"

    interview = Interview(
        id=interview_id,
        user_id=user_id,
        role=data.role,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        overall_score=data.overall_score,
        passed=data.passed,
        questions_count=data.questions_count,
        feedback_summary=data.feedback_summary or "",
        rubric_scores_json=json.dumps(data.rubric_scores or {}),
        answers_json=json.dumps(data.answers or []),
        created_at=now
    )
    db.add(interview)
    db.flush()

    # Automatically record immutable activity (+100 XP)
    record_activity(
        db=db,
        user_id=user_id,
        data=ActivityCreate(
            type="interview_completed",
            related_module="interview",
            title=f"Completed {data.difficulty} {data.role} Mock Interview ({data.overall_score}/100)",
            xp_earned=100,
            details={
                "interviewId": interview_id,
                "role": data.role,
                "score": data.overall_score,
                "difficulty": data.difficulty
            }
        )
    )

    # Update skill gaps dynamically from rubric scores
    rubrics = data.rubric_scores or {}
    skill_mapping = {
        "technicalKnowledge": ("Technical Knowledge", "Foundational"),
        "clarity": ("Communication (STAR)", "Communication"),
        "confidence": ("Confidence & Articulation", "Communication"),
        "relevance": ("Problem Solving", "Foundational"),
        "structure": ("System Design", "System Design"),
    }

    for key, (skill_name, category) in skill_mapping.items():
        if key in rubrics:
            score = rubrics[key]
            # Normalize 0-10 score to 0-100 if necessary
            norm_score = score * 10 if score <= 10 else score
            existing_gap = (
                db.query(SkillGap)
                .filter(SkillGap.user_id == user_id)
                .filter(SkillGap.skill_name == skill_name)
                .first()
            )
            priority = "high" if norm_score < 70 else ("medium" if norm_score < 80 else "low")

            if existing_gap:
                existing_gap.current_score = norm_score
                existing_gap.priority = priority
                existing_gap.source = "interview"
                existing_gap.updated_at = now
            else:
                new_gap = SkillGap(
                    user_id=user_id,
                    skill_name=skill_name,
                    category=category,
                    current_score=norm_score,
                    target_score=80,
                    priority=priority,
                    source="interview",
                    updated_at=now
                )
                db.add(new_gap)

    db.commit()
    db.refresh(interview)
    return interview


def get_user_interviews(db: Session, user_id: str, limit: int = 50) -> List[Interview]:
    """Fetches candidate interview history."""
    return (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .limit(limit)
        .all()
    )


def get_interview_detail(db: Session, user_id: str, interview_id: str) -> Optional[Interview]:
    """Fetches full interview record including question answers."""
    return (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .filter(Interview.id == interview_id)
        .first()
    )
