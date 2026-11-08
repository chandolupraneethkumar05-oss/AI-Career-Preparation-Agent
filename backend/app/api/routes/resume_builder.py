"""
Resume Builder API Endpoints
AI Career Preparation Agent - Phase 3

Provides authenticated endpoints for:
- Deterministic template catalog
- Isolated CRUD draft management
- Plaintext compilation adhering to Zero-Fabrication Rule
"""

from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, status, Query, Body, HTTPException
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.resume_builder import (
    ResumeDraftCreate,
    ResumeDraftUpdate,
    ResumeDraftResponse,
    ResumeDraftListItem,
    TemplateInfoResponse,
    ResumeContentSchema
)
from ...services.resume_builder_service import resume_builder_service
from ..deps import get_current_user

router = APIRouter(prefix="/resume-builder", tags=["Resume Builder"])


@router.get("/templates", response_model=List[TemplateInfoResponse])
def get_templates():
    """
    Returns available resume template designs, typography profiles,
    descriptions, and allowed accent color swatches.
    """
    return resume_builder_service.get_templates()


@router.get("/drafts", response_model=List[ResumeDraftListItem])
def list_drafts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all resume drafts belonging to the authenticated student,
    ordered chronologically by latest modification date.
    Tenant isolation guarantees students only see their own drafts.
    """
    return resume_builder_service.list_drafts(db=db, user_id=current_user.id)


@router.post("/drafts", response_model=ResumeDraftResponse, status_code=status.HTTP_201_CREATED)
def create_draft(
    draft_in: ResumeDraftCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new structured resume draft assigned to the authenticated student.
    Stores complete section data and template configurations in SQLite.
    """
    draft = resume_builder_service.create_draft(
        db=db,
        user_id=current_user.id,
        draft_in=draft_in
    )
    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "title": draft.title,
        "target_role": draft.target_role,
        "template_id": draft.template_id,
        "accent_color": draft.accent_color,
        "content": draft.content,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at
    }


@router.get("/drafts/{draft_id}", response_model=ResumeDraftResponse)
def get_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details and structured sections of a candidate's resume draft.
    Enforces student ownership: returns HTTP 403 if belonging to another user.
    """
    draft = resume_builder_service.get_draft(
        db=db,
        draft_id=draft_id,
        user_id=current_user.id
    )
    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "title": draft.title,
        "target_role": draft.target_role,
        "template_id": draft.template_id,
        "accent_color": draft.accent_color,
        "content": draft.content,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at
    }


@router.put("/drafts/{draft_id}", response_model=ResumeDraftResponse)
def update_draft(
    draft_id: str,
    draft_in: ResumeDraftUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates an existing resume draft.
    Validates ownership (HTTP 403 if draft belongs to someone else).
    """
    draft = resume_builder_service.update_draft(
        db=db,
        draft_id=draft_id,
        user_id=current_user.id,
        draft_in=draft_in
    )
    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "title": draft.title,
        "target_role": draft.target_role,
        "template_id": draft.template_id,
        "accent_color": draft.accent_color,
        "content": draft.content,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at
    }


@router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a resume draft.
    Validates ownership (HTTP 403 if draft belongs to someone else).
    """
    resume_builder_service.delete_draft(
        db=db,
        draft_id=draft_id,
        user_id=current_user.id
    )
    return None


@router.post("/drafts/{draft_id}/compile-text")
def compile_draft_text(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compiles an existing saved draft into clean, ATS-compliant plaintext.
    Follows the Zero-Fabrication Rule: empty sections/fields are omitted.
    """
    draft = resume_builder_service.get_draft(
        db=db,
        draft_id=draft_id,
        user_id=current_user.id
    )
    compiled = resume_builder_service.compile_draft_to_plain_text(
        content=draft.content,
        title=draft.title,
        target_role=draft.target_role
    )
    return {
        "success": True,
        "draft_id": draft.id,
        "title": draft.title,
        "target_role": draft.target_role,
        "text": compiled,
        "plain_text": compiled,
        "word_count": len(compiled.split()),
        "char_count": len(compiled)
    }


@router.post("/compile-text")
def compile_raw_text(
    content: Dict[str, Any] = Body(...),
    target_role: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Compiles arbitrary structured resume content into ATS-compliant plaintext
    without requiring draft persistence first.
    Enforces maximum payload size and recursive schema constraints.
    """
    import json
    raw = json.dumps(content)
    if len(raw.encode("utf-8")) > 500_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume content payload exceeds maximum allowed size of 500KB"
        )
    try:
        validated = ResumeContentSchema.model_validate(content)
        content_dict = validated.model_dump()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid resume content structure: {str(exc)}"
        )

    compiled = resume_builder_service.compile_draft_to_plain_text(
        content=content_dict,
        target_role=target_role or ""
    )
    return {
        "success": True,
        "text": compiled,
        "plain_text": compiled,
        "word_count": len(compiled.split()),
        "char_count": len(compiled)
    }
