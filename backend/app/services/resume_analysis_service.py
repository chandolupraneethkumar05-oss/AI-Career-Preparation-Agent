"""
Resume ATS Analysis & Scoring Engine
Coordinates text extraction, section parsing, canonical skill extraction,
deterministic rubric-based ATS scoring, grounded strengths/weaknesses synthesis,
and Skill Gap synchronization.

AI Career Preparation Agent
"""

import re
import uuid
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import User, ResumeAnalysis, SkillGap, Activity, Recommendation
from ..schemas.resume import (
    ResumeAnalysisResponse,
    ResumeScoreBreakdownItem,
    ResumeHistoryResponse
)
from ..schemas.skill import SkillGapCreate
from ..schemas.activity import ActivityCreate
from .resume_extractor import extract_resume_text, ResumeExtractionError
from .skill_taxonomy import (
    default_skill_extractor,
    ROLE_REQUIREMENTS,
    ROLE_ALIASES,
    get_canonical_role,
    normalize_skill
)
from .ai.llm.llm_service import get_llm_service, get_resume_llm_service
from .skill_service import upsert_skill_gap, sync_unified_skill_profile
from .activity_service import record_activity
from .recommendation_service import evaluate_next_best_action

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


SECTION_PATTERNS: Dict[str, List[re.Pattern]] = {
    "Experience": [
        re.compile(r"\b(?:work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history|internships?)\b", re.IGNORECASE)
    ],
    "Education": [
        re.compile(r"\b(?:education|academic\s+background|qualifications|degrees?|university|college)\b", re.IGNORECASE)
    ],
    "Skills": [
        re.compile(r"\b(?:technical\s+skills|skills\s+and\s+competencies|technologies|proficiencies|core\s+competencies|tech\s+stack|skills)\b", re.IGNORECASE)
    ],
    "Projects": [
        re.compile(r"\b(?:projects|academic\s+projects|personal\s+projects|key\s+initiatives|portfolio|technical\s+projects)\b", re.IGNORECASE)
    ],
    "Certifications": [
        re.compile(r"\b(?:certifications?|certificates?|licenses?|credentials|accreditations?)\b", re.IGNORECASE)
    ],
    "Summary / Objective": [
        re.compile(r"\b(?:professional\s+summary|career\s+objective|summary|objective|about\s+me|profile)\b", re.IGNORECASE)
    ],
    "Achievements": [
        re.compile(r"\b(?:achievements?|honors?|awards?|accomplishments?|publications?)\b", re.IGNORECASE)
    ]
}

IMPACT_ACTION_VERBS = re.compile(
    r"\b(?:accelerated|achieved|amplified|boosted|built|created|cut|decreased|delivered|"
    r"deployed|developed|engineered|enhanced|expanded|generated|grew|implemented|improved|"
    r"increased|launched|lowered|maximized|minimized|optimized|outperformed|produced|"
    r"reduced|resolved|restructured|saved|scaled|spearheaded|streamlined|surpassed|transformed)\b",
    re.IGNORECASE
)

QUANTIFIABLE_METRIC_PATTERN = re.compile(
    r"(?:"
    r"\b\d+(?:\.\d+)?%\b"                                         # percentages (e.g. 25%, 99.9%)
    r"|[$€£¥]\s*\d+(?:[.,]\d+)?\s*(?:[kKmMbBtT]|thousand|million|billion)?"  # currency ($50k, €1.2M)
    r"|\b\d+(?:[.,]\d+)?\s*(?:[kKmMbBtT]|thousand|million|billion)\b"         # counts with units (100k, 2M)
    r"|\b\d+(?:\.\d+)?x\b"                                         # multipliers (e.g. 10x, 2.5x)
    r"|\b(?:reduced|increased|improved|decreased|cut|by)\s+\d+"      # change amounts
    r"|\b\d+\s*(?:ms|sec|seconds?|mins?|minutes?|hrs?|hours?|days?|users?|clients?|customers?|req/s|rps|tps|qps)\b"
    r"|\b\d+\b"                                                     # numeric counts
    r")",
    re.IGNORECASE
)


def _quantified_impact_lines(text: str) -> List[str]:
    """
    Return resume lines that contain both an impact/action verb and
    a quantifiable metric (percentage, currency, multiplier, or count).
    """
    impact_lines: List[str] = []
    lines = text.splitlines()

    for line in lines:
        cleaned = line.strip()
        if len(cleaned) < 10:
            continue
        # Check both an action/impact verb and a quantifiable metric
        if IMPACT_ACTION_VERBS.search(cleaned) and QUANTIFIABLE_METRIC_PATTERN.search(cleaned):
            impact_lines.append(cleaned)

    return impact_lines


