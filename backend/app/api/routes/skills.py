"""
Skills & Competency Gap Routes
AI Career Preparation Agent
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.skill import SkillResponse, SkillGapCreate, SkillGapResponse, SkillProfileResponse
from ...services.skill_service import get_all_skills, get_user_skill_profile, upsert_skill_gap

router = APIRouter(prefix="/skills", tags=["Skills & Radar Analysis"])


@router.get("", response_model=List[SkillResponse])
def list_taxonomy(db: Session = Depends(get_db)):
    """Retrieves all registered skills in the career taxonomy."""
    skills = get_all_skills(db)
    return [SkillResponse.model_validate(s) for s in skills]


@router.get("/profile", response_model=SkillProfileResponse)
def get_candidate_skill_profile(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Calculates candidate 6-axis competency radar and prioritized skill gaps."""
    return get_user_skill_profile(db, user_id=user_id)


@router.get("/unified-profile", response_model=SkillProfileResponse)
def get_candidate_unified_skill_profile(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Retrieves full unified multi-source skill profile with evidence breakdown."""
    return get_user_skill_profile(db, user_id=user_id)


@router.post("/gap", response_model=SkillGapResponse)
def update_skill_gap(
    gap_in: SkillGapCreate,
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
):
    """Inserts or updates a candidate's skill gap score."""
    gap = upsert_skill_gap(db, user_id=user_id, data=gap_in)
    return SkillGapResponse.model_validate(gap)
