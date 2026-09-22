"""
Interview Engine Service
AI Career Preparation Agent

Orchestrates dynamic, grounded, adaptive generative mock interviews.
Handles session initialization, dynamic question generation via RAG & candidate career context,
5-axis answer evaluation, adaptive follow-up branching, and closed-loop skill gap updates.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import (
    Interview,
    InterviewQuestion,
    InterviewAnswer,
    AnswerEvaluation,
    SkillGap,
    User,
    Profile,
    InterviewExperience,
    InterviewExperienceQuestion,
)
from ..schemas.interview import (
    InterviewStartRequest,
    InterviewSessionResponse,
    InterviewQuestionResponse,
    SubmitAnswerRequest,
    AnswerEvaluationResponse,
    NextQuestionDecision,
    AnswerSubmissionResponse,
    FinalInterviewReportResponse,
    QuickAnswerRequest,
    QuickAnswerResponse,
)
from ..schemas.activity import ActivityCreate
from .activity_service import record_activity
from .skill_service import record_skill_evidence, sync_unified_skill_profile
from .ai.career.career_context_builder import build_user_career_context
from .ai.rag.retrieval_service import default_retrieval_service
from .ai.llm.llm_service import default_llm_service, get_llm_service



def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_vault_questions_for_role(db: Session, target_role: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Retrieves approved interview questions contributed by users/community to the Question Vault,
    prioritizing questions matching the candidate's target role or related tech disciplines.
    """
    try:
        query = db.query(InterviewExperienceQuestion, InterviewExperience).join(
            InterviewExperience, InterviewExperienceQuestion.experience_id == InterviewExperience.id
        ).filter(
            InterviewExperience.moderation_status == "APPROVED"
        )

        matched = []
        if target_role:
            role_pattern = f"%{target_role.strip().lower()}%"
            matched = query.filter(
                (InterviewExperience.role.ilike(role_pattern)) |
                (InterviewExperienceQuestion.topic.ilike(role_pattern))
            ).order_by(InterviewExperienceQuestion.created_at.desc()).limit(limit).all()

        if not matched:
            matched = query.order_by(InterviewExperienceQuestion.created_at.desc()).limit(limit).all()

        chunks = []
        for q, exp in matched:
            chunks.append({
                "id": f"vault_{q.id}",
                "topic": q.topic or target_role,
                "content": f"[Question Vault • Real Interview Question from {exp.company or 'Leading Tech Firm'} for {exp.role or target_role}]: {q.question_text}",
                "company": exp.company or "Industry",
                "difficulty": q.difficulty or "medium",
                "source": "Question Vault"
            })
        return chunks
    except Exception:
        return []


