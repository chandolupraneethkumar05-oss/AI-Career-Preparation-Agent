"""
Skill & Competency Gap Service
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
Department of AIML (MLOPS)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..db.models import Skill, SkillGap, SkillEvidence, User
from ..schemas.skill import (
    SkillGapCreate,
    SkillGapResponse,
    RadarAxisScore,
    SkillProfileResponse,
    UnifiedSkillItem,
    UnifiedSkillProfileResponse
)
from .skill_taxonomy import normalize_skill, ROLE_REQUIREMENTS, get_canonical_role


def utc_now():
    return datetime.now(timezone.utc)


DEFAULT_RADAR_AXES = [
    ("Technical Knowledge", 75),
    ("Problem Solving", 70),
    ("Communication (STAR)", 65),
    ("Confidence & Delivery", 68),
    ("System Design", 72),
    ("MLOps & Deployment", 60)
]

RADAR_MAPPINGS = {
    "Technical Knowledge": ["machine learning", "deep learning", "python", "pytorch", "scikit-learn", "tensorflow", "statistics"],
    "Problem Solving": ["data structures & algorithms", "feature engineering", "problem solving", "sql", "algorithms"],
    "Communication (STAR)": ["communication", "communication (star)", "star framework", "clarity", "behavioral"],
    "Confidence & Delivery": ["confidence", "delivery", "articulation", "confidence & delivery"],
    "System Design": ["system design", "microservices", "distributed systems", "rest api"],
    "MLOps & Deployment": ["mlops", "docker", "model deployment", "kubernetes", "ci/cd", "mlflow", "model monitoring", "dvc"]
}


def get_all_skills(db: Session) -> List[Skill]:
    """Retrieves all registered skills in the career taxonomy."""
    return db.query(Skill).all()


def record_skill_evidence(
    db: Session,
    user_id: str,
    skill_name: str,
    source_type: str,
    source_id: Optional[str] = None,
    score: int = 70,
    evidence_text: Optional[str] = None,
    confidence: str = "medium"
) -> SkillEvidence:
    """
    Records a granular skill evidence entry from an ATS resume scan or mock interview answer.
    Normalizes the skill name to canonical form before persisting.
    """
    canonical_skill = normalize_skill(skill_name)
    clamped_score = max(0, min(100, int(score)))

    evidence = SkillEvidence(
        user_id=user_id,
        skill_name=canonical_skill,
        source_type=source_type,
        source_id=source_id,
        score=clamped_score,
        evidence_text=evidence_text,
        confidence=confidence,
        created_at=utc_now()
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


def aggregate_user_skill_evidence(
    db: Session,
    user_id: str,
    target_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    Aggregates all multi-source skill evidences (ATS resume + mock interview answers)
    for a candidate, calculates demonstrated scores, tracks confidence and progression
    trends, detects repeated weaknesses, and calibrates against target role benchmarks.
    """
    user = db.query(User).filter(User.id == user_id).first()
    effective_role = target_role or (user.target_role if user and user.target_role else "Machine Learning Engineer")
    canonical_role = get_canonical_role(effective_role)
    role_reqs = ROLE_REQUIREMENTS.get(canonical_role, ROLE_REQUIREMENTS.get("Machine Learning Engineer", {}))
    core_skills = set(role_reqs.get("core_skills", []))
    important_skills = set(role_reqs.get("important_skills", []))
    optional_skills = set(role_reqs.get("optional_skills", []))

    # Query all evidence records for this candidate strictly isolated by user_id
    evidences = (
        db.query(SkillEvidence)
        .filter(SkillEvidence.user_id == user_id)
        .order_by(SkillEvidence.created_at.asc())
        .all()
    )

    skill_groups: Dict[str, List[SkillEvidence]] = {}
    for ev in evidences:
        c_name = normalize_skill(ev.skill_name)
        if c_name not in skill_groups:
            skill_groups[c_name] = []
        skill_groups[c_name].append(ev)

    all_tracked_skills = set(skill_groups.keys()) | core_skills | important_skills

    unified_items: List[UnifiedSkillItem] = []

    for s_name in all_tracked_skills:
        s_evs = skill_groups.get(s_name, [])
        resume_evs = [e for e in s_evs if e.source_type == "resume"]
        interview_evs = [e for e in s_evs if e.source_type == "interview"]
        challenge_evs = [e for e in s_evs if e.source_type in ["challenge", "skill_arena"]]

        # Resume score & presence (grounded in latest resume audit)
        resume_score = None
        resume_present = False
        if resume_evs:
            resume_score = resume_evs[-1].score
            resume_present = resume_score >= 50

        # Interview score
        interview_score = None
        if interview_evs:
            interview_score = int(round(sum(e.score for e in interview_evs) / len(interview_evs)))

        # Challenge score
        challenge_score = None
        challenge_count = len(challenge_evs)
        if challenge_evs:
            challenge_score = int(round(sum(e.score for e in challenge_evs) / len(challenge_evs)))

        # Multi-Source Demonstrated Score Fusion:
        # 1. Interview + Challenge + Resume: 60% interview + 25% challenge + 15% resume
        # 2. Interview + Challenge: 70% interview + 30% challenge
        # 3. Interview + Resume: 75% interview + 25% resume
        # 4. Challenge + Resume: 70% challenge + 30% resume
        # 5. Interview only: 100% interview
        # 6. Challenge only: 100% challenge
        # 7. Resume only: 100% resume
        if interview_score is not None and challenge_score is not None and resume_score is not None:
            demonstrated_score = int(round(interview_score * 0.60 + challenge_score * 0.25 + resume_score * 0.15))
        elif interview_score is not None and challenge_score is not None:
            demonstrated_score = int(round(interview_score * 0.70 + challenge_score * 0.30))
        elif interview_score is not None and resume_score is not None:
            demonstrated_score = int(round(interview_score * 0.75 + resume_score * 0.25))
        elif challenge_score is not None and resume_score is not None:
            demonstrated_score = int(round(challenge_score * 0.70 + resume_score * 0.30))
        elif interview_score is not None:
            demonstrated_score = interview_score
        elif challenge_score is not None:
            demonstrated_score = challenge_score
        elif resume_score is not None:
            demonstrated_score = resume_score
        else:
            demonstrated_score = 0

        # Confidence: based on quantity of evidence
        total_ev_count = len(s_evs)
        if total_ev_count == 0:
            confidence = "None"
        elif total_ev_count == 1:
            confidence = "Low"
        elif total_ev_count in [2, 3]:
            confidence = "Medium"
        else:
            confidence = "High"

        # Progression Trend: Include interview, daily challenge, and skill arena demonstrations chronologically
        interactive_evs = sorted([e for e in s_evs if e.source_type in ["interview", "challenge", "skill_arena"]], key=lambda x: x.created_at)
        if len(interactive_evs) >= 2:
            earliest_score = interactive_evs[0].score
            latest_score = interactive_evs[-1].score
            delta = latest_score - earliest_score
            if delta >= 8:
                trend = "improving"
            elif delta <= -8:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Repeated Weakness: Flag if candidate scored < 60 in >= 2 interview evaluations
        weak_count = sum(1 for e in interview_evs if e.score < 60)
        repeated_weakness = weak_count >= 2

        # Role Calibration & Target Benchmarks
        if s_name in core_skills:
            role_importance = "Core"
            target_score = 85
        elif s_name in important_skills:
            role_importance = "Important"
            target_score = 80
        elif s_name in optional_skills:
            role_importance = "Optional"
            target_score = 70
        else:
            role_importance = "General"
            target_score = 75

        # Gap calculation
        gap = max(0, target_score - demonstrated_score) if total_ev_count > 0 else (target_score if s_name in (core_skills | important_skills) else 0)

        # Priority determination:
        # High: repeated weakness, core skill with gap >= 25, or demonstrated score < 55 for core/important
        # Medium: important skill with gap >= 15, core skill with gap 10-24, or general gap >= 20
        # Low: score >= 80, gap < 10, or optional skill
        if demonstrated_score >= 80 and not repeated_weakness:
            priority = "low"
        elif repeated_weakness:
            priority = "high"
            if confidence == "Low":
                confidence = "Medium"
        elif role_importance == "Core" and gap >= 25:
            priority = "high"
        elif demonstrated_score < 55 and role_importance in ["Core", "Important"] and total_ev_count > 0:
            priority = "high"
        elif role_importance in ["Core", "Important"] and gap >= 15:
            priority = "medium"
        elif gap >= 20:
            priority = "medium"
        elif gap < 10 or role_importance == "Optional":
            priority = "low"
        else:
            priority = "medium"

        # Status determination: NEW, IN_PROGRESS, IMPROVING, COMPLETED, MASTERED
        demonstrations_count = len(interview_evs) + len(challenge_evs)
        if demonstrations_count == 0:
            status = "NEW"
        elif demonstrated_score >= 85 and demonstrations_count >= 3 and not repeated_weakness:
            status = "MASTERED"
        elif demonstrated_score >= (target_score - 5) and confidence in ["Medium", "High"]:
            status = "COMPLETED"
        elif trend == "improving" and demonstrations_count >= 2:
            status = "IMPROVING"
        else:
            status = "IN_PROGRESS"

        category = "Core" if role_importance == "Core" else ("Important" if role_importance == "Important" else "Technical")
        latest_feedback = s_evs[-1].evidence_text if s_evs else None

        item = UnifiedSkillItem(
            skill_name=s_name,
            category=category,
            target_role=canonical_role,
            role_importance=role_importance,
            demonstrated_score=demonstrated_score,
            target_score=target_score,
            gap=gap,
            priority=priority,
            confidence=confidence,
            trend=trend,
            repeated_weakness=repeated_weakness,
            resume_present=resume_present,
            resume_score=resume_score,
            interview_score=interview_score,
            challenge_score=challenge_score,
            challenge_count=challenge_count,
            status=status,
            evidence_count=total_ev_count,
            latest_feedback=latest_feedback
        )
        unified_items.append(item)

    # Sort unified items: high priority first, demonstrated gaps (evidence_count > 0) before untested, then largest gap descending
    priority_order = {"high": 0, "medium": 1, "low": 2}
    unified_items.sort(
        key=lambda x: (
            priority_order.get(x.priority, 1),
            0 if x.evidence_count > 0 else 1,
            -x.gap,
            -x.demonstrated_score
        )
    )

    # Top skill gaps
    top_skill_gaps = [
        item for item in unified_items
        if item.gap > 0 and item.priority in ["high", "medium"]
    ][:3]
    if len(top_skill_gaps) < 3:
        extra = [item for item in unified_items if item.gap > 0 and item not in top_skill_gaps]
        top_skill_gaps.extend(extra[: 3 - len(top_skill_gaps)])

    strong_skills = [item.skill_name for item in unified_items if item.demonstrated_score >= 80 and item.evidence_count > 0]
    critical_gaps = [item.skill_name for item in unified_items if item.priority == "high"]

    # Calculate overall readiness
    tested_items = [item for item in unified_items if item.evidence_count > 0]
    if tested_items:
        overall_readiness = int(round(sum(item.demonstrated_score for item in tested_items) / len(tested_items)))
    else:
        overall_readiness = 0

    return {
        "overall_readiness": overall_readiness,
        "target_role": canonical_role,
        "unified_skills": unified_items,
        "top_skill_gaps": top_skill_gaps,
        "strong_skills": strong_skills,
        "critical_gaps": critical_gaps,
        "evidence_summary": {
            "total_evidences": len(evidences),
            "resume_evidences": sum(1 for e in evidences if e.source_type == "resume"),
            "interview_evidences": sum(1 for e in evidences if e.source_type == "interview"),
            "unique_skills_tracked": len(skill_groups)
        }
    }


