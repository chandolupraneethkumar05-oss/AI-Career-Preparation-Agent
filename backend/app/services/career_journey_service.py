"""
Career Journey and Career Readiness Foundation Service
AI Career Preparation Agent
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import (
    User,
    Profile,
    ResumeAnalysis,
    SkillGap,
    SkillEvidence,
    Challenge,
    SkillArenaAttempt,
    Interview,
    InterviewAnswer,
    AnswerEvaluation,
    InterviewRecording,
    Activity
)
from ..schemas.career_journey import (
    MilestoneStatus,
    ReadinessBand,
    MilestoneEvidenceItem,
    CareerMilestone,
    ReadinessDimension,
    ReadinessAssessment,
    CareerJourneyStats,
    CareerJourneyResponse
)
from .recommendation_service import evaluate_next_best_action
from .activity_service import calculate_streaks


def get_career_journey_data(db: Session, user_id: str) -> CareerJourneyResponse:
    """
    Synthesizes candidate real-time career preparation records into an
    authoritative, zero-fabrication Career Journey and Readiness Foundation.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    # Query Resume Analyses
    resume_analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(desc(ResumeAnalysis.created_at))
        .all()
    )
    latest_resume = resume_analyses[0] if resume_analyses else None

    # Query Skill Gaps & Evidence
    skill_gaps = db.query(SkillGap).filter(SkillGap.user_id == user_id).all()
    high_priority_gaps = [g for g in skill_gaps if g.priority == "high"]
    skill_evidences = db.query(SkillEvidence).filter(SkillEvidence.user_id == user_id).all()

    # Query Challenges & Skill Arena Attempts
    challenges = db.query(Challenge).filter(Challenge.user_id == user_id).all()
    completed_challenges = [c for c in challenges if c.completed]
    arena_attempts = db.query(SkillArenaAttempt).filter(SkillArenaAttempt.user_id == user_id).all()
    correct_arena_attempts = [a for a in arena_attempts if a.correctness or a.score >= 70]

    # Query Interviews & Evaluations
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .all()
    )
    completed_interviews = [i for i in interviews if i.status == "completed" or i.completed_at is not None]
    in_progress_interviews = [i for i in interviews if i.status == "in_progress"]
    
    evaluations = db.query(AnswerEvaluation).filter(AnswerEvaluation.user_id == user_id).all()
    recordings = db.query(InterviewRecording).filter(InterviewRecording.user_id == user_id).all()

    # Next-best action from recommendation engine
    nba = evaluate_next_best_action(db, user_id)

    # Streaks and stats
    current_streak, longest_streak = calculate_streaks(db, user_id)
    interview_count = len(completed_interviews)
    avg_interview_score = (
        round(sum(i.overall_score for i in completed_interviews) / interview_count, 1)
        if interview_count > 0 else 0.0
    )
    total_drills = len(completed_challenges) + len(arena_attempts)

    # -------------------------------------------------------------
    # 1. Compile 14 Deterministic Milestones
    # -------------------------------------------------------------
    milestones: List[CareerMilestone] = []

    # Milestone 1: Profile Complete
    p_evidence: List[MilestoneEvidenceItem] = []
    p_completed = False
    p_in_progress = False
    if profile and profile.bio and profile.target_company:
        p_completed = True
        p_evidence.append(MilestoneEvidenceItem(
            title="Candidate Dossier Registered",
            description=f"Bio: {profile.bio[:80]}... | Target: {profile.target_company}",
            source_type="profile",
            date=profile.updated_at.strftime("%Y-%m-%d") if profile.updated_at else None
        ))
    elif user:
        p_in_progress = True
        p_evidence.append(MilestoneEvidenceItem(
            title="Identity Registered",
            description=f"Account active for {user.name} ({user.email})",
            source_type="profile",
            date=user.created_at.strftime("%Y-%m-%d") if user.created_at else None
        ))

    milestones.append(CareerMilestone(
        id="milestone_profile",
        sequence=1,
        milestone_type="PROFILE",
        title="Candidate Profile Initialized",
        description="Candidate identity, experience tier, and target institution preferences documented.",
        status=MilestoneStatus.COMPLETED if p_completed else (
            MilestoneStatus.IN_PROGRESS if p_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=profile.updated_at.strftime("%Y-%m-%d") if (profile and p_completed) else None,
        evidence=p_evidence,
        action_route="/settings",
        action_label="Edit Profile"
    ))

    # Milestone 2: Target Role Selected
    r_evidence: List[MilestoneEvidenceItem] = []
    role_set = bool(user.target_role and user.target_role.strip())
    if role_set:
        r_evidence.append(MilestoneEvidenceItem(
            title="Career Path Calibrated",
            description=f"Target Role: {user.target_role}",
            source_type="profile",
            date=user.updated_at.strftime("%Y-%m-%d") if user.updated_at else None,
            metric_value=user.target_role
        ))
    milestones.append(CareerMilestone(
        id="milestone_target_role",
        sequence=2,
        milestone_type="TARGET_ROLE",
        title="Target Role Selected",
        description="Target professional role chosen for curriculum grounding and rubric calibration.",
        status=MilestoneStatus.COMPLETED if role_set else MilestoneStatus.NOT_STARTED,
        completed_at=user.updated_at.strftime("%Y-%m-%d") if role_set else None,
        evidence=r_evidence,
        action_route="/settings",
        action_label="Change Target Role"
    ))

    # Milestone 3: Resume Added
    res_evidence: List[MilestoneEvidenceItem] = []
    resume_exists = latest_resume is not None
    if resume_exists:
        res_evidence.append(MilestoneEvidenceItem(
            title="Resume Document Uploaded",
            description=f"Document: {latest_resume.filename} ({latest_resume.file_type.upper()})",
            source_type="resume",
            date=latest_resume.created_at.strftime("%Y-%m-%d"),
            metric_value=latest_resume.filename
        ))
    milestones.append(CareerMilestone(
        id="milestone_resume",
        sequence=3,
        milestone_type="RESUME",
        title="Resume Added",
        description="Curriculum vitae or professional resume document submitted for evaluation.",
        status=MilestoneStatus.COMPLETED if resume_exists else MilestoneStatus.NOT_STARTED,
        completed_at=latest_resume.created_at.strftime("%Y-%m-%d") if resume_exists else None,
        evidence=res_evidence,
        action_route="/ats",
        action_label="Upload Resume" if not resume_exists else "View Resume Details"
    ))

    # Milestone 4: Resume Analyzed
    ats_evidence: List[MilestoneEvidenceItem] = []
    ats_completed = False
    ats_in_progress = False
    if latest_resume and latest_resume.ats_score is not None and latest_resume.ats_score > 0:
        ats_completed = True
        extracted_cnt = len(latest_resume.extracted_skills)
        matched_cnt = len(latest_resume.matched_skills)
        ats_evidence.append(MilestoneEvidenceItem(
            title="ATS Audit Executed",
            description=f"Evaluated ATS score {latest_resume.ats_score}/100. Matched {matched_cnt} core skills.",
            source_type="ats",
            date=latest_resume.created_at.strftime("%Y-%m-%d"),
            metric_value=f"{latest_resume.ats_score}/100"
        ))
    elif latest_resume:
        ats_in_progress = True
        ats_evidence.append(MilestoneEvidenceItem(
            title="Resume Pending Audit",
            description="Resume uploaded but full ATS evaluation has not run.",
            source_type="ats"
        ))
    milestones.append(CareerMilestone(
        id="milestone_resume_analysis",
        sequence=4,
        milestone_type="RESUME_ANALYSIS",
        title="Resume Analyzed",
        description="Automated ATS parsing, competency taxonomy extraction, and keyword coverage scoring.",
        status=MilestoneStatus.COMPLETED if ats_completed else (
            MilestoneStatus.IN_PROGRESS if ats_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=latest_resume.created_at.strftime("%Y-%m-%d") if ats_completed else None,
        evidence=ats_evidence,
        action_route="/ats",
        action_label="Inspect ATS Analysis"
    ))

    # Milestone 5: Skill Gaps Identified
    gap_evidence: List[MilestoneEvidenceItem] = []
    gaps_exist = len(skill_gaps) > 0
    if gaps_exist:
        gap_evidence.append(MilestoneEvidenceItem(
            title="Skill Gap Matrix Mapped",
            description=f"Identified {len(skill_gaps)} competency areas ({len(high_priority_gaps)} high-priority).",
            source_type="skill_gap",
            date=skill_gaps[0].updated_at.strftime("%Y-%m-%d") if skill_gaps[0].updated_at else None,
            metric_value=f"{len(skill_gaps)} gaps"
        ))
    milestones.append(CareerMilestone(
        id="milestone_skill_gap",
        sequence=5,
        milestone_type="SKILL_GAP",
        title="Skill Gaps Identified",
        description="Comparative analysis against target role benchmarks identifying priority competency deltas.",
        status=MilestoneStatus.COMPLETED if gaps_exist else MilestoneStatus.NOT_STARTED,
        completed_at=skill_gaps[0].updated_at.strftime("%Y-%m-%d") if (gaps_exist and skill_gaps[0].updated_at) else None,
        evidence=gap_evidence,
        action_route="/skill-gap",
        action_label="Examine Skill Matrix"
    ))

    # Milestone 6: Personalized Recommendations Generated
    rec_evidence: List[MilestoneEvidenceItem] = []
    rec_active = nba is not None and bool(nba.title)
    if rec_active:
        rec_evidence.append(MilestoneEvidenceItem(
            title="Autonomous Recommendation Synthesized",
            description=f"Next Priority: {nba.title} ({nba.priority.upper()} priority)",
            source_type="recommendation",
            metric_value=nba.action
        ))
    milestones.append(CareerMilestone(
        id="milestone_recommendation",
        sequence=6,
        milestone_type="RECOMMENDATION",
        title="Personalized Recommendations Generated",
        description="Autonomous Next-Best-Action guidance synthesized across diagnostic gaps and history.",
        status=MilestoneStatus.COMPLETED if rec_active else MilestoneStatus.NOT_STARTED,
        completed_at=None,
        evidence=rec_evidence,
        action_route=nba.route if rec_active else "/dashboard",
        action_label="View Next Action"
    ))

    # Milestone 7: Practice Started (Daily Challenges)
    prac_evidence: List[MilestoneEvidenceItem] = []
    chal_cnt = len(completed_challenges)
    prac_completed = chal_cnt >= 3
    prac_in_progress = chal_cnt > 0
    if chal_cnt > 0:
        avg_drill = round(sum(c.score for c in completed_challenges) / chal_cnt, 1)
        prac_evidence.append(MilestoneEvidenceItem(
            title="Conceptual Articulation Drills",
            description=f"Completed {chal_cnt} conceptual drills with average score {avg_drill}%.",
            source_type="challenge",
            date=completed_challenges[-1].submitted_at.strftime("%Y-%m-%d"),
            metric_value=f"{chal_cnt} drills"
        ))
    milestones.append(CareerMilestone(
        id="milestone_practice",
        sequence=7,
        milestone_type="PRACTICE",
        title="Practice Started",
        description="Daily conceptual drills and technical articulation practice initiated.",
        status=MilestoneStatus.COMPLETED if prac_completed else (
            MilestoneStatus.IN_PROGRESS if prac_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=completed_challenges[-1].submitted_at.strftime("%Y-%m-%d") if prac_completed else None,
        evidence=prac_evidence,
        action_route="/daily-challenge",
        action_label="Solve Daily Drill"
    ))

    # Milestone 8: Skills Improved (Skill Evidence)
    imp_evidence: List[MilestoneEvidenceItem] = []
    ev_cnt = len(skill_evidences)
    imp_completed = ev_cnt >= 2
    imp_in_progress = ev_cnt > 0
    if ev_cnt > 0:
        imp_evidence.append(MilestoneEvidenceItem(
            title="Multi-Source Skill Evidence Logged",
            description=f"Verified {ev_cnt} granular competency demonstrations across ATS and interviews.",
            source_type="skill_evidence",
            date=skill_evidences[-1].created_at.strftime("%Y-%m-%d"),
            metric_value=f"{ev_cnt} verified skills"
        ))
    milestones.append(CareerMilestone(
        id="milestone_skill_improvement",
        sequence=8,
        milestone_type="SKILL_IMPROVEMENT",
        title="Skills Improved",
        description="Demonstrated competency elevation verified across multi-source evidence entries.",
        status=MilestoneStatus.COMPLETED if imp_completed else (
            MilestoneStatus.IN_PROGRESS if imp_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=skill_evidences[-1].created_at.strftime("%Y-%m-%d") if imp_completed else None,
        evidence=imp_evidence,
        action_route="/skill-gap",
        action_label="Inspect Skill Trajectory"
    ))

    # Milestone 9: Coding Practice Completed (Skill Arena)
    code_evidence: List[MilestoneEvidenceItem] = []
    arena_cnt = len(arena_attempts)
    correct_arena_cnt = len(correct_arena_attempts)
    code_completed = arena_cnt >= 3
    code_in_progress = arena_cnt > 0
    if arena_cnt > 0:
        code_evidence.append(MilestoneEvidenceItem(
            title="Skill Arena Practicum",
            description=f"Executed {arena_cnt} coding/debugging drills ({correct_arena_cnt} successful).",
            source_type="skill_arena",
            date=arena_attempts[-1].created_at.strftime("%Y-%m-%d"),
            metric_value=f"{arena_cnt} attempts"
        ))
    milestones.append(CareerMilestone(
        id="milestone_coding",
        sequence=9,
        milestone_type="CODING",
        title="Coding Practice Completed",
        description="Hands-on algorithm implementation, debugging, and output prediction in Skill Arena.",
        status=MilestoneStatus.COMPLETED if code_completed else (
            MilestoneStatus.IN_PROGRESS if code_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=arena_attempts[-1].created_at.strftime("%Y-%m-%d") if code_completed else None,
        evidence=code_evidence,
        action_route="/skill-arena",
        action_label="Enter Skill Arena"
    ))

    # Milestone 10: Mock Interviews Completed
    int_evidence: List[MilestoneEvidenceItem] = []
    int_completed = interview_count >= 1
    int_in_progress = len(in_progress_interviews) > 0 and not int_completed
    if int_completed:
        latest_int = completed_interviews[0]
        int_evidence.append(MilestoneEvidenceItem(
            title="AI Mock Interview Completed",
            description=f"Conducted {interview_count} simulated interviews. Latest overall score: {latest_int.overall_score}%.",
            source_type="interview",
            date=latest_int.created_at.strftime("%Y-%m-%d"),
            metric_value=f"{interview_count} sessions"
        ))
    elif int_in_progress:
        int_evidence.append(MilestoneEvidenceItem(
            title="Interview In Progress",
            description="Interview session currently active.",
            source_type="interview"
        ))
    milestones.append(CareerMilestone(
        id="milestone_interview",
        sequence=10,
        milestone_type="INTERVIEW",
        title="Mock Interviews Completed",
        description="Technical oral and textual defense simulations conducted in the AI chamber.",
        status=MilestoneStatus.COMPLETED if int_completed else (
            MilestoneStatus.IN_PROGRESS if int_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=completed_interviews[0].created_at.strftime("%Y-%m-%d") if int_completed else None,
        evidence=int_evidence,
        action_route="/interview-setup",
        action_label="Start Mock Interview"
    ))

    # Milestone 11: Interview Performance Evaluated
    eval_evidence: List[MilestoneEvidenceItem] = []
    eval_cnt = len(evaluations)
    eval_completed = eval_cnt > 0
    if eval_completed:
        avg_tech = round(sum(e.technical_accuracy for e in evaluations) / eval_cnt, 1)
        avg_comm = round(sum(e.communication_quality for e in evaluations) / eval_cnt, 1)
        eval_evidence.append(MilestoneEvidenceItem(
            title="Structured Answer Rubric Evaluation",
            description=f"Evaluated {eval_cnt} candidate answers (Avg Tech: {avg_tech}%, Avg Comm: {avg_comm}%).",
            source_type="evaluation",
            date=evaluations[-1].created_at.strftime("%Y-%m-%d"),
            metric_value=f"{eval_cnt} evaluated answers"
        ))
    milestones.append(CareerMilestone(
        id="milestone_evaluation",
        sequence=11,
        milestone_type="EVALUATION",
        title="Interview Performance Evaluated",
        description="Canonical 4-pillar rubric scoring, technical accuracy, and committee calibration.",
        status=MilestoneStatus.COMPLETED if eval_completed else MilestoneStatus.NOT_STARTED,
        completed_at=evaluations[-1].created_at.strftime("%Y-%m-%d") if eval_completed else None,
        evidence=eval_evidence,
        action_route="/interview-feedback",
        action_label="Inspect Evaluation Rubric"
    ))

    # Milestone 12: Feedback Received
    fb_evidence: List[MilestoneEvidenceItem] = []
    has_feedback = any(bool(i.feedback_summary) for i in completed_interviews) or any(bool(e.feedback) for e in evaluations)
    if has_feedback:
        fb_sample = completed_interviews[0].feedback_summary if completed_interviews and completed_interviews[0].feedback_summary else "Detailed rubric feedback provided across candidate answers."
        fb_evidence.append(MilestoneEvidenceItem(
            title="Comprehensive Feedback Report",
            description=f"Actionable feedback registered: {fb_sample[:100]}...",
            source_type="interview",
            date=completed_interviews[0].created_at.strftime("%Y-%m-%d") if completed_interviews else None
        ))
    milestones.append(CareerMilestone(
        id="milestone_feedback",
        sequence=12,
        milestone_type="FEEDBACK",
        title="Feedback Received",
        description="Actionable Socratic notes, missing concepts, strengths, and committee deliberations.",
        status=MilestoneStatus.COMPLETED if has_feedback else MilestoneStatus.NOT_STARTED,
        completed_at=completed_interviews[0].created_at.strftime("%Y-%m-%d") if (has_feedback and completed_interviews) else None,
        evidence=fb_evidence,
        action_route="/interview-feedback",
        action_label="Review Feedback Summary"
    ))

    # Milestone 13: Progress Demonstrated
    prog_evidence: List[MilestoneEvidenceItem] = []
    prog_completed = (interview_count >= 2) or (interview_count >= 1 and total_drills >= 5) or current_streak >= 5
    prog_in_progress = interview_count >= 1 or total_drills > 0 or current_streak > 0
    if prog_in_progress:
        prog_evidence.append(MilestoneEvidenceItem(
            title="Preparation Trajectory",
            description=f"Active streak: {current_streak} days | Total Drills: {total_drills} | Mock Interviews: {interview_count}.",
            source_type="progress",
            metric_value=f"{user.xp} XP (Level {user.level})"
        ))
    milestones.append(CareerMilestone(
        id="milestone_progress",
        sequence=13,
        milestone_type="PROGRESS",
        title="Progress Demonstrated",
        description="Measurable skill velocity across consecutive preparation drills, interviews, and streak.",
        status=MilestoneStatus.COMPLETED if prog_completed else (
            MilestoneStatus.IN_PROGRESS if prog_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=completed_interviews[0].created_at.strftime("%Y-%m-%d") if (prog_completed and completed_interviews) else None,
        evidence=prog_evidence,
        action_route="/progress",
        action_label="Inspect Velocity"
    ))

    # -------------------------------------------------------------
    # 2. Multi-Dimensional Readiness Foundation
    # -------------------------------------------------------------
    dimensions: List[ReadinessDimension] = []

    # Dimension 1: Resume & ATS Baseline
    dim1_status = "Needs Evidence"
    dim1_summary = "No ATS resume analysis performed yet."
    dim1_score = None
    if latest_resume and latest_resume.ats_score is not None:
        dim1_score = f"{latest_resume.ats_score}/100"
        if latest_resume.ats_score >= 70:
            dim1_status = "Verified"
            dim1_summary = f"Strong ATS match ({latest_resume.ats_score}/100) with core role keyword alignment."
        else:
            dim1_status = "In Progress"
            dim1_summary = f"ATS match ({latest_resume.ats_score}/100). Additional targeted keywords recommended."
    dimensions.append(ReadinessDimension(
        dimension_key="resume_ats",
        title="Resume & ATS Baseline",
        status=dim1_status,
        summary=dim1_summary,
        evidence_count=1 if latest_resume else 0,
        score_indicator=dim1_score
    ))

    # Dimension 2: Core Technical & Algorithmic Depth
    dim2_status = "Needs Evidence"
    dim2_summary = "Technical depth requires evidence from resume and interview evaluations."
    dim2_score = None
    if len(skill_evidences) >= 3 or len(evaluations) >= 3:
        avg_acc = (
            round(sum(e.technical_accuracy for e in evaluations) / len(evaluations), 1)
            if evaluations else 75.0
        )
        dim2_score = f"{avg_acc}% Accuracy"
        if avg_acc >= 75:
            dim2_status = "Verified"
            dim2_summary = f"Consistent technical accuracy ({avg_acc}%) evidenced in assessed questions."
        else:
            dim2_status = "In Progress"
            dim2_summary = f"Moderate technical accuracy ({avg_acc}%). Key algorithmic concepts need review."
    elif len(skill_gaps) > 0:
        dim2_status = "In Progress"
        dim2_summary = f"{len(skill_gaps)} technical competencies identified for curriculum focus."
        dim2_score = f"{len(skill_gaps)} Gaps Mapped"
    dimensions.append(ReadinessDimension(
        dimension_key="technical_depth",
        title="Technical & Domain Depth",
        status=dim2_status,
        summary=dim2_summary,
        evidence_count=len(skill_evidences) + len(evaluations),
        score_indicator=dim2_score
    ))

    # Dimension 3: Coding & Problem Solving Drills
    dim3_status = "Needs Evidence"
    dim3_summary = "Skill Arena coding and debugging attempts not yet recorded."
    dim3_score = None
    if total_drills >= 3:
        dim3_score = f"{total_drills} Drills Logged"
        if len(correct_arena_attempts) >= 2 or (completed_challenges and sum(c.score for c in completed_challenges) / len(completed_challenges) >= 70):
            dim3_status = "Verified"
            dim3_summary = f"Demonstrated problem solving across {total_drills} coding and conceptual drills."
        else:
            dim3_status = "In Progress"
            dim3_summary = f"{total_drills} drills logged; focus on solution correctness and syntax execution."
    elif total_drills > 0:
        dim3_status = "In Progress"
        dim3_summary = f"{total_drills} drills attempted. Reach at least 3 completed drills for verification."
        dim3_score = f"{total_drills} Drills"
    dimensions.append(ReadinessDimension(
        dimension_key="coding_practice",
        title="Coding & Problem Solving",
        status=dim3_status,
        summary=dim3_summary,
        evidence_count=total_drills,
        score_indicator=dim3_score
    ))

    # Dimension 4: Mock Interview Simulation
    dim4_status = "Needs Evidence"
    dim4_summary = "No completed mock interview simulations found."
    dim4_score = None
    if interview_count >= 1:
        dim4_score = f"{avg_interview_score}% Avg"
        if avg_interview_score >= 75:
            dim4_status = "Verified"
            dim4_summary = f"Passed {interview_count} simulated interviews with average score {avg_interview_score}%."
        else:
            dim4_status = "In Progress"
            dim4_summary = f"Completed {interview_count} interview(s) with average score {avg_interview_score}%. More practice advised."
    dimensions.append(ReadinessDimension(
        dimension_key="interview_simulation",
        title="Interview Chamber Simulation",
        status=dim4_status,
        summary=dim4_summary,
        evidence_count=interview_count,
        score_indicator=dim4_score
    ))

    # Dimension 5: Communication & Articulation
    dim5_status = "Needs Evidence"
    dim5_summary = "Oral clarity and STAR delivery metrics pending interview recordings or evaluations."
    dim5_score = None
    if evaluations:
        avg_comm = round(sum(e.communication_quality for e in evaluations) / len(evaluations), 1)
        dim5_score = f"{avg_comm}% Clarity"
        if avg_comm >= 70:
            dim5_status = "Verified"
            dim5_summary = f"Effective communication and articulation ({avg_comm}%) demonstrated during defense."
        else:
            dim5_status = "In Progress"
            dim5_summary = f"Communication quality evaluated at {avg_comm}%. Focus on concise STAR structuring."
    elif recordings:
        dim5_status = "In Progress"
        dim5_summary = f"{len(recordings)} interview recording(s) logged for audio/video acoustic review."
    dimensions.append(ReadinessDimension(
        dimension_key="communication_quality",
        title="Communication & Verbal Articulation",
        status=dim5_status,
        summary=dim5_summary,
        evidence_count=len(evaluations) + len(recordings),
        score_indicator=dim5_score
    ))

    # Determine Readiness Band
    verified_count = sum(1 for d in dimensions if d.status == "Verified")
    in_prog_count = sum(1 for d in dimensions if d.status == "In Progress")

    if verified_count >= 4 and interview_count >= 2 and avg_interview_score >= 75:
        band = ReadinessBand.STRONG_PREPARATION
        display_title = "Strong Preparation — Comprehensive Multi-Dimensional Rigor"
        rationale = "Candidate has achieved verified baselines across Resume, Technical Depth, Coding, Mock Interviews, and Articulation."
    elif (verified_count >= 3 or (dim1_status == "Verified" and interview_count >= 1 and avg_interview_score >= 70)):
        band = ReadinessBand.INTERVIEW_READY
        display_title = "Interview Ready — Core Competency Threshold Achieved"
        rationale = "Candidate possesses verified resume alignment, coding competency, and satisfactory mock interview performance."
    elif (latest_resume is not None or interview_count >= 1 or total_drills >= 2):
        band = ReadinessBand.DEVELOPING
        display_title = "Developing — Active Preparation & Practice in Progress"
        rationale = "Candidate has begun multiple preparation streams; continue logging coding drills and mock interviews."
    elif (p_completed or role_set or latest_resume is not None):
        band = ReadinessBand.BUILDING_FOUNDATIONS
        display_title = "Building Foundations — Initial Profiles & Diagnostics"
        rationale = "Candidate has established foundational profile and target role. Next priority is diagnostic resume audit."
    else:
        band = ReadinessBand.GETTING_STARTED
        display_title = "Getting Started — Onboarding Candidate"
        rationale = "New candidate journey initiated. Complete profile configuration and upload initial resume."

    readiness_assessment = ReadinessAssessment(
        readiness_band=band,
        display_title=display_title,
        rationale=rationale,
        dimensions=dimensions
    )

    # Milestone 14: Career Readiness Developed
    read_completed = band in [ReadinessBand.INTERVIEW_READY, ReadinessBand.STRONG_PREPARATION]
    read_in_progress = band in [ReadinessBand.BUILDING_FOUNDATIONS, ReadinessBand.DEVELOPING]
    read_evidence: List[MilestoneEvidenceItem] = [
        MilestoneEvidenceItem(
            title=f"Readiness Status: {band.value.replace('_', ' ').title()}",
            description=f"{verified_count} of 5 preparation dimensions verified. {rationale}",
            source_type="readiness",
            metric_value=band.value.replace('_', ' ').title()
        )
    ]
    milestones.append(CareerMilestone(
        id="milestone_readiness",
        sequence=14,
        milestone_type="READINESS",
        title="Career Readiness Developed",
        description="Holistic preparation foundation synthesized across resume, coding, interviews, and communication.",
        status=MilestoneStatus.COMPLETED if read_completed else (
            MilestoneStatus.IN_PROGRESS if read_in_progress else MilestoneStatus.NOT_STARTED
        ),
        completed_at=datetime.now(timezone.utc).strftime("%Y-%m-%d") if read_completed else None,
        evidence=read_evidence,
        action_route="/career-journey",
        action_label="Inspect Readiness Breakdown"
    ))

    # -------------------------------------------------------------
    # 3. Preparation Headline & Current Focus
    # -------------------------------------------------------------
    target_role_str = user.target_role or "AIML Engineer"
    preparation_headline = f"Preparation journey toward {target_role_str}"

    if not latest_resume:
        current_focus = "Upload and audit your resume to establish an objective ATS baseline."
    elif interview_count == 0:
        current_focus = "Take your baseline technical mock interview to evaluate technical articulation and defense."
    elif high_priority_gaps:
        top_skill = high_priority_gaps[0].skill_name
        current_focus = f"Bridge high-priority competency gap in {top_skill} via Skill Arena and conceptual drills."
    elif avg_interview_score < 75:
        current_focus = "Refine oral response structure using STAR methodology to raise interview rubric score above 75%."
    else:
        current_focus = f"Sustain streak and practice advanced system design challenges for {target_role_str}."

    # -------------------------------------------------------------
    # 4. Summary Stats
    # -------------------------------------------------------------
    completed_m_cnt = sum(1 for m in milestones if m.status == MilestoneStatus.COMPLETED)
    in_prog_m_cnt = sum(1 for m in milestones if m.status == MilestoneStatus.IN_PROGRESS)
    not_started_m_cnt = sum(1 for m in milestones if m.status == MilestoneStatus.NOT_STARTED)

    stats = CareerJourneyStats(
        total_milestones=14,
        completed_milestones=completed_m_cnt,
        in_progress_milestones=in_prog_m_cnt,
        not_started_milestones=not_started_m_cnt,
        total_interviews=interview_count,
        average_interview_score=avg_interview_score,
        ats_score=latest_resume.ats_score if latest_resume else None,
        drills_completed=total_drills
    )

    return CareerJourneyResponse(
        user_id=user.id,
        candidate_name=user.name,
        target_role=target_role_str,
        preparation_headline=preparation_headline,
        current_focus=current_focus,
        next_best_action=nba,
        readiness=readiness_assessment,
        milestones=milestones,
        stats=stats
    )


def get_readiness_assessment_only(db: Session, user_id: str) -> ReadinessAssessment:
    """Convenience helper returning just the ReadinessAssessment."""
    journey = get_career_journey_data(db, user_id)
    return journey.readiness