def detect_sections(text: str) -> List[str]:
    """
    Detects which standard resume sections are present in candidate resume text.
    Strictly checks plausible heading lines (short lines <= 45 chars).
    Never scans full body text as a fallback to avoid false positive triggers.
    """
    detected: List[str] = []
    lines = text.splitlines()

    heading_candidates: List[str] = []
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        # Strip common markdown/bullet characters: #, *, -, •, >
        cleaned = re.sub(r"^[\#\*\-\•\>\s]+", "", cleaned).strip()
        # Strip trailing colons or hyphens on headings
        cleaned = re.sub(r"[\:\-]+$", "", cleaned).strip()
        if 0 < len(cleaned) <= 45:
            heading_candidates.append(cleaned)

    for section_name, patterns in SECTION_PATTERNS.items():
        found = False
        for candidate in heading_candidates:
            for pattern in patterns:
                if pattern.search(candidate):
                    found = True
                    break
            if found:
                break
        if found:
            detected.append(section_name)

    return detected


def calculate_ats_score(
    text: str,
    target_role: str,
    extracted_skills: List[str],
    core_skills: List[str],
    important_skills: List[str],
    detected_sections: List[str],
    job_description: Optional[str] = None,
    is_role_available: bool = True
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Computes an explainable, deterministic 100-point ATS rubric estimate.
    The rubric components:
      1. Role/Job Skill Match: max 60 points
      2. Quantified Impact Evidence: max 20 points
      3. Document Section Completeness: max 20 points
    Total score = sum(breakdown items) <= 100.
    """
    # 1. Skill Match (Max 60 points)
    has_jd = bool(job_description and job_description.strip())
    if has_jd:
        jd_skills = default_skill_extractor.extract_skills(job_description)
        if jd_skills:
            matched_jd = [s for s in jd_skills if s in extracted_skills]
            skill_score = min(60, round(60 * len(matched_jd) / len(jd_skills)))
        else:
            skill_score = 0
    elif is_role_available:
        matched_core = [s for s in core_skills if s in extracted_skills]
        matched_important = [s for s in important_skills if s in extracted_skills]
        core_ratio = len(matched_core) / max(1, len(core_skills))
        important_ratio = len(matched_important) / max(1, len(important_skills))
        skill_score = min(60, round((core_ratio * 40) + (important_ratio * 20)))
    else:
        skill_score = 0

    # 2. Quantified Impact Evidence (Max 20 points)
    impact_lines = _quantified_impact_lines(text)
    impact_score = min(20, len(impact_lines) * 5)

    # 3. Resume Section Completeness (Max 20 points)
    sec_score = 0
    if "Experience" in detected_sections:
        sec_score += 6
    if "Education" in detected_sections:
        sec_score += 5
    if "Skills" in detected_sections:
        sec_score += 5
    if "Projects" in detected_sections:
        sec_score += 4
    completeness_score = min(20, sec_score)

    total_score = skill_score + impact_score + completeness_score
    total_score = max(0, min(100, total_score))

    breakdown = [
        {
            "label": "Role/Job Skill Match",
            "score": skill_score,
            "max": 60,
            "percentage": round((skill_score / 60) * 100),
            "status": "Strong" if skill_score >= 45 else ("Good" if skill_score >= 30 else "Needs Improvement")
        },
        {
            "label": "Quantified Impact Evidence",
            "score": impact_score,
            "max": 20,
            "percentage": round((impact_score / 20) * 100),
            "status": "Strong" if impact_score >= 15 else ("Good" if impact_score >= 10 else "Needs Improvement")
        },
        {
            "label": "Document Section Completeness",
            "score": completeness_score,
            "max": 20,
            "percentage": round((completeness_score / 20) * 100),
            "status": "Strong" if completeness_score >= 16 else ("Good" if completeness_score >= 11 else "Needs Improvement")
        }
    ]

    return total_score, breakdown


def generate_strengths_and_weaknesses(
    target_role: str,
    matched_skills: List[str],
    missing_skills: List[str],
    detected_sections: List[str],
    impact_lines: List[str],
    total_score: int,
    is_role_available: bool = True,
    job_description: Optional[str] = None
) -> Tuple[List[str], List[str]]:
    """
    Generates grounded, factual strengths and actionable improvement areas.
    Does not assume a candidate lacks a skill, only notes that it was not identified in the document.
    """
    strengths: List[str] = []
    weaknesses: List[str] = []

    # Strengths
    if matched_skills:
        top_matched = ", ".join(matched_skills[:4])
        strengths.append(f"Demonstrated technical skills identified in resume text: {top_matched}.")

    if impact_lines:
        strengths.append(f"Identified {len(impact_lines)} bullet point(s) containing quantifiable impact or measurable metrics.")

    if "Projects" in detected_sections:
        strengths.append("Dedicated technical projects section providing evidence of practical hands-on work.")

    if "Experience" in detected_sections:
        strengths.append("Professional experience section clearly structured.")

    if "Education" in detected_sections:
        strengths.append("Academic qualifications and educational background explicitly outlined.")

    if not strengths:
        strengths.append("Clean basic document structure identified, ready for technical skill expansion.")

    # Weaknesses / Improvement Areas
    if not is_role_available and not job_description:
        weaknesses.append(f"Target role '{target_role}' is not in the predefined taxonomy and no job description was provided to evaluate technical skill alignment.")

    if missing_skills:
        top_missing = ", ".join(missing_skills[:5])
        weaknesses.append(f"Expected technical skills not found in extracted resume text: {top_missing}.")

    if not impact_lines:
        weaknesses.append("No quantified impact metrics detected in bullet points. Consider adding measurable outcomes (e.g. percentages, scale, latency, or efficiency gains).")

    if "Projects" not in detected_sections:
        weaknesses.append("No dedicated Projects section identified. Adding practical projects provides evidence of hands-on technical implementation.")

    if "Experience" not in detected_sections:
        weaknesses.append("No dedicated Work / Professional Experience section detected.")

    if not weaknesses:
        weaknesses.append("Resume demonstrates alignment across all evaluated criteria without notable missing sections or baseline skill gaps.")

    return strengths, weaknesses


class ResumeAnalysisService:
    """
    Orchestrator for resume extraction, section detection, skill analysis,
    deterministic ATS scoring, SQLite persistence, and Skill Gap synchronization.
    """

    def analyze_resume_document(
        self,
        file_bytes: bytes,
        filename: str,
        target_role: Optional[str] = None,
        job_description: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> ResumeAnalysisResponse:
        """
        Executes complete genuine ATS analysis pipeline from file bytes.
        Requires authenticated user_id when db persistence is requested.
        """
        # 1. Validate User ID
        if db is not None:
            if not user_id or not user_id.strip():
                raise ValueError("A valid authenticated user_id is required when db session is provided.")
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                user = User(
                    id=user_id,
                    email=f"{user_id}@example.com",
                    name="Candidate",
                    target_role=target_role or "Software Engineer"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        else:
            user_id = user_id or "anonymous-user"

        # 2. Extract Document Text
        cleaned_text, detected_format = extract_resume_text(file_bytes, filename)

        # 3. Detect Resume Sections
        detected_sections = detect_sections(cleaned_text)

        # 4. Extract Skills using Canonical Taxonomy
        extracted_skills = default_skill_extractor.extract_skills(cleaned_text)

        # 5. Target Role Resolution (without silent Machine Learning Engineer override)
        has_job_description = bool(job_description and job_description.strip())
        raw_role = target_role.strip() if target_role and target_role.strip() else None

        canonical_role = raw_role or "Unspecified Role"
        is_role_available = False
        role_disclosure: Optional[str] = None

        if raw_role:
            if raw_role in ROLE_REQUIREMENTS:
                canonical_role = raw_role
                is_role_available = True
            elif raw_role.lower() in ROLE_ALIASES:
                canonical_role = ROLE_ALIASES[raw_role.lower()]
                is_role_available = True
            else:
                # Substring check against canonical keys
                raw_lower = raw_role.lower()
                for key in ROLE_REQUIREMENTS.keys():
                    if key.lower() in raw_lower or raw_lower in key.lower():
                        canonical_role = key
                        is_role_available = True
                        break
                if not is_role_available:
                    canonical_role = raw_role
                    role_disclosure = f"Target role '{raw_role}' is not in the predefined taxonomy"
        else:
            role_disclosure = "No target role was specified"

        # 6. Role / Job Requirements Alignment
        core_skills: List[str] = []
        important_skills: List[str] = []
        optional_skills: List[str] = []

        if has_job_description:
            jd_skills = default_skill_extractor.extract_skills(job_description)
            all_matched = sorted([s for s in jd_skills if s in extracted_skills])
            all_missing_important = sorted([s for s in jd_skills if s not in extracted_skills])
            missing_optional: List[str] = []
            matched_core = all_matched
            missing_core = all_missing_important
            matched_important: List[str] = []
            missing_important: List[str] = []
            score_basis = f"Scored against {len(jd_skills)} skills identified in the provided job description. Evaluative project rubric, not an official commercial ATS score."
            is_role_aligned = bool(jd_skills)
        elif is_role_available:
            reqs = ROLE_REQUIREMENTS[canonical_role]
            core_skills = reqs.get("core_skills", [])
            important_skills = reqs.get("important_skills", [])
            optional_skills = reqs.get("optional_skills", [])

            matched_core = [s for s in core_skills if s in extracted_skills]
            missing_core = [s for s in core_skills if s not in extracted_skills]
            matched_important = [s for s in important_skills if s in extracted_skills]
            missing_important = [s for s in important_skills if s not in extracted_skills]
            matched_optional = [s for s in optional_skills if s in extracted_skills]
            missing_optional = [s for s in optional_skills if s not in extracted_skills]

            all_matched = sorted(list(set(matched_core + matched_important + matched_optional)))
            all_missing_important = sorted(list(set(missing_core + missing_important)))
            score_basis = f"Scored against predefined canonical taxonomy for '{canonical_role}'. Evaluative project rubric, not an official commercial ATS score."
            is_role_aligned = True
        else:
            matched_core = []
            missing_core = []
            matched_important = []
            missing_important = []
            matched_optional = []
            missing_optional = []
            all_matched = extracted_skills
            all_missing_important = []
            score_basis = f"{role_disclosure} and no job description was provided. Skill match score is 0/60. Evaluative project rubric, not an official commercial ATS score."
            is_role_aligned = False

        # 7. Calculate Deterministic 100-Point ATS Rubric Score
        ats_score, breakdown_data = calculate_ats_score(
            text=cleaned_text,
            target_role=canonical_role,
            extracted_skills=extracted_skills,
            core_skills=core_skills,
            important_skills=important_skills,
            detected_sections=detected_sections,
            job_description=job_description if has_job_description else None,
            is_role_available=is_role_available
        )

        impact_lines = _quantified_impact_lines(cleaned_text)

        # 8. Generate Factual Strengths & Weaknesses
        strengths, weaknesses = generate_strengths_and_weaknesses(
            target_role=canonical_role,
            matched_skills=all_matched,
            missing_skills=all_missing_important,
            detected_sections=detected_sections,
            impact_lines=impact_lines,
            total_score=ats_score,
            is_role_available=is_role_available,
            job_description=job_description if has_job_description else None
        )

        summary_text = (
            f"ATS rubric evaluation score of {ats_score}/100 evaluated for {canonical_role}. "
            f"Identified {len(all_matched)} matching technical skills and {len(all_missing_important)} priority skill gaps."
        )

        # 9. Optional LLM Qualitative Contextual Enhancement
        # Notice: LLM CANNOT overwrite deterministic ats_score or breakdown_data, and cannot add unverified skills.
        try:
            llm_service = get_resume_llm_service()
            if hasattr(llm_service, "analyze_resume"):
                llm_analysis = llm_service.analyze_resume(
                    resume_text=cleaned_text,
                    target_role=canonical_role,
                    job_description=job_description
                )
                if llm_analysis and isinstance(llm_analysis, dict):
                    # Validate any AI-suggested extracted skills against actual text
                    if llm_analysis.get("extracted_skills"):
                        for s in llm_analysis["extracted_skills"]:
                            norm = normalize_skill(s)
                            if norm.lower() in cleaned_text.lower():
                                if norm not in extracted_skills:
                                    extracted_skills.append(norm)
                        extracted_skills = sorted(list(set(extracted_skills)))

                    # LLM summary enhancement (without inventing ungrounded scores)
                    if llm_analysis.get("summary") and isinstance(llm_analysis["summary"], str) and len(llm_analysis["summary"].strip()) > 20:
                        summary_text = llm_analysis["summary"].strip()

        except Exception as e:
            logger.warning("Resume analysis LLM contextual enhancement skipped: %s", e)

        # 10. Persist to Database & Update Career State (if DB session active)
        analysis_id = f"ats-{uuid.uuid4().hex[:12]}"
        now = utc_now()

        if db:
            record = ResumeAnalysis(
                id=analysis_id,
                user_id=user_id,
                filename=filename,
                file_type=detected_format,
                file_size=len(file_bytes),
                target_role=canonical_role,
                ats_score=ats_score,
                analysis_summary=summary_text,
                created_at=now,
                updated_at=now
            )
            record.score_breakdown = breakdown_data
            record.extracted_skills = extracted_skills
            record.matched_skills = all_matched
            record.missing_skills = all_missing_important
            record.missing_optional_skills = missing_optional
            record.strengths = strengths
            record.weaknesses = weaknesses
            record.sections_detected = detected_sections
            db.add(record)

            # Synchronize unified skill profile across sources without inserting negative evidence
            sync_unified_skill_profile(db=db, user_id=user_id, target_role=canonical_role)

            # Record Activity (+35 XP canonical)
            record_activity(
                db=db,
                user_id=user_id,
                data=ActivityCreate(
                    type="resume_analyzed",
                    related_module="ATS Resume Scanner",
                    title=f"Audited Resume for {canonical_role} ({ats_score}/100)",
                    xp_earned=35,
                    details={
                        "analysis_id": analysis_id,
                        "filename": filename,
                        "ats_score": ats_score,
                        "target_role": canonical_role,
                        "matched_count": len(all_matched),
                        "missing_count": len(all_missing_important)
                    }
                )
            )

            # Evaluate next-best-action recommendations
            try:
                evaluate_next_best_action(db=db, user_id=user_id, trigger_source="resume")
            except Exception as e:
                logger.warning("Recommendation trigger after ATS scan: %s", e)

            db.commit()

        breakdown_objs = [
            ResumeScoreBreakdownItem(
                label=b["label"],
                score=b["score"],
                max=b["max"],
                percentage=b["percentage"],
                status=b["status"]
            )
            for b in breakdown_data
        ]

        return ResumeAnalysisResponse(
            id=analysis_id,
            user_id=user_id,
            filename=filename,
            file_type=detected_format,
            file_size=len(file_bytes),
            target_role=canonical_role,
            ats_score=ats_score,
            breakdown=breakdown_objs,
            extracted_skills=extracted_skills,
            matched_skills=all_matched,
            missing_skills=all_missing_important,
            missing_optional_skills=missing_optional,
            strengths=strengths,
            weaknesses=weaknesses,
            sections_detected=detected_sections,
            analysis_summary=summary_text,
            score_basis=score_basis,
            is_role_aligned=is_role_aligned,
            xp_earned=35,
            created_at=now,
            # Frontend backwards compatibility aliases
            matchedSkills=all_matched,
            missingKeywords=all_missing_important,
            overallScore=ats_score
        )

    def get_latest_analysis(self, db: Session, user_id: str) -> Optional[ResumeAnalysisResponse]:
        """Retrieves the most recent resume analysis for candidate."""
        record = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .first()
        )
        if not record:
            return None
        return self._to_response(record)

    def get_analysis_by_id(self, db: Session, analysis_id: str, user_id: Optional[str] = None) -> Optional[ResumeAnalysisResponse]:
        """Retrieves a specific resume analysis, verifying user ownership if user_id is provided."""
        query = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id)
        if user_id:
            query = query.filter(ResumeAnalysis.user_id == user_id)
        record = query.first()
        if not record:
            return None
        return self._to_response(record)

    def get_analysis_history(self, db: Session, user_id: str, limit: int = 10) -> ResumeHistoryResponse:
        """Retrieves historical resume analyses for candidate."""
        records = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .limit(limit)
            .all()
        )
        items = [self._to_response(r) for r in records]
        return ResumeHistoryResponse(analyses=items, total_count=len(items))

    def _to_response(self, record: ResumeAnalysis) -> ResumeAnalysisResponse:
        breakdown_data = record.score_breakdown or []
        breakdown_objs = [
            ResumeScoreBreakdownItem(
                label=b.get("label", ""),
                score=b.get("score", 0),
                max=b.get("max", 100),
                percentage=b.get("percentage", 0),
                status=b.get("status", "Good")
            )
            for b in breakdown_data
        ]
        matched = record.matched_skills or []
        missing = record.missing_skills or []
        return ResumeAnalysisResponse(
            id=record.id,
            user_id=record.user_id,
            filename=record.filename,
            file_type=record.file_type,
            file_size=record.file_size,
            target_role=record.target_role,
            ats_score=record.ats_score,
            breakdown=breakdown_objs,
            extracted_skills=record.extracted_skills or [],
            matched_skills=matched,
            missing_skills=missing,
            missing_optional_skills=record.missing_optional_skills or [],
            strengths=record.strengths or [],
            weaknesses=record.weaknesses or [],
            sections_detected=record.sections_detected or [],
            analysis_summary=record.analysis_summary or "",
            score_basis=None,
            is_role_aligned=True,
            xp_earned=35,
            created_at=record.created_at,
            matchedSkills=matched,
            missingKeywords=missing,
            overallScore=record.ats_score
        )


resume_analysis_service = ResumeAnalysisService()
