"""
Weekly AI Career Report Service
AI Career Preparation Agent
"""

import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import (
    User,
    WeeklyReport,
    Interview,
    InterviewAnswer,
    AnswerEvaluation,
    SkillArenaAttempt,
    Challenge,
    Activity,
    SkillGap,
    SkillEvidence
)
from ..schemas.weekly_report import (
    WeeklyReportResponse,
    WeeklyReportSummary,
    SkillProgressItem,
    InterviewPerformanceSummary,
    CodingPerformanceSummary,
    AreaRequiringAttention,
    NextWeekPriority,
    ReadinessSummary,
    WeeklyReportHistoryItem
)
from .career_journey_service import get_career_journey_data


def utc_now():
    return datetime.now(timezone.utc)


def _to_utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _get_week_bounds(target_dt: Optional[datetime] = None) -> tuple[datetime, datetime, int, int]:
    """Returns (start_of_week, end_of_week, iso_week, iso_year)."""
    now = target_dt or utc_now()
    # Normalize to Monday 00:00:00 UTC
    start_of_week = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
    iso_year, iso_week, _ = now.isocalendar()
    return start_of_week, end_of_week, iso_week, iso_year


def generate_weekly_report(
    db: Session,
    user_id: str,
    target_dt: Optional[datetime] = None,
    force_regenerate: bool = False
) -> WeeklyReportResponse:
    """
    Generates or retrieves a data-grounded Weekly AI Career Report for candidate.
    Zero fabricated numbers: all stats strictly derived from candidate records.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    start_date, end_date, week_num, year = _get_week_bounds(target_dt)

    # Check for existing report if not forcing regeneration
    if not force_regenerate:
        existing = (
            db.query(WeeklyReport)
            .filter(
                WeeklyReport.user_id == user_id,
                WeeklyReport.week_number == week_num,
                WeeklyReport.year == year
            )
            .first()
        )
        if existing:
            return _format_report_response(existing)

    # 1. Candidate Activity & XP Aggregation
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.timestamp >= start_date,
            Activity.timestamp <= end_date
        )
        .all()
    )
    total_xp = sum(a.xp_earned for a in activities)
    active_days = len({a.timestamp.date() for a in activities})

    # Prior week comparison (previous 7 days)
    prev_start = start_date - timedelta(days=7)
    prev_end = start_date - timedelta(seconds=1)
    prev_activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.timestamp >= prev_start,
            Activity.timestamp <= prev_end
        )
        .all()
    )
    prev_xp = sum(a.xp_earned for a in prev_activities)

    # 2. Interviews Query
    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.completed_at >= start_date,
            Interview.completed_at <= end_date
        )
        .all()
    )
    prev_interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.completed_at >= prev_start,
            Interview.completed_at <= prev_end
        )
        .count()
    )

    valid_scores = [i.score for i in interviews if i.score and i.score > 0]
    avg_score = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else None
    highest_round = (
        max(interviews, key=lambda x: (x.score or 0)).interview_type
        if interviews else None
    )

    # Interview evaluations
    evaluations = (
        db.query(AnswerEvaluation)
        .filter(
            AnswerEvaluation.user_id == user_id,
            AnswerEvaluation.created_at >= start_date,
            AnswerEvaluation.created_at <= end_date
        )
        .all()
    )

    comm_scores = [e.communication_quality for e in evaluations if getattr(e, 'communication_quality', 0) > 0]
    avg_comm = round(sum(comm_scores) / len(comm_scores), 1) if comm_scores else None

    # Collect strengths and weaknesses
    strengths_pool = []
    weaknesses_pool = []
    for ev in evaluations:
        try:
            st = json.loads(ev.strengths_json or "[]")
            if isinstance(st, list):
                strengths_pool.extend(st[:2])
            wk = json.loads(ev.weaknesses_json or "[]")
            if isinstance(wk, list):
                weaknesses_pool.extend(wk[:2])
        except Exception:
            pass

    key_strengths = list(dict.fromkeys(strengths_pool))[:4]
    primary_weaknesses = list(dict.fromkeys(weaknesses_pool))[:4]
    if not key_strengths and interviews:
        key_strengths = ["Completed realistic mock interview rounds", "Demonstrated problem-solving structure"]
    if not primary_weaknesses and not interviews:
        primary_weaknesses = ["No mock interviews completed this week"]

    # 3. Coding Performance (SkillArena)
    coding_attempts = (
        db.query(SkillArenaAttempt)
        .filter(
            SkillArenaAttempt.user_id == user_id,
            SkillArenaAttempt.created_at >= start_date,
            SkillArenaAttempt.created_at <= end_date
        )
        .all()
    )
    prev_coding = (
        db.query(SkillArenaAttempt)
        .filter(
            SkillArenaAttempt.user_id == user_id,
            SkillArenaAttempt.created_at >= prev_start,
            SkillArenaAttempt.created_at <= prev_end,
            SkillArenaAttempt.correctness == True
        )
        .count()
    )

    coding_solved = sum(1 for a in coding_attempts if a.correctness or (a.score and a.score >= 70))
    coding_skills = list(dict.fromkeys([a.skill for a in coding_attempts if a.skill]))
    coding_pass_rate = (
        round((coding_solved / len(coding_attempts)) * 100, 1)
        if coding_attempts else 0.0
    )

    # 4. Daily Challenges
    challenges = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.completed == True,
            Challenge.submitted_at >= start_date,
            Challenge.submitted_at <= end_date
        )
        .all()
    )

    # 5. Skills Progress
    evidences = (
        db.query(SkillEvidence)
        .filter(
            SkillEvidence.user_id == user_id,
            SkillEvidence.created_at >= start_date,
            SkillEvidence.created_at <= end_date
        )
        .all()
    )
    skill_counts: Dict[str, int] = {}
    for ev in evidences:
        skill_counts[ev.skill_name] = skill_counts.get(ev.skill_name, 0) + 1

    skills_progress_list = []
    for skill_name, cnt in list(skill_counts.items())[:6]:
        status = "proficient" if cnt >= 3 else "improving" if cnt >= 1 else "needs_practice"
        skills_progress_list.append(
            SkillProgressItem(
                skill_name=skill_name,
                status=status,
                evidence_count=cnt,
                recent_activity="Verified practice activity recorded this week"
            )
        )

    if not skills_progress_list:
        # Fallback to candidate's top skill gaps
        active_gaps = (
            db.query(SkillGap)
            .filter(SkillGap.user_id == user_id)
            .limit(4)
            .all()
        )
        for g in active_gaps:
            skills_progress_list.append(
                SkillProgressItem(
                    skill_name=g.skill_name,
                    status="needs_practice",
                    evidence_count=0,
                    recent_activity="Identified for target practice"
                )
            )

    # 6. Areas Requiring Attention
    active_gaps = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == user_id)
        .order_by(desc(SkillGap.priority))
        .limit(3)
        .all()
    )
    areas_attention = []
    for g in active_gaps:
        areas_attention.append(
            AreaRequiringAttention(
                area_name=g.skill_name,
                reason=f"Identified as a high-priority skill requirement for {user.target_role}.",
                action_recommendation=f"Complete a focused coding practice session or mock interview round in {g.skill_name}.",
                action_route="/skill-gap"
            )
        )

    if not areas_attention and not interviews:
        areas_attention.append(
            AreaRequiringAttention(
                area_name="Mock Interview Practice",
                reason="Regular verbal practice builds confidence, speaking pace, and STAR answer structure.",
                action_recommendation="Schedule and complete at least one realistic AI mock interview session.",
                action_route="/interview-setup"
            )
        )

    # 7. Next Week Priorities (3 to 5 targeted items)
    priorities = [
        NextWeekPriority(
            priority_title="Conduct 2 Mock Interview Sessions",
            description=f"Engage in technical and behavioral rounds targeting {user.target_role}.",
            target_metric="2 Completed Sessions",
            suggested_action="Start an adaptive session in Written or Face-to-Face mode.",
            action_route="/interview-setup"
        ),
        NextWeekPriority(
            priority_title="Solve 3 Algorithm Drills in Skill Arena",
            description="Strengthen problem-solving runtime efficiency and test case coverage.",
            target_metric="3 Passed Drills",
            suggested_action="Open Skill Arena and complete recommended challenges.",
            action_route="/skill-arena"
        ),
        NextWeekPriority(
            priority_title="Maintain 5-Day Daily Practice Streak",
            description="Consistent daily practice reinforces retention and core engineering concepts.",
            target_metric="5 Active Days",
            suggested_action="Solve today's question on the Daily Practice page.",
            action_route="/daily-challenge"
        )
    ]

    # 8. Readiness Summary
    journey_data = get_career_journey_data(db, user_id)
    readiness_percentage = int(
        (journey_data.stats.completed_milestones / max(1, journey_data.stats.total_milestones)) * 100
    )
    readiness_summary = ReadinessSummary(
        readiness_band=journey_data.readiness.readiness_band.value,
        overall_score=readiness_percentage,
        completed_milestones=journey_data.stats.completed_milestones,
        total_milestones=journey_data.stats.total_milestones,
        trend="improving" if (len(interviews) > prev_interviews or total_xp > prev_xp) else "steady"
    )

    # 9. AI Pedagogical Interpretation
    ai_text = (
        f"Weekly Career Report for {user.name} (Week {week_num}, {year}). "
        f"You completed {len(interviews)} mock interview session(s), solved {coding_solved} coding challenge(s), "
        f"and earned {total_xp} XP across {active_days} active practice day(s). "
    )
    if len(interviews) > 0:
        ai_text += f"Your interview average score reached {avg_score}/100. "
    if key_strengths:
        ai_text += f"Key strengths observed: {', '.join(key_strengths[:2])}. "
    if areas_attention:
        ai_text += f"Recommended focus for next week: deepen practice in {areas_attention[0].area_name}."

    # Pack summaries
    summary_obj = WeeklyReportSummary(
        total_interviews_this_week=len(interviews),
        total_coding_solved_this_week=coding_solved,
        total_daily_drills_this_week=len(challenges),
        total_xp_gained_this_week=total_xp,
        active_days_count=active_days,
        streak_current=user.streak,
        vs_previous_week={
            "interviews_diff": len(interviews) - prev_interviews,
            "coding_diff": coding_solved - prev_coding,
            "xp_diff": total_xp - prev_xp
        }
    )

    interview_summary = InterviewPerformanceSummary(
        total_sessions=len(interviews),
        average_score=avg_score,
        highest_scoring_round=highest_round,
        average_wpm=None,
        star_adherence_rate=avg_comm,
        key_strengths=key_strengths,
        primary_weaknesses=primary_weaknesses
    )

    coding_summary = CodingPerformanceSummary(
        problems_attempted=len(coding_attempts),
        problems_solved=coding_solved,
        languages_used=coding_skills,
        pass_rate=coding_pass_rate
    )

    report_id = f"wr-{week_num}-{year}-{user_id}"

    # Upsert into database
    existing = db.query(WeeklyReport).filter(WeeklyReport.id == report_id).first()
    if existing:
        existing.summary_json = json.dumps(summary_obj.model_dump())
        existing.skills_progress_json = json.dumps([s.model_dump() for s in skills_progress_list])
        existing.interview_performance_json = json.dumps(interview_summary.model_dump())
        existing.coding_performance_json = json.dumps(coding_summary.model_dump())
        existing.areas_requiring_attention_json = json.dumps([a.model_dump() for a in areas_attention])
        existing.next_week_priorities_json = json.dumps([p.model_dump() for p in priorities])
        existing.readiness_summary_json = json.dumps(readiness_summary.model_dump())
        existing.ai_interpretation = ai_text
        report_record = existing
    else:
        report_record = WeeklyReport(
            id=report_id,
            user_id=user_id,
            week_number=week_num,
            year=year,
            start_date=start_date,
            end_date=end_date,
            summary_json=json.dumps(summary_obj.model_dump()),
            skills_progress_json=json.dumps([s.model_dump() for s in skills_progress_list]),
            interview_performance_json=json.dumps(interview_summary.model_dump()),
            coding_performance_json=json.dumps(coding_summary.model_dump()),
            areas_requiring_attention_json=json.dumps([a.model_dump() for a in areas_attention]),
            next_week_priorities_json=json.dumps([p.model_dump() for p in priorities]),
            readiness_summary_json=json.dumps(readiness_summary.model_dump()),
            ai_interpretation=ai_text,
            created_at=utc_now()
        )
        db.add(report_record)

    db.commit()
    db.refresh(report_record)
    return _format_report_response(report_record)


def _format_report_response(record: WeeklyReport) -> WeeklyReportResponse:
    """Helper to convert WeeklyReport ORM model into WeeklyReportResponse."""
    summary_dict = json.loads(record.summary_json or "{}")
    skills_list = json.loads(record.skills_progress_json or "[]")
    interview_dict = json.loads(record.interview_performance_json or "{}")
    coding_dict = json.loads(record.coding_performance_json or "{}")
    attention_list = json.loads(record.areas_requiring_attention_json or "[]")
    priorities_list = json.loads(record.next_week_priorities_json or "[]")
    readiness_dict = json.loads(record.readiness_summary_json or "{}")

    return WeeklyReportResponse(
        id=record.id,
        user_id=record.user_id,
        week_number=record.week_number,
        year=record.year,
        start_date=record.start_date.strftime("%Y-%m-%d"),
        end_date=record.end_date.strftime("%Y-%m-%d"),
        summary=WeeklyReportSummary(**summary_dict),
        skills_progress=[SkillProgressItem(**s) for s in skills_list],
        interview_performance=InterviewPerformanceSummary(**interview_dict),
        coding_performance=CodingPerformanceSummary(**coding_dict),
        areas_requiring_attention=[AreaRequiringAttention(**a) for a in attention_list],
        next_week_priorities=[NextWeekPriority(**p) for p in priorities_list],
        readiness_summary=ReadinessSummary(**readiness_dict),
        ai_interpretation=record.ai_interpretation or "",
        created_at=record.created_at.isoformat()
    )


def get_weekly_report_history(db: Session, user_id: str) -> List[WeeklyReportHistoryItem]:
    """Retrieves all historical weekly reports for the candidate."""
    reports = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.user_id == user_id)
        .order_by(desc(WeeklyReport.year), desc(WeeklyReport.week_number))
        .all()
    )

    items = []
    for r in reports:
        summary_dict = json.loads(r.summary_json or "{}")
        readiness_dict = json.loads(r.readiness_summary_json or "{}")
        items.append(
            WeeklyReportHistoryItem(
                id=r.id,
                week_number=r.week_number,
                year=r.year,
                start_date=r.start_date.strftime("%Y-%m-%d"),
                end_date=r.end_date.strftime("%Y-%m-%d"),
                created_at=r.created_at.isoformat(),
                interviews_completed=summary_dict.get("total_interviews_this_week", 0),
                coding_solved=summary_dict.get("total_coding_solved_this_week", 0),
                xp_gained=summary_dict.get("total_xp_gained_this_week", 0),
                readiness_score=readiness_dict.get("overall_score", 0)
            )
        )
    return items


def get_weekly_report_by_id(db: Session, user_id: str, report_id: str) -> WeeklyReportResponse:
    """Retrieves a specific WeeklyReport by primary key for the candidate."""
    record = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.id == report_id, WeeklyReport.user_id == user_id)
        .first()
    )
    if not record:
        raise ValueError(f"Report {report_id} not found for user {user_id}")
    return _format_report_response(record)