def sync_unified_skill_profile(db: Session, user_id: str, target_role: Optional[str] = None) -> List[SkillGap]:
    """
    Calculates the unified skill aggregation and updates/syncs the SkillGap table.
    Ensures that downstream systems (Next-Best-Action, Daily Challenge) query current,
    calibrated multi-source gaps.
    """
    agg = aggregate_user_skill_evidence(db, user_id, target_role)
    now = utc_now()
    synced_gaps = []

    for item in agg["unified_skills"]:
        # Only sync skills that have evidence or are critical role gaps
        if item.evidence_count == 0 and item.role_importance not in ["Core", "Important"]:
            continue

        existing = (
            db.query(SkillGap)
            .filter(SkillGap.user_id == user_id, SkillGap.skill_name == item.skill_name)
            .first()
        )
        if existing:
            existing.current_score = item.demonstrated_score
            existing.target_score = item.target_score
            existing.priority = item.priority.lower()
            existing.category = item.category
            existing.source = "unified" if item.evidence_count > 1 else ("interview" if item.interview_score is not None else "ats")
            existing.updated_at = now
            synced_gaps.append(existing)
        else:
            new_gap = SkillGap(
                user_id=user_id,
                skill_name=item.skill_name,
                category=item.category,
                current_score=item.demonstrated_score,
                target_score=item.target_score,
                priority=item.priority.lower(),
                source="unified" if item.evidence_count > 1 else ("interview" if item.interview_score is not None else "ats"),
                updated_at=now
            )
            db.add(new_gap)
            synced_gaps.append(new_gap)

    db.commit()
    return synced_gaps


