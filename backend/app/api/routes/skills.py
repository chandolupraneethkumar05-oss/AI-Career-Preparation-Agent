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

from typing import Dict, Any
from ...services.ai.llm.llm_service import get_skill_gap_llm_service


@router.get("/ai-analysis")
@router.post("/ai-analysis")
def generate_ai_skill_gap_analysis(
    user_id: str = Query("user-001", description="Candidate User ID"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates intelligent skill gap remediation & readiness roadmap
    powered by the dedicated SKILL_GAP_API_KEY LLM service.
    """
    profile = get_user_skill_profile(db, user_id=user_id)
    gaps_summary = [
        {
            "skill": g.skill_name,
            "demonstrated_score": g.demonstrated_score,
            "target_score": g.target_score,
            "gap": g.gap,
            "priority": g.priority,
            "role_importance": g.role_importance,
        }
        for g in profile.gaps[:6]
    ]

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
                "user_id": user_id,
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
        "user_id": user_id,
        "target_role": profile.target_role,
        "overall_readiness": profile.overall_readiness,
        "ai_analysis": fallback_analysis,
        "gaps": gaps_summary,
    }
