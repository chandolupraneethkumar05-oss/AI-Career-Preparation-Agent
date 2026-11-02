"""
Skill Arena Service: Career-Aware Practice & Safe Structured Evaluation
AI Career Preparation Agent

Orchestrates:
1. Career-aware challenge selection based on target role & unified skill gaps.
2. Anti-repetition and dynamic difficulty calibration.
3. Safe structured answer evaluation (NO arbitrary server code execution).
4. Multi-source skill evidence recording and unified profile synchronization.
5. XP award, activity logging, and progress auditing.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import User, SkillArenaAttempt, SkillEvidence, utc_now
from ..schemas.skill_arena import (
    SkillArenaChallengeResponse,
    SkillArenaSubmitRequest,
    SkillArenaEvaluationResponse,
    SkillArenaAttemptResponse,
    SkillArenaStatsResponse
)
from ..schemas.activity import ActivityCreate
from .skill_arena_catalog import SKILL_ARENA_CATALOG, get_challenge_by_id
from .skill_taxonomy import normalize_skill, ROLE_REQUIREMENTS
from .skill_service import (
    aggregate_user_skill_evidence,
    record_skill_evidence,
    sync_unified_skill_profile
)
from .activity_service import record_activity
from .ai.rag.retrieval_service import default_retrieval_service

logger = logging.getLogger("skill_arena")

XP_REWARDS = {
    "Foundational": 25,
    "Intermediate": 40,
    "Advanced": 60
}


def normalize_challenge_mode(mode: Optional[str]) -> Optional[str]:
    """
    Normalizes challenge mode parameters from route query arguments or tabs.
    Returns canonical catalog mode string ('coding', 'debug', 'predict_output', 'mcq')
    or None if the mode represents an open/all/daily practice filter.
    """
    if not mode:
        return None
    m = str(mode).strip().lower()
    if m in ("all", "any", "daily", "featured", "*", ""):
        return None
    if m in ("code", "coding"):
        return "coding"
    if m in ("debug", "debugging"):
        return "debug"
    if m in ("predict", "predict_output"):
        return "predict_output"
    if m in ("mcq", "quiz", "multiple_choice"):
        return "mcq"
    return m


def get_available_challenges(
    db: Session,
    user_id: str,
    mode: Optional[str] = None,
    skill: Optional[str] = None,
    difficulty: Optional[str] = None
) -> List[SkillArenaChallengeResponse]:
    """
    Returns list of catalog challenges filtered by mode, skill, or difficulty,
    annotated with the candidate's completion status.
    """
    completed_ids = {
        att.challenge_id for att in
        db.query(SkillArenaAttempt.challenge_id)
        .filter(SkillArenaAttempt.user_id == user_id, SkillArenaAttempt.correctness == True)
        .all()
    }

    norm_mode = normalize_challenge_mode(mode)
    results = []
    for item in SKILL_ARENA_CATALOG:
        if norm_mode and item["mode"].lower() != norm_mode.lower():
            continue
        if skill and normalize_skill(item["skill"]).lower() != normalize_skill(skill).lower():
            continue
        if difficulty and item["difficulty"].lower() != difficulty.lower():
            continue

        results.append(
            SkillArenaChallengeResponse(
                id=item["id"],
                title=item["title"],
                mode=item["mode"],
                skill=item["skill"],
                subtopic=item["subtopic"],
                difficulty=item["difficulty"],
                question=item["question"],
                initial_code=item.get("initial_code"),
                options=item.get("options", []),
                hints=item.get("hints", []),
                estimated_minutes=item.get("estimated_minutes", 10),
                career_relevance=item.get("career_relevance", ""),
                xp_reward=XP_REWARDS.get(item["difficulty"], 40),
                already_completed=item["id"] in completed_ids
            )
        )
    return results


def get_next_challenge(
    db: Session,
    user_id: str,
    target_role: Optional[str] = None,
    mode: Optional[str] = None
) -> SkillArenaChallengeResponse:
    """
    Career-aware selection strictly matching candidate's active target role,
    calibrating difficulty, and rotating challenges to prevent repetition.
    """
    if not SKILL_ARENA_CATALOG:
        logger.error("Skill Arena Catalog is empty!")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No practice challenges are currently available in the catalog."
        )

    user = db.query(User).filter(User.id == user_id).first()
    active_role = target_role or (user.target_role if user else "Software Engineer")
    norm_mode = normalize_challenge_mode(mode)
    is_daily_drill = bool(mode and str(mode).strip().lower() == "daily")

    # 1. Map active role to taxonomy requirements
    matched_role_key = None
    for r in ROLE_REQUIREMENTS:
        if r.lower() == active_role.lower() or r.lower() in active_role.lower() or active_role.lower() in r.lower():
            matched_role_key = r
            break
    if not matched_role_key:
        lower_role = active_role.lower()
        if "front" in lower_role:
            matched_role_key = "Frontend Developer"
        elif "devops" in lower_role or "cloud" in lower_role:
            matched_role_key = "DevOps & Cloud Engineer"
        elif "security" in lower_role or "cyber" in lower_role:
            matched_role_key = "Security Engineer"
        elif "full" in lower_role:
            matched_role_key = "Full Stack Web Developer"
        elif "backend" in lower_role:
            matched_role_key = "Backend Engineer"
        elif "mobile" in lower_role:
            matched_role_key = "Mobile Developer"
        elif "data" in lower_role and "scientist" in lower_role:
            matched_role_key = "Data Scientist"
        else:
            matched_role_key = "Software Engineer"

    role_spec = ROLE_REQUIREMENTS.get(matched_role_key, {})
    role_core_skills = [normalize_skill(s).lower() for s in role_spec.get("core_skills", [])]
    role_important_skills = [normalize_skill(s).lower() for s in role_spec.get("important_skills", [])]
    all_role_skills = set(role_core_skills + role_important_skills)

    # 2. Query user's past attempts for anti-repetition & calibration
    past_attempts = (
        db.query(SkillArenaAttempt)
        .filter(SkillArenaAttempt.user_id == user_id)
        .order_by(desc(SkillArenaAttempt.created_at))
        .all()
    )
    completed_ids = {a.challenge_id for a in past_attempts if a.correctness}
    recent_attempt_ids = {a.challenge_id for a in past_attempts[:4]}

    # 3. Filter candidates strictly aligned with the target role and normalized mode
    candidates = []
    for c in SKILL_ARENA_CATALOG:
        c_skill = normalize_skill(c["skill"]).lower()
        c_roles = [r.lower() for r in c.get("target_roles", [])]
        if norm_mode and c["mode"].lower() != norm_mode.lower():
            continue
        if (
            c_skill in all_role_skills
            or any(matched_role_key.lower() in r for r in c_roles)
            or any(active_role.lower() in r for r in c_roles)
        ):
            candidates.append(c)

    # Fallback 1: If role filter was too strict for this mode, match any challenge in the requested mode
    if not candidates and norm_mode:
        candidates = [c for c in SKILL_ARENA_CATALOG if c["mode"].lower() == norm_mode.lower()]

    # Fallback 2: If still no candidates, log warning and fall back to full catalog
    if not candidates:
        logger.warning(f"No challenges found for role '{active_role}' and mode '{mode}'. Falling back to full catalog.")
        candidates = list(SKILL_ARENA_CATALOG)

    # 4. Anti-repetition selection & Role Specialization Priority
    target_difficulty = "Intermediate"
    if past_attempts and past_attempts[0].score >= 85:
        target_difficulty = "Advanced"
    elif not past_attempts or (past_attempts and past_attempts[0].score < 50):
        target_difficulty = "Foundational"

    def candidate_specialization_score(c):
        c_skill = normalize_skill(c["skill"]).lower()
        c_roles = [r.lower() for r in c.get("target_roles", [])]
        score = 0
        if any(matched_role_key.lower() == r.lower() for r in c_roles):
            score += 200
        elif any(matched_role_key.lower() in r.lower() for r in c_roles):
            score += 150
        elif c_skill in role_core_skills:
            score += 100
        elif c_skill in role_important_skills:
            score += 50

        # Strongly prioritize domain-specific questions over generic Python/Git
        if "front" in matched_role_key.lower() and c_skill not in ["javascript", "react", "html5", "css3", "typescript"]:
            score -= 130
        if "devops" in matched_role_key.lower() and c_skill not in ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform"]:
            score -= 130
        if "security" in matched_role_key.lower() and c_skill not in ["security", "cryptography", "networking"]:
            score -= 130
        if "backend" in matched_role_key.lower() and c_skill not in ["rest api", "sql", "postgresql", "redis", "fastapi", "system design"]:
            score -= 70

        if c.get("difficulty", "").lower() == target_difficulty.lower():
            score += 25
        return score

    candidates.sort(key=candidate_specialization_score, reverse=True)

    avoid_ids = completed_ids | recent_attempt_ids
    fresh = [c for c in candidates if c["id"] not in avoid_ids]
    uncompleted = [c for c in candidates if c["id"] not in completed_ids]
    pool = fresh if fresh else (uncompleted if uncompleted else candidates)

    if not pool:
        pool = list(SKILL_ARENA_CATALOG)

    if not pool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No practice challenges are currently available."
        )

    # If daily drill requested, rotate deterministically across pool by calendar day
    if is_daily_drill:
        day_offset = utc_now().timetuple().tm_yday
        selected = pool[day_offset % len(pool)]
    else:
        selected = pool[0]

    return SkillArenaChallengeResponse(
        id=selected["id"],
        title=selected["title"],
        mode=selected["mode"],
        skill=selected["skill"],
        subtopic=selected["subtopic"],
        difficulty=selected["difficulty"],
        question=selected["question"],
        initial_code=selected.get("initial_code"),
        options=selected.get("options", []),
        hints=selected.get("hints", []),
        estimated_minutes=selected.get("estimated_minutes", 10),
        career_relevance=selected.get("career_relevance", ""),
        xp_reward=XP_REWARDS.get(selected["difficulty"], 40),
        already_completed=selected["id"] in completed_ids
    )


def evaluate_submission(
    db: Session,
    user_id: str,
    submission: SkillArenaSubmitRequest
) -> SkillArenaEvaluationResponse:
    """
    Performs safe structured evaluation of candidate submission.
    No arbitrary code is executed on the server.
    Logs activity, awards XP, records SkillEvidence, and synchronizes profile.
    """
    challenge = get_challenge_by_id(submission.challenge_id)
    if not challenge:
        logger.warning(f"Submission received for unknown challenge_id: '{submission.challenge_id}'")
        if SKILL_ARENA_CATALOG:
            challenge = SKILL_ARENA_CATALOG[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Challenge '{submission.challenge_id}' not found."
            )

    mode = challenge["mode"]
    raw_answer = submission.user_answer.strip()
    norm_answer = raw_answer.lower()

    score = 0
    correctness = False
    technical_depth = 50
    strengths = []
    mistakes = []
    improvement_suggestions = []
    concepts_detected = []
    feedback = ""

    exec_status = None
    exec_time_ms = None
    exec_stdout = None
    exec_stderr = None
    tests_passed = None
    tests_total = None
    exec_type = None

    # -------------------------------------------------------------------------
    # MODE 1: TECHNICAL MCQ
    # -------------------------------------------------------------------------
    if mode == "mcq":
        correct_idx = challenge.get("correct_option_index", 0)
        options = challenge.get("options", [])
        expected_str = challenge.get("expected_answer", "").strip().lower()

        is_match = False
        # Check if user passed letter A/B/C/D or index 0/1/2/3
        if raw_answer.upper() in ["A", "B", "C", "D"]:
            user_idx = ord(raw_answer.upper()) - ord('A')
            is_match = (user_idx == correct_idx)
        elif raw_answer in ["0", "1", "2", "3"]:
            is_match = (int(raw_answer) == correct_idx)
        elif options and 0 <= correct_idx < len(options):
            correct_opt = options[correct_idx].strip().lower()
            is_match = (norm_answer == correct_opt or correct_opt in norm_answer)
        else:
            is_match = (norm_answer == expected_str or expected_str in norm_answer)

        if is_match:
            score = 100
            correctness = True
            technical_depth = 95
            concepts_detected.append(challenge.get("subtopic", challenge["skill"]))
            strengths.append(f"Correctly identified the core mechanism: {challenge['title']}")
            feedback = "Excellent! You selected the statistically and conceptually accurate option."
        else:
            score = 0
            correctness = False
            technical_depth = 30
            mistakes.append(f"Selected option '{raw_answer}', which does not represent the correct statistical or technical mechanism.")
            improvement_suggestions.append("Review the theoretical definitions and edge-case exceptions for this topic.")
            feedback = "Incorrect. Review the detailed conceptual breakdown below."

    # -------------------------------------------------------------------------
    # MODE 2: PREDICT OUTPUT
    # -------------------------------------------------------------------------
    elif mode == "predict_output":
        expected_out = challenge.get("expected_answer", "").strip()
        # Normalize whitespace and strip trailing newlines
        clean_user = "".join(raw_answer.split())
        clean_expected = "".join(expected_out.split())

        if clean_user == clean_expected or expected_out.lower() in raw_answer.lower():
            score = 100
            correctness = True
            technical_depth = 90
            concepts_detected.append(challenge.get("subtopic", "Code Execution Flow"))
            strengths.append("Accurately traced evaluation flow and object references.")
            feedback = f"Spot on! The snippet evaluates to exactly: {expected_out}"
        else:
            score = 0
            correctness = False
            technical_depth = 30
            mistakes.append(f"Predicted '{raw_answer}' instead of expected '{expected_out}'.")
            improvement_suggestions.append("Trace variable scoping and execution ordering line by line.")
            feedback = f"Incorrect output. Expected '{expected_out}', but received '{raw_answer}'."

    # -------------------------------------------------------------------------
    # MODE 3: DEBUG CHALLENGE
    # -------------------------------------------------------------------------
    elif mode == "debug":
        test_crit = challenge.get("test_criteria", {})
        req_patterns = [p.lower() for p in test_crit.get("required_patterns", [])]
        kw_list = [k.lower() for k in challenge.get("keywords", [])]

        matched_patterns = [p for p in req_patterns if p in norm_answer]
        matched_kws = [k for k in kw_list if k in norm_answer]

        pattern_ratio = len(matched_patterns) / max(1, len(req_patterns))
        kw_ratio = len(matched_kws) / max(1, len(kw_list))

        combined_score = int(round((pattern_ratio * 70) + (kw_ratio * 30)))
        if pattern_ratio >= 1.0 and kw_ratio >= 0.35:
            combined_score = 100
        score = max(0, min(100, combined_score))
        correctness = score >= 70
        technical_depth = min(100, int(score * 1.1))

        for c in test_crit.get("concepts", []):
            concepts_detected.append(c)

        if correctness:
            strengths.append("Successfully isolated the root cause and applied idiomatic correction.")
            if matched_kws:
                strengths.append(f"Addressed key architectural aspects: {', '.join(matched_kws[:3])}")
            feedback = f"Great debugging! You correctly remedied the defect ({score}/100)."
        else:
            mistakes.append("Incomplete bug fix or missing essential syntax safeguards.")
            if req_patterns:
                unmatched = [p for p in req_patterns if p not in norm_answer]
                if unmatched:
                    improvement_suggestions.append(f"Ensure the fix incorporates: {', '.join(unmatched[:2])}")
            feedback = f"Partial debugging resolution ({score}/100). See explanation for complete fix."

    # -------------------------------------------------------------------------
    # MODE 4: CODING CHALLENGE (SAFE STRUCTURED EVALUATION)
    # -------------------------------------------------------------------------
    else:
        test_crit = challenge.get("test_criteria", {})
        req_patterns = [p.lower() for p in test_crit.get("required_patterns", [])]
        kw_list = [k.lower() for k in challenge.get("keywords", [])]

        matched_patterns = [p for p in req_patterns if p in norm_answer]
        matched_kws = [k for k in kw_list if k in norm_answer]

        pattern_ratio = len(matched_patterns) / max(1, len(req_patterns))
        kw_ratio = len(matched_kws) / max(1, len(kw_list))

        pattern_score = pattern_ratio * 60
        kw_score = kw_ratio * 30
        length_bonus = min(10, int(len(raw_answer.split()) / 5)) if (pattern_ratio > 0) else 0

        calc_score = int(round(pattern_score + kw_score + length_bonus))
        if pattern_ratio >= 1.0 and kw_ratio >= 0.35:
            calc_score = 100
        score = max(0, min(100, calc_score))
        correctness = score >= 70
        technical_depth = min(100, int(score * 1.05))

        for c in test_crit.get("concepts", []):
            concepts_detected.append(c)

        if correctness:
            strengths.append("Solid programmatic structure adhering to required signatures and logic.")
            if matched_kws:
                strengths.append(f"Demonstrated domain fluency: {', '.join(matched_kws[:3])}")
            feedback = f"Strong implementation! Structure and concepts verified ({score}/100)."
        else:
            mistakes.append("Did not fulfill all algorithmic requirements or omitted critical edge checks.")
            improvement_suggestions.append("Ensure full function structure and return values match constraints.")
            feedback = f"Structured practice evaluation: {score}/100. Check expected approach below."

    # -------------------------------------------------------------------------
    # SANDBOX EXECUTION (FOR CHALLENGES WITH SERVER-SIDE TEST CASES)
    # -------------------------------------------------------------------------
    test_cases_data = challenge.get("test_cases", [])
    if test_cases_data and mode in ("coding", "debug"):
        try:
            from .sandbox.sandbox_manager import default_sandbox_manager
            from .sandbox.models import TestCase, ExecutionLimits

            tcs = [
                TestCase(
                    input_data=tc["input_data"],
                    expected_output=tc["expected_output"],
                    is_hidden=tc.get("is_hidden", True),
                    description=tc.get("description")
                )
                for tc in test_cases_data
            ]
            job = default_sandbox_manager.create_job(
                user_id=user_id,
                code=raw_answer,
                challenge_id=challenge["id"],
                language="python"
            )
            job.limits = ExecutionLimits(cpu_timeout_seconds=3.0, memory_limit_mb=256)
            job_res = default_sandbox_manager.run_job(job=job, test_cases=tcs)
            exec_status = job_res.status.value
            exec_time_ms = job_res.execution_time_ms
            exec_stdout = job_res.stdout
            exec_stderr = job_res.stderr
            tests_passed = job_res.passed_tests
            tests_total = job_res.total_tests
            exec_type = job_res.executor_type

            if tests_total and tests_total > 0:
                pass_ratio = tests_passed / tests_total
                score = int(round(pass_ratio * 100))
                correctness = (tests_passed == tests_total)
                technical_depth = min(100, int(score * 1.05))
                if correctness:
                    strengths.append(f"Passed all {tests_total}/{tests_total} server-side test cases ({exec_time_ms}ms).")
                    feedback = f"All {tests_total} test cases passed! Execution verified in {exec_time_ms}ms via {exec_type} sandbox."
                else:
                    mistakes.append(f"Passed {tests_passed}/{tests_total} test cases. Execution status: {exec_status}.")
                    if job_res.stderr:
                        mistakes.append(f"Stderr: {job_res.stderr[:200]}")
                    feedback = f"Sandbox test evaluation: {tests_passed}/{tests_total} tests passed ({score}/100)."
        except Exception as exc:
            logger.warning(f"Sandbox execution failed, retaining structural score: {exc}")

    # -------------------------------------------------------------------------
    # OPTIONAL RAG RETRIEVAL FOR LEARNING CONTEXT
    # -------------------------------------------------------------------------
    rag_context_text = None
    if not correctness:
        try:
            rag_res = default_retrieval_service.retrieve_relevant_knowledge(
                query=f"{challenge['skill']} {challenge.get('subtopic', '')}",
                top_k=1,
                threshold=0.08
            )
            chunks = rag_res.get("chunks", [])
            if chunks:
                rag_context_text = f"Curriculum Reference ({chunks[0]['title']}): {chunks[0]['content'][:250]}..."
        except Exception as exc:
            logger.debug(f"RAG retrieval skipped: {exc}")

    # -------------------------------------------------------------------------
    # XP AWARD & ACTIVITY LOGGING
    # -------------------------------------------------------------------------
    diff = challenge["difficulty"]
    xp_amount = XP_REWARDS.get(diff, 40)

    # Record verified activity
    record_activity(
        db=db,
        user_id=user_id,
        data=ActivityCreate(
            type="skill_arena_completed",
            related_module="skill_arena",
            title=f"Completed Skill Arena: {challenge['title']} ({score}%)",
            xp_earned=xp_amount,
            details={
                "challengeId": challenge["id"],
                "mode": mode,
                "skill": challenge["skill"],
                "difficulty": diff,
                "score": score,
                "correctness": correctness
            }
        )
    )

    # -------------------------------------------------------------------------
    # PERSIST ATTEMPT LEDGER
    # -------------------------------------------------------------------------
    attempt = SkillArenaAttempt(
        user_id=user_id,
        challenge_id=challenge["id"],
        mode=mode,
        skill=challenge["skill"],
        subtopic=challenge.get("subtopic", ""),
        difficulty=diff,
        user_answer=raw_answer,
        score=score,
        correctness=correctness,
        feedback=feedback,
        strengths_json=json.dumps(strengths),
        mistakes_json=json.dumps(mistakes),
        improvement_suggestions_json=json.dumps(improvement_suggestions),
        concepts_detected_json=json.dumps(concepts_detected),
        xp_earned=xp_amount,
        time_spent_seconds=submission.time_spent_seconds or 0,
        created_at=utc_now()
    )
    db.add(attempt)
    db.flush()

    # -------------------------------------------------------------------------
    # RECORD SKILL EVIDENCE & SYNC UNIFIED PROFILE
    # -------------------------------------------------------------------------
    canonical_skill = normalize_skill(challenge["skill"])
    record_skill_evidence(
        db=db,
        user_id=user_id,
        skill_name=canonical_skill,
        source_type="skill_arena",
        source_id=f"arena_{attempt.id}",
        score=score,
        evidence_text=f"Skill Arena ({challenge['mode']}): {feedback}",
        confidence="high" if score >= 80 else "medium"
    )

    # Sync unified skill profile to recalculate gaps & readiness
    user = db.query(User).filter(User.id == user_id).first()
    active_role = user.target_role if user else "Machine Learning Engineer"
    sync_unified_skill_profile(db=db, user_id=user_id, target_role=active_role)

    # Compute next recommended focus
    updated_profile = aggregate_user_skill_evidence(db, user_id, target_role=active_role)
    next_gaps = updated_profile.get("top_skill_gaps", [])
    next_rec = next_gaps[0].skill_name if next_gaps else "Core Fundamentals"

    return SkillArenaEvaluationResponse(
        challenge_id=challenge["id"],
        mode=mode,
        skill=challenge["skill"],
        difficulty=diff,
        score=score,
        correctness=correctness,
        technical_depth=technical_depth,
        strengths=strengths,
        mistakes=mistakes,
        improvement_suggestions=improvement_suggestions,
        concepts_detected=concepts_detected,
        explanation=challenge.get("explanation", ""),
        expected_answer_or_approach=challenge.get("expected_answer", ""),
        xp_earned=xp_amount,
        streak=user.streak if user else 1,
        feedback=feedback,
        next_recommended_skill=next_rec,
        rag_context=rag_context_text,
        execution_status=exec_status,
        execution_time_ms=exec_time_ms,
        stdout=exec_stdout,
        stderr=exec_stderr,
        tests_passed=tests_passed,
        total_tests=tests_total,
        executor_type=exec_type
    )


def get_user_history(
    db: Session,
    user_id: str,
    limit: int = 20
) -> List[SkillArenaAttemptResponse]:
    """Returns candidate's attempt history in reverse chronological order."""
    attempts = (
        db.query(SkillArenaAttempt)
        .filter(SkillArenaAttempt.user_id == user_id)
        .order_by(desc(SkillArenaAttempt.created_at))
        .limit(limit)
        .all()
    )

    return [
        SkillArenaAttemptResponse(
            id=str(a.id) if a.id is not None else "",
            challenge_id=a.challenge_id,
            mode=a.mode,
            skill=a.skill,
            subtopic=a.subtopic or "",
            difficulty=a.difficulty,
            score=a.score,
            correctness=a.correctness,
            xp_earned=a.xp_earned,
            time_spent_seconds=a.time_spent_seconds,
            created_at=a.created_at.isoformat() if a.created_at else ""
        )
        for a in attempts
    ]


def get_user_stats(db: Session, user_id: str) -> SkillArenaStatsResponse:
    """Aggregates candidate performance metrics across all Skill Arena attempts."""
    attempts = (
        db.query(SkillArenaAttempt)
        .filter(SkillArenaAttempt.user_id == user_id)
        .all()
    )

    total_attempts = len(attempts)
    if total_attempts == 0:
        return SkillArenaStatsResponse(
            total_attempts=0,
            total_passed=0,
            accuracy_rate=0.0,
            total_xp_earned=0,
            skills_practiced=[],
            modes_breakdown={},
            current_streak=0
        )

    passed = sum(1 for a in attempts if a.correctness)
    total_xp = sum(a.xp_earned for a in attempts)
    skills = list({a.skill for a in attempts})

    modes = {}
    for a in attempts:
        modes[a.mode] = modes.get(a.mode, 0) + 1

    user = db.query(User).filter(User.id == user_id).first()

    return SkillArenaStatsResponse(
        total_attempts=total_attempts,
        total_passed=passed,
        accuracy_rate=round((passed / total_attempts) * 100, 1),
        total_xp_earned=total_xp,
        skills_practiced=skills,
        modes_breakdown=modes,
        current_streak=user.streak if user else 0
    )