def get_user_skill_profile(db: Session, user_id: str, target_role: Optional[str] = None) -> SkillProfileResponse:
    """
    Computes candidate's calibrated 6-axis competency radar, unified skill metrics,
    and prioritized skill gaps.
    """
    # Sync first to ensure SkillGap table is up to date with all evidences
    sync_unified_skill_profile(db, user_id, target_role=target_role)

    agg = aggregate_user_skill_evidence(db, user_id, target_role=target_role)
    unified_items = agg["unified_skills"]
    skill_map = {item.skill_name.lower(): item.demonstrated_score for item in unified_items if item.evidence_count > 0}

    # Construct dynamic radar data based on real evaluated skills
    radar_data = []
    has_any_data = len(skill_map) > 0

    for axis_name, fallback_score in DEFAULT_RADAR_AXES:
        match_keys = RADAR_MAPPINGS.get(axis_name, [axis_name.lower()])
        matching_scores = [skill_map[k] for k in match_keys if k in skill_map]

        if matching_scores:
            axis_score = int(round(sum(matching_scores) / len(matching_scores)))
        elif not has_any_data:
            # If candidate has 0 interviews and 0 resume scans, reflect honest 0 unrated state
            axis_score = 0
        else:
            axis_score = fallback_score

        radar_data.append(RadarAxisScore(subject=axis_name, score=axis_score))

    # Query synced SkillGap rows
    gaps = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == user_id)
        .all()
    )

    gap_responses = [SkillGapResponse.model_validate(g) for g in gaps]

    return SkillProfileResponse(
        radar_data=radar_data,
        skill_gaps=gap_responses,
        strong_skills=agg["strong_skills"],
        critical_gaps=agg["critical_gaps"],
        overall_readiness=agg["overall_readiness"],
        target_role=agg["target_role"],
        unified_skills=agg["unified_skills"],
        top_skill_gaps=agg["top_skill_gaps"],
        evidence_summary=agg["evidence_summary"]
    )


