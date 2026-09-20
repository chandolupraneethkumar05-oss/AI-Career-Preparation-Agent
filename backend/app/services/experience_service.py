"""
Interview Experience Service
AI Career Preparation Agent

Manages creation, PII scanning, moderation, querying, and updating of
candidate-contributed real interview experiences and interview question repository.
"""

import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..db.models import InterviewExperience, InterviewExperienceQuestion, User
from ..schemas.experience import (
    InterviewExperienceCreate,
    InterviewExperienceUpdate,
    ExperienceModerateRequest
)
from .pii_detection_service import scan_submission_pii, scan_text_pii

logger = logging.getLogger("experience_service")


def format_display_company(experience: InterviewExperience) -> str:
    """Formats company name based on candidate's disclosure preference."""
    disclosure = getattr(experience, "company_disclosure", "industry_only") or "industry_only"
    if disclosure == "specific" and experience.company:
        return experience.company.strip()
    elif disclosure == "industry_only":
        ind = (experience.industry or "Technology").strip()
        return f"{ind} Industry"
    else:
        return "Anonymous Company"


def format_experience_dict(experience: InterviewExperience, current_user_id: Optional[str] = None) -> Dict[str, Any]:
    """Converts ORM model to dictionary conforming to response schema."""
    questions_list = []
    if experience.questions:
        for q in experience.questions:
            questions_list.append({
                "id": q.id,
                "experience_id": q.experience_id,
                "question_text": q.question_text,
                "round_type": q.round_type,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "created_at": q.created_at
            })

    is_owner = bool(current_user_id and str(experience.user_id) == str(current_user_id))
    display_company = format_display_company(experience)

    # In public responses, sanitize company name if disclosure is not 'specific'
    visible_company = experience.company if (is_owner or experience.company_disclosure == "specific") else None

    return {
        "id": experience.id,
        "user_id": experience.user_id,
        "role": experience.role,
        "experience_level": experience.experience_level,
        "round_type": experience.round_type,
        "company": visible_company,
        "display_company": display_company,
        "company_disclosure": experience.company_disclosure,
        "industry": experience.industry,
        "difficulty": experience.difficulty,
        "outcome": experience.outcome,
        "experience_text": experience.experience_text,
        "topics": experience.topics,
        "preparation_tips": experience.preparation_tips,
        "resume_summary": experience.resume_summary,
        "moderation_status": experience.moderation_status,
        "moderation_notes": experience.moderation_notes if is_owner else None,
        "pii_scan_status": experience.pii_scan_status,
        "pii_detected_categories": experience.pii_detected_categories,
        "questions": questions_list,
        "created_at": experience.created_at,
        "updated_at": experience.updated_at,
        "is_owner": is_owner
    }


def create_experience(
    db: Session,
    user_id: str,
    payload: InterviewExperienceCreate
) -> Dict[str, Any]:
    """
    Scans for PII, validates, and persists an interview experience.
    Submissions default to 'PENDING' moderation status.
    """
    submission_dict = payload.model_dump()
    pii_report = scan_submission_pii(submission_dict)

    experience_id = f"exp-{uuid.uuid4().hex[:12]}"

    new_experience = InterviewExperience(
        id=experience_id,
        user_id=user_id,
        role=payload.role.strip(),
        experience_level=payload.experience_level,
        round_type=payload.round_type,
        company=payload.company.strip() if payload.company else None,
        company_disclosure=payload.company_disclosure,
        industry=payload.industry.strip() if payload.industry else "Technology",
        difficulty=payload.difficulty,
        outcome=payload.outcome,
        experience_text=payload.experience_text.strip(),
        preparation_tips=payload.preparation_tips.strip() if payload.preparation_tips else None,
        moderation_status="PENDING",
        moderation_notes=None,
        pii_scan_status=pii_report["pii_scan_status"],
    )
    new_experience.topics = [t.strip() for t in payload.topics if t and t.strip()]
    new_experience.resume_summary = payload.resume_summary or {}
    new_experience.pii_detected_categories = pii_report["detected_categories"]

    db.add(new_experience)
    db.flush()

    # Add questions
    for q_item in payload.questions:
        if q_item.question_text and q_item.question_text.strip():
            q_id = f"expq-{uuid.uuid4().hex[:12]}"
            question_record = InterviewExperienceQuestion(
                id=q_id,
                experience_id=experience_id,
                question_text=q_item.question_text.strip(),
                round_type=q_item.round_type or payload.round_type,
                topic=q_item.topic or "General",
                difficulty=q_item.difficulty or payload.difficulty
            )
            db.add(question_record)

    db.commit()
    db.refresh(new_experience)

    logger.info(f"User {user_id} created experience {experience_id} (PII: {pii_report['pii_scan_status']})")
    return format_experience_dict(new_experience, current_user_id=user_id)


