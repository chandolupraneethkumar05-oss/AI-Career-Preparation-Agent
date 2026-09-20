"""
Autonomous Agent Recommendation & Decision Engine
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import (
    User, Interview, SkillGap, Activity,
    ResumeAnalysis, Challenge, Recommendation, SkillArenaAttempt
)
from ..schemas.recommendation import NextBestActionResponse
from .activity_service import has_practiced_today
from .skill_service import aggregate_user_skill_evidence
from .skill_taxonomy import normalize_skill, ROLE_REQUIREMENTS


def evaluate_next_best_action(db: Session, user_id: str) -> NextBestActionResponse:
    """
    Autonomously evaluates candidate state across resume ATS data,
    interview demonstration rubrics, challenge performance, and unified
    skill gaps to prescribe the highest-yield next preparation action.
    """
    user = db.query(User).filter(User.id == user_id).first()
    target_role = user.target_role if user else "Machine Learning Engineer"

    # 1. Check today's practice status
    practiced = has_practiced_today(db, user_id)

    # 2. Check resume ATS audit activity
    has_ats_activity = (
        db.query(Activity.id)
        .filter(Activity.user_id == user_id)
        .filter(Activity.type.in_(["resume_analyzed", "ats_scanned"]))
        .first()
    ) is not None

    latest_resume = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(desc(ResumeAnalysis.created_at))
        .first()
    )

    # 3. Check latest mock interview
    latest_interview = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .first()
    )

    # 4. Check unified skill profile and evidence
    profile = aggregate_user_skill_evidence(db, user_id, target_role=target_role)
    unified_skills = profile.get("unified_skills", [])
    top_gaps = profile.get("top_skill_gaps", [])

    # 5. Check recently practiced challenge topics (to prevent repetitive drills)
    recent_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == user_id)
        .order_by(desc(Challenge.submitted_at))
        .limit(10)
        .all()
    )
    recently_practiced_skills = set()
    for c in recent_challenges:
        recently_practiced_skills.add(normalize_skill(c.topic).lower())

    recent_arena = (
        db.query(SkillArenaAttempt)
        .filter(SkillArenaAttempt.user_id == user_id)
        .order_by(desc(SkillArenaAttempt.created_at))
        .limit(10)
        .all()
    )
    for a in recent_arena:
        recently_practiced_skills.add(normalize_skill(a.skill).lower())

    response: Optional[NextBestActionResponse] = None

    # -------------------------------------------------------------------------
    # RULE 1: Onboarding — No Resume Scanned Yet (Source: ATS Audit)
    # -------------------------------------------------------------------------
    if not has_ats_activity and not latest_resume:
        response = NextBestActionResponse(
            action_type="improve_resume",
            priority="high",
            title="Audit Your Resume Against ATS Systems",
            headline="Audit Your Resume Against ATS Systems",
            action="Scan Your Resume",
            route="/ats",
            target_role=target_role,
            primary_skill="ATS Alignment",
            target_skill="ATS Alignment",
            suggested_action="Upload PDF/DOCX Resume for ATS Audit",
            reason=(
                "You have not audited your resume against Applicant Tracking Systems yet. "
                "Identifying missing keywords is the fastest way to increase interview callbacks."
            ),
            source="ats_audit",
            status="NEW",
            estimated_effort="5 mins"
        )

    # -------------------------------------------------------------------------
    # RULE 2: Onboarding — Resume Scanned, but 0 Mock Interviews Completed
    # -------------------------------------------------------------------------
    elif not latest_interview:
        ats_score = latest_resume.ats_score if latest_resume else 75
        response = NextBestActionResponse(
            action_type="practice_interview",
            priority="high",
            title=f"Take Your Diagnostic {target_role} Mock Interview",
            headline=f"Take Your Diagnostic {target_role} Mock Interview",
            action="Start 1st Mock Interview",
            route="/interview-setup",
            target_role=target_role,
            primary_skill=target_role,
            target_skill=target_role,
            suggested_action="Complete 5-question baseline interview",
            reason=(
                f"Your ATS profile is established ({ats_score}% compatibility). Next, establish your baseline technical and "
                "communication readiness through a 5-question mock interview session."
            ),
            source="interview_baseline",
            status="NEW",
            estimated_effort="15 mins"
        )

    else:
        # Evaluate recent interview rubrics
        rubrics = latest_interview.rubric_scores or {}
        clarity_raw = rubrics.get("clarity", 75)
        comm_score = clarity_raw * 10 if clarity_raw <= 10 else clarity_raw

        confidence_raw = rubrics.get("confidence", 70)
        conf_score = confidence_raw * 10 if confidence_raw <= 10 else confidence_raw

        # ---------------------------------------------------------------------
        # RULE 3A: Repeated Weakness Detected in Live Demonstrations
        # ---------------------------------------------------------------------
        repeated_weakness_skill = next((s for s in unified_skills if s.repeated_weakness and s.gap > 0), None)

        if repeated_weakness_skill and normalize_skill(repeated_weakness_skill.skill_name).lower() not in recently_practiced_skills:
            response = NextBestActionResponse(
                action_type="practice_skill",
                priority="high",
                title=f"Overcome Repeated Weakness: Practice {repeated_weakness_skill.skill_name}",
                headline=f"Overcome Repeated Weakness in {repeated_weakness_skill.skill_name}",
                action=f"Solve {repeated_weakness_skill.skill_name} Drill",
                route="/daily-challenge",
                target_role=target_role,
                primary_skill=repeated_weakness_skill.skill_name,
                target_skill=repeated_weakness_skill.skill_name,
                suggested_action=f"Take {repeated_weakness_skill.skill_name} conceptual drill",
                reason=(
                    f"You scored under 60% in {repeated_weakness_skill.skill_name} across multiple evaluations. "
                    f"Dedicated practice on {repeated_weakness_skill.skill_name} fundamentals is your highest-yield action to prevent live interview failure."
                ),
                source="unified_skill_gap",
                status="IN_PROGRESS",
                estimated_effort="10 mins",
                weakness_detail=repeated_weakness_skill.latest_feedback
            )

        # ---------------------------------------------------------------------
        # RULE 3B: High-Priority Career-Relevant Competency Gap
        # ---------------------------------------------------------------------
        if not response:
            # Pick highest priority gap that has not been practiced today (to avoid repetition)
            unpracticed_gap = next(
                (g for g in top_gaps if normalize_skill(g.skill_name).lower() not in recently_practiced_skills and g.gap >= 15),
                None
            )
            candidate_gap = unpracticed_gap or (top_gaps[0] if top_gaps and top_gaps[0].gap >= 15 else None)

            if candidate_gap and candidate_gap.gap >= 15:
                gap_diff = candidate_gap.gap
                p_level = candidate_gap.priority if candidate_gap.priority in ["high", "medium"] else ("high" if gap_diff >= 25 else "medium")

                reason_text = (
                    f"{candidate_gap.skill_name} is currently your biggest competency gap "
                    f"({candidate_gap.demonstrated_score}% demonstrated vs {candidate_gap.target_score}% benchmark) for {target_role} roles. "
                    f"Bridging this {candidate_gap.role_importance.lower()} requirement will directly improve your hiring readiness."
                )
                if candidate_gap.latest_feedback:
                    reason_text += f" Recent feedback: '{candidate_gap.latest_feedback[:100]}...'"

                response = NextBestActionResponse(
                    action_type="practice_skill",
                    priority=p_level,
                    title=f"Bridge Your {candidate_gap.skill_name} Competency Gap",
                    headline=f"Bridge Your {candidate_gap.skill_name} Competency Gap",
                    action=f"Practice {candidate_gap.skill_name} Drill",
                    route="/daily-challenge",
                    target_role=target_role,
                    primary_skill=candidate_gap.skill_name,
                    target_skill=candidate_gap.skill_name,
                    suggested_action=f"Complete {candidate_gap.skill_name} conceptual challenge",
                    reason=reason_text,
                    source="unified_skill_gap",
                    status=candidate_gap.status,
                    estimated_effort="10 mins",
                    weakness_detail=candidate_gap.latest_feedback
                )

        # ---------------------------------------------------------------------
        # RULE 4: Communication / Articulation Deficit from Interview
        # ---------------------------------------------------------------------
        if not response and comm_score < 70:
            response = NextBestActionResponse(
                action_type="review_concept",
                priority="high",
                title="Sharpen STAR Narrative Structure",
                headline="Sharpen STAR Narrative Structure",
                action="Practice Behavioral STAR Drill",
                route="/daily-challenge",
                target_role=target_role,
                primary_skill="Communication",
                target_skill="Communication",
                suggested_action="Review STAR structure & take behavioral drill",
                reason=(
                    f"Your last interview scored {comm_score}% in communication clarity. "
                    "Practicing the STAR framework (Situation, Task, Action, Result) will directly improve your hiring score."
                ),
                source="interview_performance",
                status="IN_PROGRESS",
                estimated_effort="10 mins"
            )

        if not response and conf_score < 65:
            response = NextBestActionResponse(
                action_type="review_concept",
                priority="high",
                title="Build Verbal Confidence & Delivery",
                headline="Build Verbal Confidence & Delivery",
                action="Take 5-Minute Articulation Drill",
                route="/daily-challenge",
                target_role=target_role,
                primary_skill="Confidence",
                target_skill="Confidence",
                suggested_action="Take 5-minute articulation drill without filler words",
                reason=(
                    f"Your confidence & delivery score was {conf_score}%. "
                    "Concise, structured delivery without filler language increases interviewer confidence."
                ),
                source="interview_performance",
                status="IN_PROGRESS",
                estimated_effort="5 mins"
            )

        # ---------------------------------------------------------------------
        # RULE 5: Daily Practice Pending Today
        # ---------------------------------------------------------------------
        if not response and not practiced:
            drill_skill = top_gaps[0].skill_name if top_gaps else "Core Fundamentals"
            response = NextBestActionResponse(
                action_type="take_daily_challenge",
                priority="medium",
                title=f"Complete Today's Practice Challenge ({drill_skill})",
                headline="Daily Practice Pending Today",
                action="Solve Today's Conceptual Drill",
                route="/daily-challenge",
                target_role=target_role,
                primary_skill=drill_skill,
                target_skill=drill_skill,
                suggested_action=f"Solve 5-minute {drill_skill} drill",
                reason=(
                    "You have not completed a preparation activity today. "
                    f"Spend 5 minutes solving today's {drill_skill} drill to protect your streak and earn +50 XP."
                ),
                source="activity",
                status="IN_PROGRESS",
                estimated_effort="5 mins"
            )

        # ---------------------------------------------------------------------
        # RULE 6: High Readiness -> Escalate to Advanced System Architecture
        # ---------------------------------------------------------------------
        if not response:
            readiness = profile.get("overall_readiness", 80)
            response = NextBestActionResponse(
                action_type="practice_interview",
                priority="low",
                title="Escalate to Advanced System Architecture",
                headline="Take an Advanced Architecture Mock Round",
                action="Launch Advanced Simulation",
                route="/interview-setup",
                target_role=target_role,
                primary_skill="Architecture",
                target_skill="Architecture",
                suggested_action="Take advanced difficulty technical simulation",
                reason=(
                    f"You are maintaining strong readiness ({readiness}% demonstrated). "
                    "Challenge yourself with an Advanced interview round testing production distributed architecture."
                ),
                source="advanced_readiness",
                status="MASTERED" if readiness >= 85 else "COMPLETED",
                estimated_effort="20 mins"
            )

    # Persist active recommendation record to DB if different from previous
    try:
        prev_rec = (
            db.query(Recommendation)
            .filter(Recommendation.user_id == user_id, Recommendation.is_active == True)
            .order_by(desc(Recommendation.created_at))
            .first()
        )
        if not prev_rec or prev_rec.title != response.title:
            if prev_rec:
                prev_rec.is_active = False
            new_rec = Recommendation(
                user_id=user_id,
                action_type=response.action_type,
                priority=response.priority,
                title=response.title,
                headline=response.headline,
                action=response.action,
                route=response.route,
                target_role=response.target_role,
                primary_skill=response.primary_skill,
                reason=response.reason,
                source=response.source,
                is_active=True
            )
            db.add(new_rec)
            db.commit()
    except Exception:
        db.rollback()

    return response
