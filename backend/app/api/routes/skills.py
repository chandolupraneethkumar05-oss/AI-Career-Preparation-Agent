import json
"""
Skills & Competency Gap Routes
AI Career Preparation Agent
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ...schemas.skill import (
    SkillResponse,
    SkillGapCreate,
    SkillGapResponse,
    SkillProfileResponse,
    SkillPrimerResponse,
    SkillPrimerVerifyRequest,
    SkillPrimerVerifyResponse,
)
from ...services.skill_service import get_all_skills, get_user_skill_profile, upsert_skill_gap
from ...services.primer_service import get_skill_primer, verify_primer_quiz
from ...services.ai.llm.llm_service import get_skill_gap_llm_service
from ..deps import get_current_user, verify_user_ownership

router = APIRouter(prefix="/skills", tags=["Skills & Radar Analysis"])


@router.get("", response_model=List[SkillResponse])
def list_taxonomy(db: Session = Depends(get_db)):
    """Retrieves all registered skills in the career taxonomy."""
    skills = get_all_skills(db)
    return [SkillResponse.model_validate(s) for s in skills]


@router.get("/profile", response_model=SkillProfileResponse)
def get_candidate_skill_profile(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates candidate 6-axis competency radar and prioritized skill gaps."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    return get_user_skill_profile(db, user_id=effective_user_id)


@router.get("/unified-profile", response_model=SkillProfileResponse)
def get_candidate_unified_skill_profile(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves full unified multi-source skill profile with evidence breakdown."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    return get_user_skill_profile(db, user_id=effective_user_id)


@router.post("/gap", response_model=SkillGapResponse)
def update_skill_gap(
    gap_in: SkillGapCreate,
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Inserts or updates a candidate's skill gap score."""
    effective_user_id = verify_user_ownership(user_id, current_user)
    gap = upsert_skill_gap(db, user_id=effective_user_id, data=gap_in)
    return SkillGapResponse.model_validate(gap)


@router.get("/ai-analysis")
@router.post("/ai-analysis")
def generate_ai_skill_gap_analysis(
    user_id: Optional[str] = Query(None, description="Candidate User ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates intelligent skill gap remediation & readiness roadmap
    powered by the dedicated SKILL_GAP_API_KEY LLM service.
    """
    effective_user_id = verify_user_ownership(user_id, current_user)
    profile = get_user_skill_profile(db, user_id=effective_user_id)
    raw_gaps = getattr(profile, "top_skill_gaps", None) or getattr(profile, "skill_gaps", []) or []
    gaps_summary = []
    for g in raw_gaps[:6]:
        gaps_summary.append({
            "skill": getattr(g, "skill_name", "Skill"),
            "demonstrated_score": getattr(g, "demonstrated_score", getattr(g, "current_score", 60)),
            "target_score": getattr(g, "target_score", 80),
            "gap": getattr(g, "gap", max(0, getattr(g, "target_score", 80) - getattr(g, "current_score", 60))),
            "priority": getattr(g, "priority", "medium"),
            "role_importance": getattr(g, "role_importance", getattr(g, "category", "Core")),
        })

    llm = get_skill_gap_llm_service()
    prompt = f"""You are a Silicon Valley engineering talent partner analyzing a candidate's skill gaps.
Target Role: {profile.target_role}
Overall Readiness Score: {profile.overall_readiness}%
Identified Skill Gaps:
{json.dumps(gaps_summary, indent=2)}

Provide an executive skill gap analysis and remediation plan. Return STRICTLY JSON with the schema:
{{
  "verdict": "2-sentence executive summary of readiness",
  "readiness_tier": "Job Ready | Near Ready | Foundation Needed",
  "priority_focus": ["top 3 areas needing immediate focus"],
  "remediation_roadmap": [
    {{
      "skill": "skill name",
      "target_milestone": "concrete learning milestone",
      "recommended_action": "specific practical project or coding drill"
    }}
  ],
  "estimated_weeks_to_ready": 3
}}
"""
    system_instruction = "You are a Principal Engineering Coach guiding high-impact technical remediation."
    
    try:
        raw = llm.generate(prompt=prompt, system_instruction=system_instruction, temperature=0.2)
        if raw and "{" in raw and "}" in raw:
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            ai_data = json.loads(cleaned.strip())
            return {
                "user_id": effective_user_id,
                "target_role": profile.target_role,
                "overall_readiness": profile.overall_readiness,
                "ai_analysis": ai_data,
                "gaps": gaps_summary,
            }
    except Exception:
        pass

    # High-reliability fallback
    fallback_analysis = {
        "verdict": f"Candidate demonstrates {profile.overall_readiness}% alignment for {profile.target_role}. Key focus needed on high-priority technical competencies.",
        "readiness_tier": "Near Ready" if profile.overall_readiness >= 70 else "Foundation Needed",
        "priority_focus": [g["skill"] for g in gaps_summary[:3]] or ["System Design", "Core Data Structures"],
        "remediation_roadmap": [
            {
                "skill": g["skill"],
                "target_milestone": f"Elevate score from {g['demonstrated_score']}% to {g['target_score']}%",
                "recommended_action": f"Practice real-world coding drills and scenario interviews for {g['skill']}."
            }
            for g in gaps_summary[:3]
        ],
        "estimated_weeks_to_ready": 4 if profile.overall_readiness < 60 else 2
    }
    return {
        "user_id": effective_user_id,
        "target_role": profile.target_role,
        "overall_readiness": profile.overall_readiness,
        "ai_analysis": fallback_analysis,
        "gaps": gaps_summary,
    }


@router.get("/primer/{skill_name}", response_model=SkillPrimerResponse)
def get_primer_endpoint(
    skill_name: str,
    target_role: Optional[str] = Query("Software Engineer"),
    difficulty: Optional[str] = Query("Beginner")
):
    """
    Returns a grounded 3-minute JIT concept primer and 2 verification questions
    for a foundational skill deficit.
    """
    return get_skill_primer(skill_name, target_role=target_role, difficulty=difficulty)


@router.post("/primer/{skill_name}/verify", response_model=SkillPrimerVerifyResponse)
def verify_primer_endpoint(
    skill_name: str,
    request: SkillPrimerVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates the 2-question primer quiz.
    Upon passing, creates verified skill evidence, awards +35 XP, and updates closed-loop Next-Best-Action.
    """
    effective_user_id = verify_user_ownership(request.user_id, current_user)
    return verify_primer_quiz(
        db=db,
        user_id=effective_user_id,
        skill_name=skill_name,
        answers=request.answers
    )