def upsert_skill_gap(db: Session, user_id: str, data: SkillGapCreate) -> SkillGap:
    """Inserts or updates a candidate's skill gap score and logs evidence."""
    canonical_skill = normalize_skill(data.skill_name)
    now = utc_now()
    priority = data.priority or ("high" if data.current_score < 70 else "medium")

    # Record evidence entry for auditing
    evidence = SkillEvidence(
        user_id=user_id,
        skill_name=canonical_skill,
        source_type=data.source or "ats",
        source_id="manual_upsert",
        score=data.current_score,
        evidence_text=f"Upserted via {data.source or 'ats'}",
        confidence="medium",
        created_at=now
    )
    db.add(evidence)

    existing = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == user_id)
        .filter(SkillGap.skill_name == canonical_skill)
        .first()
    )

    if existing:
        existing.current_score = data.current_score
        existing.target_score = data.target_score
        existing.priority = priority
        existing.source = data.source
        existing.updated_at = now
        gap = existing
    else:
        gap = SkillGap(
            user_id=user_id,
            skill_name=canonical_skill,
            category=data.category or "Core",
            current_score=data.current_score,
            target_score=data.target_score,
            priority=priority,
            source=data.source,
            updated_at=now
        )
        db.add(gap)

    db.commit()
    db.refresh(gap)
    return gap