class InterviewEngine:
    """
    Coordinates interactive multi-turn technical and behavioral mock interviews.
    """

    def start_session(
        self,
        db: Session,
        user_id: str,
        request: InterviewStartRequest
    ) -> InterviewSessionResponse:
        """
        Initializes an adaptive mock interview session, retrieves grounded curriculum,
        and generates the personalized first question.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            # Safe creation of user record if testing with prototype id
            user = User(
                id=user_id,
                email=f"{user_id}@example.com",
                name="Candidate",
                target_role=request.role or "Machine Learning Engineer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        career_context = build_user_career_context(user_id, db)
        
        target_role = request.role or user.target_role or "Machine Learning Engineer"
        difficulty = request.difficulty or "Intermediate"
        category = request.interview_type or "Technical"
        total_questions = max(3, min(15, request.total_questions or 5))
        interview_lang = request.interview_language or "en"
        
        # Check user profile for preferred feedback language if not explicitly provided
        from .ai.languages import normalize_feedback_language
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if request.feedback_language:
            feedback_lang = normalize_feedback_language(request.feedback_language)
        elif profile and getattr(profile, "feedback_language", None):
            feedback_lang = normalize_feedback_language(profile.feedback_language)
        else:
            feedback_lang = "en"

        session_id = f"int_{uuid.uuid4().hex[:12]}"

        # Collect previously asked questions and skills across past sessions for this candidate
        past_q_records = (
            db.query(InterviewQuestion.question, InterviewQuestion.skill)
            .join(Interview, Interview.id == InterviewQuestion.session_id)
            .filter(Interview.user_id == user_id)
            .all()
        )
        past_question_texts = [q[0].strip() for q in past_q_records if q[0]]
        past_skills = [q[1].strip() for q in past_q_records if q[1]]
        career_context["past_interview_questions"] = past_question_texts
        career_context["past_interview_skills"] = past_skills

        past_session_count = db.query(Interview).filter(Interview.user_id == user_id).count()

        # Grounding: retrieve diverse syllabus / interview knowledge
        # Vary retrieval query seed based on past session count and target role
        query_seeds = [
            f"{target_role} {category} {difficulty} system architecture and core fundamentals",
            f"{target_role} {difficulty} practical engineering design patterns and tradeoffs",
            f"{target_role} {difficulty} model optimization latency and debugging",
            f"{target_role} {difficulty} data pipelines algorithms and scalability",
            f"{target_role} {difficulty} technical interview lifecycle and screening questions"
        ]
        retrieval_query = query_seeds[past_session_count % len(query_seeds)]
        rag_res = default_retrieval_service.retrieve_relevant_knowledge(
            query=retrieval_query,
            top_k=8
        )
        rag_chunks = rag_res.get("chunks", []) if isinstance(rag_res, dict) else (rag_res or [])

        # Filter out chunks whose topics were already heavily asked in past sessions if possible
        past_skills_lower = {s.lower() for s in past_skills}
        fresh_chunks = [c for c in rag_chunks if c.get("topic", "").lower() not in past_skills_lower]
        effective_chunks = fresh_chunks if fresh_chunks else rag_chunks

        # Integrate Question Vault approved questions from real candidate experiences
        vault_chunks = get_vault_questions_for_role(db, target_role, limit=3)
        if vault_chunks:
            effective_chunks = vault_chunks + effective_chunks

        session_ctx = {
            "session_id": session_id,
            "role": target_role,
            "difficulty": difficulty,
            "category": category,
            "interview_language": interview_lang,
            "feedback_language": feedback_lang,
            "session_number": past_session_count + 1,
            "resume_text": ""
        }

        # Generate question #1 (0-indexed sequence 1)
        q1_data = get_llm_service().generate_interview_question(
            session_context=session_ctx,
            question_index=0,
            total_questions=total_questions,
            previous_qa=[],
            career_context=career_context,
            retrieved_knowledge=effective_chunks,
            language=interview_lang
        )

        now = utc_now()
        interview = Interview(
            id=session_id,
            user_id=user_id,
            role=target_role,
            interview_type=category,
            difficulty=difficulty,
            questions_count=total_questions,
            current_question_index=0,
            status="in_progress",
            interview_language=interview_lang,
            feedback_language=feedback_lang,
            overall_score=0,
            passed=False,
            feedback_summary="",
            rubric_scores_json="{}",
            answers_json="[]",
            recommendations_json="[]",
            strengths_json="[]",
            weaknesses_json="[]",
            started_at=now,
            created_at=now
        )
        db.add(interview)
        db.flush()

        q1_id = f"q_{uuid.uuid4().hex[:10]}"
        q1_model = InterviewQuestion(
            id=q1_id,
            session_id=session_id,
            user_id=user_id,
            sequence_number=1,
            question=q1_data["question_text"],
            skill=q1_data["skill"],
            difficulty=q1_data["difficulty"],
            question_type=q1_data["question_type"],
            generated_source="Question Vault (Community Company Question)" if vault_chunks and ("vault" in str(q1_data).lower() or q1_data.get("source_type") == "rag_grounded") else q1_data["source_type"],
            expected_focus=q1_data.get("rubric_guidance") or q1_data.get("rationale") or "",
            rag_chunk_id=rag_chunks[0].get("id") if rag_chunks else None,
            is_follow_up=False,
            created_at=now
        )
        db.add(q1_model)
        db.commit()
        db.refresh(interview)
        db.refresh(q1_model)

        q1_response = InterviewQuestionResponse(
            id=q1_model.id,
            session_id=session_id,
            sequence_number=1,
            question=q1_model.question,
            skill=q1_model.skill,
            difficulty=q1_model.difficulty,
            question_type=q1_model.question_type,
            generated_source=q1_model.generated_source,
            expected_focus=q1_model.expected_focus,
            is_follow_up=q1_model.is_follow_up,
            created_at=q1_model.created_at
        )

        return InterviewSessionResponse(
            session_id=interview.id,
            user_id=interview.user_id,
            target_role=interview.role,
            interview_type=interview.interview_type or "Technical",
            difficulty=interview.difficulty,
            status="in_progress",
            interview_language=interview.interview_language or "en",
            feedback_language=interview.feedback_language or "en",
            total_questions=interview.total_questions,
            current_question_index=0,
            current_question=q1_response,
            started_at=interview.started_at or now
        )

    def get_current_question(
        self,
        db: Session,
        user_id: str,
        session_id: str
    ) -> InterviewSessionResponse:
        """
        Retrieves the active question for a session under strict tenant isolation.
        """
        interview = (
            db.query(Interview)
            .filter(Interview.id == session_id, Interview.user_id == user_id)
            .first()
        )
        if not interview:
            raise ValueError(f"Interview session {session_id} not found for this candidate.")

        q_model = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.session_id == session_id,
                InterviewQuestion.sequence_number == interview.current_question_index + 1
            )
            .first()
        )

        current_q_resp = None
        if q_model:
            current_q_resp = InterviewQuestionResponse(
                id=q_model.id,
                session_id=session_id,
                sequence_number=q_model.sequence_number,
                question=q_model.question,
                skill=q_model.skill,
                difficulty=q_model.difficulty,
                question_type=q_model.question_type,
                generated_source=q_model.generated_source,
                expected_focus=q_model.expected_focus,
                is_follow_up=q_model.is_follow_up,
                created_at=q_model.created_at
            )

        return InterviewSessionResponse(
            session_id=interview.id,
            user_id=interview.user_id,
            target_role=interview.role,
            interview_type=interview.interview_type or "Technical",
            difficulty=interview.difficulty,
            status=interview.status or "in_progress",
            interview_language=interview.interview_language or "en",
            feedback_language=interview.feedback_language or "en",
            total_questions=interview.total_questions or interview.questions_count or 5,
            current_question_index=interview.current_question_index,
            current_question=current_q_resp,
            started_at=interview.started_at or utc_now()
        )

    def submit_answer(
        self,
        db: Session,
        user_id: str,
        session_id: str,
        request: SubmitAnswerRequest
    ) -> AnswerSubmissionResponse:
        """
        Evaluates the candidate's answer across 5 axes, records metrics,
        and dynamically determines whether to follow up or advance to the next curriculum topic.
        """
        interview = (
            db.query(Interview)
            .filter(Interview.id == session_id, Interview.user_id == user_id)
            .first()
        )
        if not interview:
            raise ValueError(f"Interview session {session_id} not found for this candidate.")

        if interview.status == "completed":
            raise ValueError("This interview session has already been completed.")

        question = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.id == request.question_id,
                InterviewQuestion.session_id == session_id
            )
            .first()
        )
        if not question:
            raise ValueError(f"Question {request.question_id} not found in session {session_id}.")

        career_context = build_user_career_context(user_id, db)

        q_dict = {
            "id": question.id,
            "question_text": question.question,
            "topic": question.skill,
            "difficulty": question.difficulty,
            "skill": question.skill,
            "question_type": question.question_type,
            "rubric_guidance": question.expected_focus or ""
        }

        # Grounding knowledge retrieval for evaluation
        rag_res = default_retrieval_service.retrieve_relevant_knowledge(
            query=f"{interview.role} {question.skill}",
            user_context=career_context,
            top_k=2
        )
        rag_eval_chunks = rag_res.get("chunks", []) if isinstance(rag_res, dict) else (rag_res or [])

        # 5-Axis Evaluation
        eval_dict = get_llm_service().evaluate_interview_answer(
            question=q_dict,
            answer_text=request.answer,
            career_context=career_context,
            language=interview.feedback_language or "en",
            user_answer=request.answer,
            retrieved_knowledge=rag_eval_chunks,
            target_role=interview.role,
            difficulty=question.difficulty,
            interview_type=interview.interview_type or "Technical"
        )

        now = utc_now()
        word_count = len(request.answer.split())

        # Save Answer (Persistence Safety First)
        ans_id = f"ans_{uuid.uuid4().hex[:10]}"
        answer_model = InterviewAnswer(
            id=ans_id,
            session_id=session_id,
            question_id=question.id,
            user_id=user_id,
            answer=request.answer,
            word_count=word_count,
            time_spent_seconds=request.time_spent_seconds or 0,
            submitted_at=now
        )
        db.add(answer_model)
        db.flush()

        # Save Evaluation with 5-Axis & Adaptive Follow-Up metadata
        eval_id = f"eval_{uuid.uuid4().hex[:10]}"
        eval_model = AnswerEvaluation(
            id=eval_id,
            session_id=session_id,
            question_id=question.id,
            answer_id=ans_id,
            user_id=user_id,
            overall_score=eval_dict["overall_score"],
            technical_accuracy=eval_dict["technical_accuracy"],
            communication_quality=eval_dict["communication_quality"],
            relevance=eval_dict["relevance"],
            completeness=eval_dict["completeness"],
            confidence_indicators=eval_dict["confidence_indicators"],
            strengths_json=json.dumps(eval_dict.get("strengths", [])),
            weaknesses_json=json.dumps(eval_dict.get("weaknesses", [])),
            missing_concepts_json=json.dumps(eval_dict.get("missing_concepts", [])),
            detected_topics_json=json.dumps(eval_dict.get("detected_topics", [])),
            recommended_follow_up_type=eval_dict.get("recommended_follow_up_type", "conceptual_probe"),
            recommended_difficulty=eval_dict.get("recommended_difficulty", question.difficulty),
            skill_evidence_json=json.dumps(eval_dict.get("skill_evidence", {})),
            feedback=eval_dict.get("feedback", ""),
            follow_up_needed=eval_dict.get("follow_up_needed", False),
            follow_up_reason=eval_dict.get("follow_up_reason"),
            created_at=now
        )
        db.add(eval_model)
        db.commit()

        eval_response = AnswerEvaluationResponse(
            id=eval_model.id,
            question_id=question.id,
            overall_score=eval_model.overall_score,
            technical_accuracy=eval_model.technical_accuracy,
            communication_quality=eval_model.communication_quality,
            relevance=eval_model.relevance,
            completeness=eval_model.completeness,
            confidence_indicators=eval_model.confidence_indicators,
            correctness_score=eval_dict.get("correctness_score", eval_model.technical_accuracy),
            depth_score=eval_dict.get("depth_score", eval_model.completeness),
            relevance_score=eval_dict.get("relevance_score", eval_model.relevance),
            communication_score=eval_dict.get("communication_score", eval_model.communication_quality),
            technical_score=eval_dict.get("technical_score", eval_model.technical_accuracy),
            strengths=eval_dict.get("strengths", []),
            weaknesses=eval_dict.get("weaknesses", []),
            missing_concepts=eval_dict.get("missing_concepts", []),
            detected_topics=eval_dict.get("detected_topics", []),
            recommended_follow_up_type=eval_dict.get("recommended_follow_up_type", "conceptual_probe"),
            recommended_difficulty=eval_dict.get("recommended_difficulty", question.difficulty),
            skill_evidence=eval_dict.get("skill_evidence", {}),
            feedback=eval_model.feedback,
            follow_up_needed=eval_model.follow_up_needed,
            follow_up_reason=eval_model.follow_up_reason
        )

        # Record granular interview skill evidence for closed-loop skill gap calibration
        try:
            record_skill_evidence(
                db=db,
                user_id=user_id,
                skill_name=question.skill,
                source_type="interview",
                source_id=session_id,
                score=eval_model.overall_score,
                evidence_text=f"Q: {question.question[:120]} | Score: {eval_model.overall_score}%",
                confidence="medium"
            )
            # If additional topics detected in candidate's answer, log evidence for them
            for topic in eval_dict.get("detected_topics", []):
                if topic.lower() != question.skill.lower():
                    record_skill_evidence(
                        db=db,
                        user_id=user_id,
                        skill_name=topic,
                        source_type="interview",
                        source_id=session_id,
                        score=eval_model.technical_accuracy,
                        evidence_text=f"Demonstrated in response to {question.skill}",
                        confidence="low"
                    )
        except Exception as ev_err:
            pass

        total_allowed = interview.total_questions or interview.questions_count or 5
        next_index = interview.current_question_index + 1
        completed_count = next_index

        if next_index < total_allowed:
            # Advance to next question
            interview.current_question_index = next_index
            db.flush()

            all_questions = (
                db.query(InterviewQuestion)
                .filter(InterviewQuestion.session_id == session_id)
                .order_by(InterviewQuestion.sequence_number.asc())
                .all()
            )
            answers_map = {
                a.question_id: a.answer
                for a in db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session_id).all()
            }
            evals_map = {
                e.question_id: e
                for e in db.query(AnswerEvaluation).filter(AnswerEvaluation.session_id == session_id).all()
            }

            previous_qa = []
            for q in all_questions:
                ev = evals_map.get(q.id)
                previous_qa.append({
                    "question": q.question,
                    "topic": q.skill,
                    "skill": q.skill,
                    "answer": answers_map.get(q.id, ""),
                    "score": ev.overall_score if ev else 70,
                    "follow_up_needed": ev.follow_up_needed if ev else False
                })

            # Query past session questions for cross-session exclusion
            past_q_records = (
                db.query(InterviewQuestion.question, InterviewQuestion.skill)
                .join(Interview, Interview.id == InterviewQuestion.session_id)
                .filter(Interview.user_id == user_id, Interview.id != session_id)
                .all()
            )
            career_context["past_interview_questions"] = [q[0].strip() for q in past_q_records if q[0]]
            career_context["past_interview_skills"] = [q[1].strip() for q in past_q_records if q[1]]

            # Determine adaptive decision from candidate performance and evaluator diagnosis
            overall = eval_model.overall_score
            rec_followup = eval_dict.get("recommended_follow_up_type", "conceptual_probe")
            rec_diff = eval_dict.get("recommended_difficulty", interview.difficulty)
            missing_concepts = eval_dict.get("missing_concepts", [])

            # Check if previous question was already a follow-up to avoid getting stuck indefinitely on one topic
            was_last_follow_up = bool(question.is_follow_up)

            if eval_model.follow_up_needed and not was_last_follow_up:
                adaptive_action = "follow_up"
            elif overall >= 85:
                adaptive_action = "escalate"
            elif overall < 55 and not was_last_follow_up:
                adaptive_action = "follow_up"
            else:
                adaptive_action = "standard"

            adaptive_decision = {
                "action": adaptive_action,
                "follow_up_type": rec_followup,
                "difficulty": rec_diff,
                "missing_concepts": missing_concepts,
                "reason": eval_model.follow_up_reason or f"Evaluated score {overall}/100 ({rec_followup}).",
                "previous_question": question.question,
                "previous_answer": request.answer,
                "topic": question.skill
            }

            # Ground RAG Retrieval:
            # If doing an adaptive follow-up, retrieve knowledge specifically matching the topic + missing concepts!
            vault_chunks = []
            if adaptive_action == "follow_up":
                missing_str = " ".join(missing_concepts[:3])
                retrieval_query = f"{interview.role} {question.skill} {missing_str}".strip()
                rag_res = default_retrieval_service.retrieve_relevant_knowledge(
                    query=retrieval_query,
                    user_context=career_context,
                    top_k=5
                )
                rag_chunks = rag_res.get("chunks", []) if isinstance(rag_res, dict) else (rag_res or [])
                effective_chunks = rag_chunks
            else:
                # Rotate curriculum focus across turns to cover diverse domains
                turn_facets = [
                    f"{interview.role} core technical algorithms and domain foundations",
                    f"{interview.role} {question.skill} system architecture and deep dive",
                    f"{interview.role} production tooling data pipelines and MLOps",
                    f"{interview.role} performance optimization debugging and edge cases",
                    f"{interview.role} behavioral leadership and STAR conflict resolution"
                ]
                retrieval_query = turn_facets[next_index % len(turn_facets)]
                rag_res = default_retrieval_service.retrieve_relevant_knowledge(
                    query=retrieval_query,
                    user_context=career_context,
                    top_k=8
                )
                rag_chunks = rag_res.get("chunks", []) if isinstance(rag_res, dict) else (rag_res or [])

                # Filter out chunks whose topics were already covered in previous_qa
                covered_topics = {q["topic"].lower() for q in previous_qa if q.get("topic")}
                uncovered_chunks = [c for c in rag_chunks if c.get("topic", "").lower() not in covered_topics]
                effective_chunks = uncovered_chunks if uncovered_chunks else rag_chunks

                # Weave in Question Vault approved questions
                vault_chunks = get_vault_questions_for_role(db, interview.role, limit=3)
                if vault_chunks:
                    effective_chunks = vault_chunks + effective_chunks

            session_ctx = {
                "session_id": session_id,
                "role": interview.role,
                "difficulty": adaptive_decision["difficulty"],
                "category": interview.interview_type or "Technical",
                "interview_language": interview.interview_language or "en",
                "feedback_language": interview.feedback_language or "en",
                "resume_text": ""
            }

            next_q_data = get_llm_service().generate_interview_question(
                session_context=session_ctx,
                question_index=next_index,
                total_questions=total_allowed,
                previous_qa=previous_qa,
                career_context=career_context,
                retrieved_knowledge=effective_chunks,
                adaptive_decision=adaptive_decision,
                language=interview.interview_language or "en"
            )

            next_seq = next_index + 1
            is_follow_up = bool(adaptive_decision.get("action") == "follow_up" or next_q_data.get("is_follow_up"))
            next_q_id = f"q_{uuid.uuid4().hex[:10]}"
            next_source = next_q_data["source_type"]
            if vault_chunks and (next_source == "rag_grounded" or "vault" in str(next_q_data).lower()):
                next_source = "Question Vault (Community Company Question)"

            next_q_model = InterviewQuestion(
                id=next_q_id,
                session_id=session_id,
                user_id=user_id,
                sequence_number=next_seq,
                question=next_q_data["question_text"],
                skill=next_q_data["skill"],
                difficulty=next_q_data["difficulty"],
                question_type=next_q_data["question_type"],
                generated_source=next_source,
                expected_focus=next_q_data.get("rubric_guidance") or next_q_data.get("rationale") or "",
                rag_chunk_id=rag_chunks[0].get("id") if rag_chunks else None,
                is_follow_up=is_follow_up,
                created_at=utc_now()
            )
            db.add(next_q_model)
            db.commit()

            next_q_resp = InterviewQuestionResponse(
                id=next_q_model.id,
                session_id=session_id,
                sequence_number=next_seq,
                question=next_q_model.question,
                skill=next_q_model.skill,
                difficulty=next_q_model.difficulty,
                question_type=next_q_model.question_type,
                generated_source=next_q_model.generated_source,
                expected_focus=next_q_model.expected_focus,
                is_follow_up=next_q_model.is_follow_up,
                created_at=next_q_model.created_at
            )

            decision = NextQuestionDecision(
                action=adaptive_decision["action"],
                target_skill=next_q_model.skill,
                difficulty=next_q_model.difficulty,
                reason=adaptive_decision["reason"],
                follow_up_type=adaptive_decision.get("follow_up_type"),
                missing_concepts=adaptive_decision.get("missing_concepts", []),
                topic=next_q_model.skill
            )
            return AnswerSubmissionResponse(
                evaluation=eval_response,
                next_question=next_q_resp,
                adaptive_decision=decision,
                is_complete=False,
                completed_count=completed_count,
                total_questions=total_allowed
            )

        else:
            # Interview questions completed! Trigger complete_session
            final_report = self.complete_session(db, user_id, session_id)
            decision = NextQuestionDecision(
                action="complete",
                target_skill=None,
                difficulty=interview.difficulty,
                reason="All questions in this round have been answered. Generating final hiring rubric."
            )
            return AnswerSubmissionResponse(
                evaluation=eval_response,
                next_question=None,
                adaptive_decision=decision,
                is_complete=True,
                completed_count=total_allowed,
                total_questions=total_allowed
            )


    def complete_session(
        self,
        db: Session,
        user_id: str,
        session_id: str
    ) -> FinalInterviewReportResponse:
        """
        Finalizes an interview session, calculates aggregate hiring rubrics,
        updates Skill Gaps, logs verified +100 XP activity, and builds Next-Best-Action.
        """
        interview = (
            db.query(Interview)
            .filter(Interview.id == session_id, Interview.user_id == user_id)
            .first()
        )
        if not interview:
            raise ValueError(f"Interview session {session_id} not found for this candidate.")

        questions = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session_id)
            .order_by(InterviewQuestion.sequence_number.asc())
            .all()
        )
        answers = (
            db.query(InterviewAnswer)
            .filter(InterviewAnswer.session_id == session_id)
            .all()
        )
        evaluations = (
            db.query(AnswerEvaluation)
            .filter(AnswerEvaluation.session_id == session_id)
            .all()
        )

        q_dicts = [
            {"id": q.id, "question_text": q.question, "topic": q.skill, "skill": q.skill, "difficulty": q.difficulty}
            for q in questions
        ]
        a_dicts = [
            {"id": a.id, "question_id": a.question_id, "answer_text": a.answer}
            for a in answers
        ]
        e_dicts = [
            {
                "id": e.id,
                "overall_score": e.overall_score,
                "technical_accuracy": e.technical_accuracy,
                "communication_quality": e.communication_quality,
                "relevance": e.relevance,
                "completeness": e.completeness,
                "confidence_indicators": e.confidence_indicators,
                "strengths": json.loads(e.strengths_json) if e.strengths_json else [],
                "weaknesses": json.loads(e.weaknesses_json) if e.weaknesses_json else []
            }
            for e in evaluations
        ]

        career_context = build_user_career_context(user_id, db)

        final_data = get_llm_service().generate_final_interview_feedback(
            session=interview.as_dict(),
            questions=q_dicts,
            answers=a_dicts,
            evaluations=e_dicts,
            career_context=career_context,
            language=interview.feedback_language or "en"
        )

        now = utc_now()
        interview.status = "completed"
        interview.completed_at = now
        interview.overall_score = final_data["overall_score"]
        interview.passed = final_data["passed"]
        interview.rubric_scores = final_data["rubric_scores"]
        interview.rubric_scores_json = json.dumps(final_data["rubric_scores"])
        interview.feedback_summary = final_data["feedback_summary"]
        interview.strengths_json = json.dumps(final_data["strengths"])
        interview.weaknesses_json = json.dumps(final_data["weaknesses"])
        interview.recommendations_json = json.dumps(final_data["recommendations"])

        # Also store answers in legacy answers_json format for complete backward compatibility
        legacy_answers = []
        for q, a in zip(questions, answers):
            legacy_answers.append({
                "question": q.question,
                "answer": a.answer,
                "skill": q.skill
            })
        interview.answers_json = json.dumps(legacy_answers)

        # Build granular observed skills list for this interview session
        observed_skills_dict = {}
        for q in questions:
            ev = next((e for e in evaluations if e.question_id == q.id), None)
            score = ev.overall_score if ev else 70
            status = "Strong" if score >= 80 else ("Needs Practice" if score >= 65 else "Priority Focus")
            missing = ev.missing_concepts if ev else []
            observed_skills_dict[q.skill] = {
                "skill_name": q.skill,
                "score": score,
                "status": status,
                "question": q.question,
                "missing_concepts": missing
            }
        observed_skills = list(observed_skills_dict.values())

        # Record session-level evidence for rubrics
        rubric_scores = final_data.get("rubric_scores", {})
        if "communicationSTAR" in rubric_scores:
            try:
                record_skill_evidence(
                    db=db,
                    user_id=user_id,
                    skill_name="Communication",
                    source_type="interview",
                    source_id=session_id,
                    score=rubric_scores["communicationSTAR"],
                    evidence_text=f"Session communication rubric for {interview.role}",
                    confidence="medium"
                )
            except Exception:
                pass

        # Closed Loop 1: Sync Unified Skill Profile (calibrates multi-source evidence without destroying resume data)
        try:
            sync_unified_skill_profile(db=db, user_id=user_id, target_role=interview.role)
        except Exception as sync_err:
            # Fallback to direct gap updates if needed
            for gap in final_data.get("skill_gap_updates", []):
                skill_name = gap.get("skill_name")
                score = gap.get("score", 70)
                priority = gap.get("priority", "medium")
                if not skill_name:
                    continue
                existing = (
                    db.query(SkillGap)
                    .filter(SkillGap.user_id == user_id, SkillGap.skill_name == skill_name)
                    .first()
                )
                if existing:
                    existing.current_score = score
                    existing.priority = priority
                    existing.source = "generative_mock_interview"
                    existing.updated_at = now
                else:
                    db.add(SkillGap(
                        user_id=user_id,
                        skill_name=skill_name,
                        category="Technical",
                        current_score=score,
                        target_score=80,
                        priority=priority,
                        source="generative_mock_interview"
                    ))

        # Closed Loop 2: Log verified Activity (+100 XP) and Streak increment
        record_activity(
            db=db,
            user_id=user_id,
            data=ActivityCreate(
                type="interview_completed",
                related_module="interview",
                title=f"Completed {interview.difficulty} {interview.role} Mock Interview ({final_data['overall_score']}/100)",
                xp_earned=100,
                details={
                    "interviewId": session_id,
                    "role": interview.role,
                    "score": final_data["overall_score"],
                    "difficulty": interview.difficulty
                }
            )
        )

        db.commit()
        db.refresh(interview)

        return FinalInterviewReportResponse(
            session_id=interview.id,
            user_id=interview.user_id,
            target_role=interview.role,
            interview_type=interview.interview_type or "Technical",
            difficulty=interview.difficulty,
            overall_score=interview.overall_score,
            passed=interview.passed,
            rubric_scores=final_data["rubric_scores"],
            strengths=final_data["strengths"],
            weaknesses=final_data["weaknesses"],
            recommendations=final_data["recommendations"],
            next_best_action=final_data["next_best_action"],
            skill_gap_updates=final_data.get("skill_gap_updates", []),
            observed_skills=observed_skills,
            feedback_summary=interview.feedback_summary or "",
            feedback_language=interview.feedback_language or "en",
            fallback_notice=final_data.get("fallback_notice"),
            questions_completed=len(questions),
            total_questions=interview.total_questions or interview.questions_count or len(questions),
            started_at=interview.started_at or now,
            completed_at=interview.completed_at,
            answers_transcript=legacy_answers
        )

    def get_session_detail(
        self,
        db: Session,
        user_id: str,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Returns full session details including all questions, answers, and evaluations.
        """
        interview = (
            db.query(Interview)
            .filter(Interview.id == session_id, Interview.user_id == user_id)
            .first()
        )
        if not interview:
            raise ValueError(f"Interview session {session_id} not found for this candidate.")

        questions = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session_id)
            .order_by(InterviewQuestion.sequence_number.asc())
            .all()
        )
        answers = (
            db.query(InterviewAnswer)
            .filter(InterviewAnswer.session_id == session_id)
            .all()
        )
        evaluations = (
            db.query(AnswerEvaluation)
            .filter(AnswerEvaluation.session_id == session_id)
            .all()
        )

        ans_map = {a.question_id: a for a in answers}
        eval_map = {e.question_id: e for e in evaluations}

        turns = []
        for q in questions:
            a = ans_map.get(q.id)
            e = eval_map.get(q.id)
            turns.append({
                "question": {
                    "id": q.id,
                    "sequence_number": q.sequence_number,
                    "text": q.question,
                    "topic": q.skill,
                    "difficulty": q.difficulty,
                    "skill": q.skill,
                    "type": q.question_type,
                    "source": q.generated_source,
                    "expected_focus": q.expected_focus,
                    "is_follow_up": q.is_follow_up
                },
                "answer": {
                    "id": a.id if a else None,
                    "text": a.answer if a else None,
                    "submitted_at": a.submitted_at.isoformat() if a and a.submitted_at else None
                } if a else None,
                "evaluation": {
                    "overall_score": e.overall_score if e else None,
                    "technical_accuracy": e.technical_accuracy if e else None,
                    "communication_quality": e.communication_quality if e else None,
                    "relevance": e.relevance if e else None,
                    "completeness": e.completeness if e else None,
                    "confidence_indicators": e.confidence_indicators if e else None,
                    "strengths": json.loads(e.strengths_json) if e and e.strengths_json else [],
                    "weaknesses": json.loads(e.weaknesses_json) if e and e.weaknesses_json else [],
                    "feedback": e.feedback if e else None,
                    "follow_up_needed": e.follow_up_needed if e else False,
                    "follow_up_reason": e.follow_up_reason if e else None
                } if e else None
            })

        return {
            "session": interview.as_dict(),
            "turns": turns
        }

    def generate_quick_answer(
        self,
        db: Session,
        user_id: str,
        request: QuickAnswerRequest
    ) -> QuickAnswerResponse:
        """
        Generates a question-aware high-scoring answer suggestion for the active question.
        Grounded in candidate career profile, target role, and technical knowledge base.
        Populates candidate input for review/editing without submitting or advancing session.
        """
        # 1. Build candidate career context (known skills, target role, etc.)
        career_context = build_user_career_context(user_id, db)
        if request.target_role:
            career_context["target_role"] = request.target_role

        # 2. Retrieve grounded knowledge from RAG system
        topic = request.topic or "Machine Learning"
        rag_context = default_retrieval_service.retrieve_relevant_knowledge(
            query=f"{topic} {request.question}",
            user_context=career_context,
            top_k=2
        )

        # 3. Request dynamic quick answer from LLM Service (Local grounded fallback or OpenAI-compatible)
        target_role = request.target_role or career_context.get("target_role", "Machine Learning Engineer")
        retrieved_chunks = rag_context.get("chunks", []) if isinstance(rag_context, dict) else (rag_context or [])
        result = get_llm_service().generate_quick_answer(
            question=request.question,
            topic=topic,
            difficulty=request.difficulty or "Intermediate",
            interview_type=request.interview_type or "Technical",
            target_role=target_role,
            career_context=career_context,
            retrieved_chunks=retrieved_chunks,
            language=request.language or "en"
        )

        return QuickAnswerResponse(
            quick_answer=result.get("quick_answer", ""),
            topic=result.get("topic", topic),
            strategy=result.get("strategy", "technical_concept"),
            source=result.get("source", "rag_grounded")
        )



# Singleton instance
default_interview_engine = InterviewEngine()
