"""
Resume ATS Analysis & Scoring Engine
Coordinates text extraction, section parsing, canonical skill extraction,
explainable ATS-style scoring, strengths/weaknesses synthesis, and Skill Gap synchronization.

AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
"""

import re
import uuid
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
    get_canonical_role
)
from .skill_service import upsert_skill_gap, record_skill_evidence, sync_unified_skill_profile
from .activity_service import record_activity
from .recommendation_service import evaluate_next_best_action


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


def detect_sections(text: str) -> List[str]:
    """
    Detects which standard resume sections are present in the candidate's resume text.
    """
    detected = []
    lines = text.splitlines()

    for section_name, patterns in SECTION_PATTERNS.items():
        found = False
        for line in lines:
            # Check lines that look like headings (short, e.g. < 40 chars)
            line_clean = line.strip()
            if len(line_clean) <= 45:
                for pattern in patterns:
                    if pattern.search(line_clean):
                        found = True
                        break
            if found:
                break

        # Fallback: general regex in text if heading check missed
        if not found:
            for pattern in patterns:
                if pattern.search(text):
                    found = True
                    break

        if found:
            detected.append(section_name)

    return detected


def calculate_ats_score(
    text: str,
    target_role: str,
    matched_core: List[str],
    core_skills: List[str],
    matched_important: List[str],
    important_skills: List[str],
    matched_optional: List[str],
    detected_sections: List[str]
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Computes an explainable, transparent ATS-style score (0-100) with detailed rubric breakdown.
    Disclaimer: This is an educational rubric model, not an official commercial ATS proprietary score.
    """
    # 1. Skill Match (Max 40 points)
    # Core skills: 25 pts; Important skills: 15 pts
    core_ratio = len(matched_core) / max(1, len(core_skills))
    important_ratio = len(matched_important) / max(1, len(important_skills))
    skill_score = min(40, round((core_ratio * 25) + (important_ratio * 15)))

    # 2. Target Role Alignment (Max 25 points)
    # Role title, role keywords, and domain terminology density
    text_lower = text.lower()
    role_lower = target_role.lower()
    has_role_title = role_lower in text_lower or any(word in text_lower for word in role_lower.split())
    role_points = 10 if has_role_title else 5
    # Bonus for overall skill coverage ratio
    all_target_skills = core_skills + important_skills
    total_matched = len(matched_core) + len(matched_important)
    coverage_ratio = total_matched / max(1, len(all_target_skills))
    role_points += round(coverage_ratio * 15)
    role_alignment_score = min(25, role_points)

    # 3. Project Relevance & Technical Depth (Max 15 points)
    has_projects = "Projects" in detected_sections
    has_experience = "Experience" in detected_sections
    project_score = 0
    if has_projects:
        project_score += 6
    if has_experience:
        project_score += 4
    # Check for quantitative impact / metrics terms (% / latency / accuracy / scale / deployed)
    metric_terms = ["accuracy", "latency", "pipeline", "deployed", "scaled", "improved", "reduced", "optimized", "%", "dataset", "production"]
    metrics_found = sum(1 for term in metric_terms if term in text_lower)
    metric_points = min(5, metrics_found)
    project_score = min(15, project_score + metric_points)

    # 4. Resume Section Completeness (Max 10 points)
    # Awards points for core foundational sections
    comp_score = 0
    if "Experience" in detected_sections:
        comp_score += 3
    if "Education" in detected_sections:
        comp_score += 3
    if "Skills" in detected_sections:
        comp_score += 2
    if "Projects" in detected_sections:
        comp_score += 2
    completeness_score = min(10, comp_score)

    # 5. Keyword Density & Formatting (Max 10 points)
    # Density of technology tokens without keyword stuffing
    total_extracted_count = len(matched_core) + len(matched_important) + len(matched_optional)
    keyword_score = min(10, round((total_extracted_count / max(1, len(core_skills))) * 6) + 4)

    total_score = skill_score + role_alignment_score + project_score + completeness_score + keyword_score
    total_score = max(5, min(100, total_score))

    breakdown = [
        {
            "label": "Skill Match",
            "score": skill_score,
            "max": 40,
            "percentage": round((skill_score / 40) * 100),
            "status": "Strong" if skill_score >= 30 else ("Good" if skill_score >= 20 else "Needs Improvement")
        },
        {
            "label": "Target-Role Alignment",
            "score": role_alignment_score,
            "max": 25,
            "percentage": round((role_alignment_score / 25) * 100),
            "status": "Strong" if role_alignment_score >= 18 else ("Good" if role_alignment_score >= 12 else "Needs Improvement")
        },
        {
            "label": "Projects & Implementation",
            "score": project_score,
            "max": 15,
            "percentage": round((project_score / 15) * 100),
            "status": "Strong" if project_score >= 11 else ("Good" if project_score >= 8 else "Needs Improvement")
        },
        {
            "label": "Resume Completeness",
            "score": completeness_score,
            "max": 10,
            "percentage": round((completeness_score / 10) * 100),
            "status": "Strong" if completeness_score >= 8 else ("Good" if completeness_score >= 5 else "Needs Improvement")
        },
        {
            "label": "Keyword Density & Structure",
            "score": keyword_score,
            "max": 10,
            "percentage": round((keyword_score / 10) * 100),
            "status": "Strong" if keyword_score >= 8 else ("Good" if keyword_score >= 5 else "Needs Improvement")
        }
    ]

    return total_score, breakdown


def generate_strengths_and_weaknesses(
    target_role: str,
    matched_core: List[str],
    matched_important: List[str],
    missing_core: List[str],
    missing_important: List[str],
    detected_sections: List[str],
    total_score: int
) -> Tuple[List[str], List[str]]:
    """
    Generates tailored, data-derived strengths and actionable weaknesses based on the resume.
    """
    strengths = []
    weaknesses = []

    # Strengths
    if matched_core:
        top_core = ", ".join(matched_core[:3])
        strengths.append(f"Demonstrated proficiency in core {target_role} technologies: {top_core}.")

    if len(matched_core) >= 4:
        strengths.append(f"High technical foundation with {len(matched_core)} essential role competencies recognized.")

    if matched_important:
        top_imp = ", ".join(matched_important[:3])
        strengths.append(f"Strong practical tooling and framework coverage ({top_imp}).")

    if "Projects" in detected_sections:
        strengths.append("Dedicated technical projects section providing evidence of hands-on implementation.")

    if "Education" in detected_sections:
        strengths.append("Clear academic qualifications and educational background.")

    if not strengths:
        strengths.append("Resume contains clean basic structure ready for technical expansion.")

    # Weaknesses
    if missing_core:
        top_missing_core = ", ".join(missing_core[:3])
        weaknesses.append(f"Missing critical core skills required for {target_role}: {top_missing_core}.")

    if missing_important:
        top_missing_imp = ", ".join(missing_important[:3])
        weaknesses.append(f"Production and deployment tooling gap: lacks explicit mention of {top_missing_imp}.")

    if "Projects" not in detected_sections:
        weaknesses.append("Missing a dedicated Projects section. Highlighting 2-3 architectural projects dramatically increases ATS ranking.")

    if total_score < 70 and not any("quantifiable" in w.lower() for w in weaknesses):
        weaknesses.append("Could benefit from more quantifiable impact metrics (e.g. latency reduced by X%, accuracy improved by Y%).")

    if not weaknesses:
        weaknesses.append("Continue maintaining consistency across distributed systems and advanced architectures.")

    return strengths, weaknesses


class ResumeAnalysisService:
    """
    Orchestrator for resume extraction, section detection, skill analysis,
    explainable ATS scoring, SQLite persistence, and Skill Gap synchronization.
    """

    def analyze_resume_document(
        self,
        file_bytes: bytes,
        filename: str,
        target_role: Optional[str] = None,
        job_description: Optional[str] = None,
        user_id: str = "user-001",
        db: Optional[Session] = None
    ) -> ResumeAnalysisResponse:
        """
        Executes complete genuine ATS analysis pipeline from file bytes.
        """
        # 1. Validate User
        if db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                user = User(
                    id=user_id,
                    email=f"{user_id}@vignan.ac.in",
                    name="Candidate",
                    target_role=target_role or "Machine Learning Engineer"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            active_role = target_role or user.target_role or "Machine Learning Engineer"
        else:
            active_role = target_role or "Machine Learning Engineer"

        canonical_role = get_canonical_role(active_role)

        # 2. Extract Document Text
        cleaned_text, detected_format = extract_resume_text(file_bytes, filename)

        # 3. Detect Resume Sections
        detected_sections = detect_sections(cleaned_text)

        # 4. Extract Skills using Canonical Taxonomy
        extracted_skills = default_skill_extractor.extract_skills(cleaned_text)

        # 5. Role Skill Requirements Comparison
        reqs = ROLE_REQUIREMENTS.get(canonical_role, ROLE_REQUIREMENTS["Machine Learning Engineer"])
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

        # 6. Calculate Explainable ATS-Style Score
        ats_score, breakdown_data = calculate_ats_score(
            text=cleaned_text,
            target_role=canonical_role,
            matched_core=matched_core,
            core_skills=core_skills,
            matched_important=matched_important,
            important_skills=important_skills,
            matched_optional=matched_optional,
            detected_sections=detected_sections
        )

        # 7. Generate Strengths & Weaknesses
        strengths, weaknesses = generate_strengths_and_weaknesses(
            target_role=canonical_role,
            matched_core=matched_core,
            matched_important=matched_important,
            missing_core=missing_core,
            missing_important=missing_important,
            detected_sections=detected_sections,
            total_score=ats_score
        )

        summary_text = (
            f"ATS-style resume score of {ats_score}/100 evaluated for {canonical_role}. "
            f"Identified {len(all_matched)} matching technical skills and {len(all_missing_important)} priority skill gaps."
        )

        # 8. Persist to Database & Update Career State (if DB session active)
        analysis_id = f"ats-{uuid.uuid4().hex[:12]}"
        now = utc_now()

        if db:
            # Create ResumeAnalysis record
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

            # 9. Auto-Sync to Skill Evidence & Unified Skill Gap System
            # Record evidence for missing core skills (low score 40)
            for skill in missing_core:
                record_skill_evidence(
                    db=db,
                    user_id=user_id,
                    skill_name=skill,
                    source_type="resume",
                    source_id=analysis_id,
                    score=40,
                    evidence_text=f"Missing core skill for {canonical_role} from resume",
                    confidence="medium"
                )

            # Record evidence for missing important skills (medium score 55)
            for skill in missing_important:
                record_skill_evidence(
                    db=db,
                    user_id=user_id,
                    skill_name=skill,
                    source_type="resume",
                    source_id=analysis_id,
                    score=55,
                    evidence_text=f"Missing important skill for {canonical_role} from resume",
                    confidence="medium"
                )

            # Record evidence for matched core skills (strong score 85)
            for skill in matched_core:
                record_skill_evidence(
                    db=db,
                    user_id=user_id,
                    skill_name=skill,
                    source_type="resume",
                    source_id=analysis_id,
                    score=85,
                    evidence_text=f"Verified core skill for {canonical_role} on resume",
                    confidence="medium"
                )

            # Record evidence for matched important skills (strong score 80)
            for skill in matched_important:
                record_skill_evidence(
                    db=db,
                    user_id=user_id,
                    skill_name=skill,
                    source_type="resume",
                    source_id=analysis_id,
                    score=80,
                    evidence_text=f"Verified important skill for {canonical_role} on resume",
                    confidence="medium"
                )

            # Synchronize unified skill profile across sources without overwriting interview evaluations
            sync_unified_skill_profile(db=db, user_id=user_id, target_role=canonical_role)

            # 10. Record Activity & Update Streak (+35 XP canonical)
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

            # 11. Trigger Recommendation Engine
            evaluate_next_best_action(db, user_id)

            db.commit()

        # Format breakdown objects for Pydantic schema
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
            xp_earned=35,
            created_at=now,
            # Frontend backwards compatibility aliases
            matchedSkills=all_matched,
            missingKeywords=all_missing_important,
            overallScore=ats_score
        )

    def get_latest_analysis(self, db: Session, user_id: str = "user-001") -> Optional[ResumeAnalysisResponse]:
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

    def get_analysis_history(self, db: Session, user_id: str = "user-001", limit: int = 10) -> ResumeHistoryResponse:
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
            xp_earned=35,
            created_at=record.created_at,
            matchedSkills=matched,
            missingKeywords=missing,
            overallScore=record.ats_score
        )


resume_analysis_service = ResumeAnalysisService()
