"""
User Career Context Builder
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Gathers live, sanitized candidate state across User Profile, Resume Analyses,
Skill Gaps, Interview Rubrics, and Autonomous Next-Best-Action recommendations.
Strictly excludes raw resume files, passwords, or sensitive PII.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ....db.models import User, ResumeAnalysis, SkillGap, Interview, Activity
from ....services.activity_service import has_practiced_today, calculate_streaks
from ....services.recommendation_service import evaluate_next_best_action


def build_user_career_context(user_id: str, db: Session) -> Dict[str, Any]:
    """
    Constructs a comprehensive, privacy-preserving Career Context
    representing the candidate's current readiness state for RAG & LLM conditioning.
    """
    user = db.query(User).filter(User.id == user_id).first()
    target_role = user.target_role if user else "Machine Learning Engineer"
    name = user.name if user else "Candidate"
    xp = user.xp if user else 0
    level = user.level if user else 1

    current_streak, longest_streak = calculate_streaks(db, user_id)
    practiced = has_practiced_today(db, user_id)

    # 1. Latest Resume ATS Analysis
    latest_resume = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(desc(ResumeAnalysis.created_at))
        .first()
    )

    ats_score = latest_resume.ats_score if latest_resume else None
    matched_skills = latest_resume.matched_skills if latest_resume else []
    missing_skills = latest_resume.missing_skills if latest_resume else []

    # 2. Critical Skill Gaps
    active_gaps = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == user_id)
        .order_by(SkillGap.current_score.asc())
        .all()
    )
    high_priority_gaps = [g.skill_name for g in active_gaps if g.priority == "high"]
    medium_priority_gaps = [g.skill_name for g in active_gaps if g.priority == "medium"]
    urgent_gap = high_priority_gaps[0] if high_priority_gaps else (missing_skills[0] if missing_skills else None)

    # 3. Latest Interview Performance & Rubrics
    latest_interview = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .first()
    )

    interview_count = db.query(Interview).filter(Interview.user_id == user_id).count()
    interview_score = latest_interview.overall_score if latest_interview else None

    interview_weaknesses = []
    if latest_interview and latest_interview.rubric_scores:
        rubrics = latest_interview.rubric_scores
        clarity = rubrics.get("clarity", 100)
        clarity_val = clarity * 10 if clarity <= 10 else clarity
        if clarity_val < 70:
            interview_weaknesses.append("Communication & STAR Clarity")

        confidence = rubrics.get("confidence", 100)
        conf_val = confidence * 10 if confidence <= 10 else confidence
        if conf_val < 65:
            interview_weaknesses.append("Confidence & Delivery")

        tech = rubrics.get("technicalKnowledge", 100)
        tech_val = tech * 10 if tech <= 10 else tech
        if tech_val < 70:
            interview_weaknesses.append("Technical Depth & Trade-offs")

    # 4. Autonomous Next-Best-Action (NBA)
    nba = evaluate_next_best_action(db, user_id)

    # Determine qualitative experience level
    experience_level = "Foundational / College Junior"
    if xp >= 500 or interview_count >= 5:
        experience_level = "Intermediate / Job Ready"
    elif xp >= 200 or interview_count >= 2:
        experience_level = "Developing / Active Practicing"

    return {
        "user_id": user_id,
        "candidate_name": name,
        "target_role": target_role,
        "experience_level": experience_level,
        "xp": xp,
        "level": level,
        "streak": current_streak,
        "longest_streak": longest_streak,
        "practiced_today": practiced,
        "ats_score": ats_score,
        "has_ats_audit": latest_resume is not None,
        "matched_skills": matched_skills[:8],
        "missing_skills": missing_skills[:6],
        "high_priority_gaps": high_priority_gaps[:10],
        "urgent_gap": urgent_gap,
        "interview_count": interview_count,
        "latest_interview_score": interview_score,
        "interview_weaknesses": interview_weaknesses,
        "next_best_action": {
            "title": nba.title,
            "headline": nba.headline,
            "action": nba.action,
            "route": nba.route,
            "source": nba.source,
            "reason": nba.reason,
            "primary_skill": nba.primary_skill
        }
    }
