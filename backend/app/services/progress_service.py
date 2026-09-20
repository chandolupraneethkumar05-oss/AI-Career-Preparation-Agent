"""
Progress & Dashboard Aggregation Service
AI Career Preparation Agent
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import User, Interview, Activity, Achievement, ResumeAnalysis
from ..schemas.recommendation import DashboardProgressResponse
from .activity_service import calculate_streaks, has_practiced_today, get_user_activities
from .skill_service import get_user_skill_profile
from .recommendation_service import evaluate_next_best_action


ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "ach-first-interview",
        "title": "First Interview",
        "desc": "Completed your first AI mock interview session",
        "icon": "🏅",
        "category": "Milestone",
        "check": lambda u, count, streak: count >= 1
    },
    {
        "id": "ach-7-day-streak",
        "title": "7-Day Streak",
        "desc": "Maintained continuous career preparation for 7 consecutive days",
        "icon": "🔥",
        "category": "Consistency",
        "check": lambda u, count, streak: streak >= 7 or u.longest_streak >= 7
    },
    {
        "id": "ach-5-interviews",
        "title": "Interview Explorer",
        "desc": "Complete 5 mock interview practice rounds",
        "icon": "🎯",
        "category": "Mastery",
        "check": lambda u, count, streak: count >= 5
    },
    {
        "id": "ach-resume-ready",
        "title": "Resume Optimizer",
        "desc": "Audited your resume against ATS industry algorithms",
        "icon": "📄",
        "category": "Preparation",
        "check": lambda u, count, streak: True  # Checked via activity presence
    },
    {
        "id": "ach-practice-champion",
        "title": "Practice Champion",
        "desc": "Solved and submitted daily conceptual articulation drills",
        "icon": "⚡",
        "category": "Daily Habit",
        "check": lambda u, count, streak: True
    }
]


def get_dashboard_progress(db: Session, user_id: str) -> DashboardProgressResponse:
    """
    Synthesizes candidate's real-time career preparation metrics into
    a unified dashboard response payload.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    # Interviews metrics
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .all()
    )
    interview_count = len(interviews)
    avg_score = round(sum(i.overall_score for i in interviews) / interview_count, 1) if interview_count > 0 else 0.0

    # Streak & practice today
    current_streak, longest_streak = calculate_streaks(db, user_id)
    practiced = has_practiced_today(db, user_id)

    # Next Best Action
    nba = evaluate_next_best_action(db, user_id)

    # Radar profile
    skill_profile = get_user_skill_profile(db, user_id)
    radar_data = [
        {"subject": r.subject, "score": r.score} for r in skill_profile.radar_data
    ]

    # Recent activities
    recent_acts = get_user_activities(db, user_id, limit=5)
    activities_payload = [
        {
            "id": a.id,
            "type": a.type,
            "title": a.title,
            "xp_earned": a.xp_earned,
            "timestamp": a.timestamp.isoformat(),
            "related_module": a.related_module
        }
        for a in recent_acts
    ]

    # ATS scan detection & genuine ATS score
    latest_resume = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(desc(ResumeAnalysis.created_at))
        .first()
    )
    has_ats = (latest_resume is not None) or any(a.type in ["resume_analyzed", "ats_scanned"] for a in recent_acts)
    ats_score_val = latest_resume.ats_score if latest_resume else None

    # Dynamic readiness calculation
    if interview_count == 0 and not has_ats:
        readiness = 0
    elif interview_count == 0:
        readiness = 40
    else:
        readiness = min(100, int((avg_score * 0.7) + (min(10, current_streak) * 3)))

    # Count unlocked achievements
    unlocked_count = 1 if interview_count >= 1 else 0
    if current_streak >= 7 or user.longest_streak >= 7:
        unlocked_count += 1
    if has_ats:
        unlocked_count += 1

    return DashboardProgressResponse(
        user_id=user.id,
        candidate_name=user.name,
        target_role=user.target_role,
        total_xp=user.xp,
        level=user.level,
        current_streak=current_streak,
        longest_streak=longest_streak,
        practiced_today=practiced,
        interviews_count=interview_count,
        average_interview_score=avg_score,
        ats_score=ats_score_val,
        readiness_percentage=readiness,
        next_best_action=nba,
        radar_data=radar_data,
        recent_activities=activities_payload,
        unlocked_achievements_count=unlocked_count
    )


def get_user_achievements(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Evaluates gamified achievement milestones."""
    user = db.query(User).filter(User.id == user_id).first()
    interviews = db.query(Interview).filter(Interview.user_id == user_id).all()
    interview_count = len(interviews)
    current_streak, longest_streak = calculate_streaks(db, user_id)

    has_ats = (
        db.query(Activity.id)
        .filter(Activity.user_id == user_id)
        .filter(Activity.type.in_(["resume_analyzed", "ats_scanned"]))
        .first()
    ) is not None

    has_challenge = (
        db.query(Activity.id)
        .filter(Activity.user_id == user_id)
        .filter(Activity.type == "challenge_completed")
        .first()
    ) is not None

    results = []
    for defn in ACHIEVEMENT_DEFINITIONS:
        unlocked = False
        progress = 0

        if defn["id"] == "ach-first-interview":
            unlocked = interview_count >= 1
            progress = 100 if unlocked else 0
        elif defn["id"] == "ach-7-day-streak":
            unlocked = current_streak >= 7 or longest_streak >= 7
            progress = min(100, int((max(current_streak, longest_streak) / 7) * 100))
        elif defn["id"] == "ach-5-interviews":
            unlocked = interview_count >= 5
            progress = min(100, int((interview_count / 5) * 100))
        elif defn["id"] == "ach-resume-ready":
            unlocked = has_ats
            progress = 100 if unlocked else 0
        elif defn["id"] == "ach-practice-champion":
            unlocked = has_challenge
            progress = 100 if unlocked else 0

        results.append({
            "id": defn["id"],
            "title": defn["title"],
            "description": defn["desc"],
            "icon": defn["icon"],
            "category": defn["category"],
            "unlocked": unlocked,
            "progress": progress
        })

    return results