def get_approved_experiences(
    db: Session,
    current_user_id: Optional[str] = None,
    role: Optional[str] = None,
    round_type: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Fetches approved experiences with dynamic filtering and search.
    """
    query = db.query(InterviewExperience).filter(
        InterviewExperience.moderation_status == "APPROVED"
    )

    if role:
        query = query.filter(InterviewExperience.role.ilike(f"%{role.strip()}%"))
    if round_type:
        query = query.filter(InterviewExperience.round_type.ilike(round_type.strip()))
    if difficulty:
        query = query.filter(InterviewExperience.difficulty.ilike(difficulty.strip()))
    if topic:
        query = query.filter(InterviewExperience.topics_json.ilike(f"%{topic.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InterviewExperience.role.ilike(term),
                InterviewExperience.experience_text.ilike(term),
                InterviewExperience.preparation_tips.ilike(term),
                InterviewExperience.company.ilike(term),
                InterviewExperience.topics_json.ilike(term)
            )
        )

    total_count = query.count()
    experiences = query.order_by(InterviewExperience.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "items": [format_experience_dict(exp, current_user_id=current_user_id) for exp in experiences],
        "limit": limit,
        "offset": offset
    }


def get_user_experiences(
    db: Session,
    user_id: str
) -> List[Dict[str, Any]]:
    """Fetches all experiences submitted by a specific user regardless of status."""
    records = db.query(InterviewExperience).filter(
        InterviewExperience.user_id == user_id
    ).order_by(InterviewExperience.created_at.desc()).all()

    return [format_experience_dict(exp, current_user_id=user_id) for exp in records]


def get_experience_by_id(
    db: Session,
    experience_id: str,
    current_user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single experience by ID.
    Access allowed if APPROVED or requested by owner.
    """
    exp = db.query(InterviewExperience).filter(InterviewExperience.id == experience_id).first()
    if not exp:
        return None

    if exp.moderation_status != "APPROVED" and str(exp.user_id) != str(current_user_id):
        return None

    return format_experience_dict(exp, current_user_id=current_user_id)


def update_experience(
    db: Session,
    experience_id: str,
    user_id: str,
    payload: InterviewExperienceUpdate
) -> Optional[Dict[str, Any]]:
    """
    Updates an experience. Enforces ownership and re-triggers PII scanning.
    Resets moderation status to 'PENDING'.
    """
    exp = db.query(InterviewExperience).filter(InterviewExperience.id == experience_id).first()
    if not exp:
        return None

    if str(exp.user_id) != str(user_id):
        raise PermissionError("You can only modify your own interview experiences.")

    update_dict = payload.model_dump(exclude_unset=True)

    # Re-scan for PII
    scan_data = {
        "experience_text": update_dict.get("experience_text", exp.experience_text),
        "preparation_tips": update_dict.get("preparation_tips", exp.preparation_tips or ""),
        "company": update_dict.get("company", exp.company or ""),
        "role": update_dict.get("role", exp.role),
        "questions": update_dict.get("questions", [{"question_text": q.question_text} for q in exp.questions])
    }
    pii_report = scan_submission_pii(scan_data)

    # Apply updates
    if "role" in update_dict:
        exp.role = update_dict["role"].strip()
    if "experience_level" in update_dict:
        exp.experience_level = update_dict["experience_level"]
    if "round_type" in update_dict:
        exp.round_type = update_dict["round_type"]
    if "company" in update_dict:
        exp.company = update_dict["company"].strip() if update_dict["company"] else None
    if "company_disclosure" in update_dict:
        exp.company_disclosure = update_dict["company_disclosure"]
    if "industry" in update_dict:
        exp.industry = update_dict["industry"]
    if "difficulty" in update_dict:
        exp.difficulty = update_dict["difficulty"]
    if "outcome" in update_dict:
        exp.outcome = update_dict["outcome"]
    if "experience_text" in update_dict:
        exp.experience_text = update_dict["experience_text"].strip()
    if "preparation_tips" in update_dict:
        exp.preparation_tips = update_dict["preparation_tips"].strip() if update_dict["preparation_tips"] else None
    if "topics" in update_dict:
        exp.topics = [t.strip() for t in update_dict["topics"] if t and t.strip()]
    if "resume_summary" in update_dict:
        exp.resume_summary = update_dict["resume_summary"] or {}

    # Critical: Reset moderation to PENDING on modification
    exp.moderation_status = "PENDING"
    exp.pii_scan_status = pii_report["pii_scan_status"]
    exp.pii_detected_categories = pii_report["detected_categories"]
    exp.updated_at = datetime.now(timezone.utc)

    # Replace questions if supplied
    if "questions" in update_dict and update_dict["questions"] is not None:
        db.query(InterviewExperienceQuestion).filter(
            InterviewExperienceQuestion.experience_id == experience_id
        ).delete()
        for q_item in update_dict["questions"]:
            q_text = q_item.get("question_text") if isinstance(q_item, dict) else getattr(q_item, "question_text", "")
            if q_text and q_text.strip():
                q_id = f"expq-{uuid.uuid4().hex[:12]}"
                question_record = InterviewExperienceQuestion(
                    id=q_id,
                    experience_id=experience_id,
                    question_text=q_text.strip(),
                    round_type=q_item.get("round_type", exp.round_type) if isinstance(q_item, dict) else (getattr(q_item, "round_type", None) or exp.round_type),
                    topic=q_item.get("topic", "General") if isinstance(q_item, dict) else (getattr(q_item, "topic", None) or "General"),
                    difficulty=q_item.get("difficulty", exp.difficulty) if isinstance(q_item, dict) else (getattr(q_item, "difficulty", None) or exp.difficulty)
                )
                db.add(question_record)

    db.commit()
    db.refresh(exp)
    logger.info(f"Experience {experience_id} updated by {user_id} and reset to PENDING.")
    return format_experience_dict(exp, current_user_id=user_id)


def delete_experience(
    db: Session,
    experience_id: str,
    user_id: str
) -> bool:
    """Deletes an interview experience. Enforces author ownership."""
    exp = db.query(InterviewExperience).filter(InterviewExperience.id == experience_id).first()
    if not exp:
        return False

    if str(exp.user_id) != str(user_id):
        raise PermissionError("You can only delete your own interview experiences.")

    db.delete(exp)
    db.commit()
    logger.info(f"Experience {experience_id} deleted by {user_id}.")

    try:
        from .ai.rag.retrieval_service import default_retrieval_service
        default_retrieval_service.refresh_dynamic_chunks()
    except Exception as e:
        logger.debug(f"Error refreshing RAG chunks: {e}")

    return True


def moderate_experience(
    db: Session,
    experience_id: str,
    payload: ExperienceModerateRequest
) -> Optional[Dict[str, Any]]:
    """Admin / Internal moderation action: APPROVED, REJECTED, PENDING."""
    exp = db.query(InterviewExperience).filter(InterviewExperience.id == experience_id).first()
    if not exp:
        return None

    valid_statuses = {"APPROVED", "REJECTED", "PENDING"}
    status = payload.status.upper().strip()
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of {valid_statuses}")

    exp.moderation_status = status
    if payload.notes:
        exp.moderation_notes = payload.notes.strip()
    exp.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(exp)
    logger.info(f"Experience {experience_id} moderated to {status}")

    try:
        from .ai.rag.retrieval_service import default_retrieval_service
        default_retrieval_service.refresh_dynamic_chunks()
    except Exception as e:
        logger.debug(f"Error refreshing RAG chunks: {e}")

    return format_experience_dict(exp)


def get_approved_questions(
    db: Session,
    role: Optional[str] = None,
    topic: Optional[str] = None,
    round_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Queries specifically approved questions extracted from real candidate experiences.
    """
    query = db.query(InterviewExperienceQuestion, InterviewExperience).join(
        InterviewExperience,
        InterviewExperienceQuestion.experience_id == InterviewExperience.id
    ).filter(
        InterviewExperience.moderation_status == "APPROVED"
    )

    if role:
        query = query.filter(InterviewExperience.role.ilike(f"%{role.strip()}%"))
    if round_type:
        query = query.filter(InterviewExperienceQuestion.round_type.ilike(round_type.strip()))
    if difficulty:
        query = query.filter(InterviewExperienceQuestion.difficulty.ilike(difficulty.strip()))
    if topic:
        query = query.filter(
            or_(
                InterviewExperienceQuestion.topic.ilike(f"%{topic.strip()}%"),
                InterviewExperience.topics_json.ilike(f"%{topic.strip()}%")
            )
        )
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InterviewExperienceQuestion.question_text.ilike(term),
                InterviewExperienceQuestion.topic.ilike(term),
                InterviewExperience.role.ilike(term)
            )
        )

    total_count = query.count()
    results = query.order_by(InterviewExperienceQuestion.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for q, exp in results:
        items.append({
            "id": q.id,
            "experience_id": q.experience_id,
            "question_text": q.question_text,
            "round_type": q.round_type,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "role": exp.role,
            "display_company": format_display_company(exp),
            "created_at": q.created_at
        })

    return {
        "total": total_count,
        "items": items,
        "limit": limit,
        "offset": offset
    }
