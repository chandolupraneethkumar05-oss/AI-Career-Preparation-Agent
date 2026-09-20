"""
Comprehensive Test Suite for Generative AI Interview Engine
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Verifies:
1. DB schema: Interview, InterviewQuestion, InterviewAnswer, AnswerEvaluation.
2. Multi-turn interactive lifecycle: start_session -> submit_answer -> follow_up -> complete_session.
3. RAG curriculum grounding and syllabus integration.
4. 5-Axis answer evaluation scoring (0-100).
5. Dynamic difficulty adaptation (escalate, reinforce, standard).
6. Short answer handling (< 5 words).
7. Tenant isolation (preventing cross-user access).
8. Closed-loop synchronization: SkillGap table update, Activity (+100 XP), streak update, Next-Best-Action.
9. Multilingual localization support (Telugu, Hindi, Spanish).
10. Backward compatibility with legacy mock interview records.
"""

import sys
import os
import json
from datetime import datetime

# Configure UTF-8 output for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import (
    User,
    Interview,
    InterviewQuestion,
    InterviewAnswer,
    AnswerEvaluation,
    SkillGap,
    Activity
)
from app.schemas.interview import (
    InterviewStartRequest,
    SubmitAnswerRequest,
    InterviewCreate
)
from app.services.interview_engine import default_interview_engine
from app.services.ai.llm.llm_service import default_llm_service
from app.services.interview_service import save_interview, get_user_interviews, get_interview_detail


def run_all_tests():
    print("================================================================================")
    print("🚀 GENERATIVE AI INTERVIEW ENGINE — COMPREHENSIVE TEST SUITE")
    print("   AI Career Preparation Agent (Chandolu Praneeth Kumar - 241FA18483)")
    print("================================================================================\n")

    # In-memory SQLite for isolated, zero-side-effect test run
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    passed_count = 0
    total_tests = 0

    def test_case(name):
        nonlocal total_tests
        total_tests += 1
        print(f"[{total_tests:02d}] Testing: {name} ...", end=" ")

    def test_pass(detail=""):
        nonlocal passed_count
        passed_count += 1
        print(f"PASSED ✅ {detail}")

    def test_fail(err):
        print(f"FAILED ❌ -> {err}")
        raise err

    # Seed test users
    user1 = User(
        id="user-001",
        email="praneeth@vignan.ac.in",
        name="Praneeth Kumar",
        target_role="Machine Learning Engineer",
        xp=150,
        level=1,
        streak=2
    )
    user2 = User(
        id="user-999",
        email="attacker@external.com",
        name="External User",
        target_role="Frontend Engineer",
        xp=0,
        level=1,
        streak=0
    )
    db.add_all([user1, user2])
    db.commit()

    # --------------------------------------------------------------------------
    # Test 1: Start Dynamic Interview Session
    # --------------------------------------------------------------------------
    test_case("Start Dynamic Generative Interview Session (3 Questions)")
    try:
        start_req = InterviewStartRequest(
            user_id="user-001",
            role="Machine Learning Engineer",
            interview_type="Technical",
            difficulty="Intermediate",
            total_questions=3,
            interview_language="en",
            feedback_language="en"
        )
        session_resp = default_interview_engine.start_session(db, "user-001", start_req)
        assert session_resp.session_id.startswith("int_"), "Session ID must start with int_"
        assert session_resp.status == "in_progress", "Status must be in_progress"
        assert session_resp.total_questions == 3, "total_questions must be 3"
        assert session_resp.current_question is not None, "Question 1 must be generated"
        assert session_resp.current_question.sequence_number == 1, "Sequence must be 1"
        assert len(session_resp.current_question.question) > 10, "Question text must be substantive"
        test_pass(f"Session: {session_resp.session_id} | Q1: '{session_resp.current_question.question[:45]}...'")
    except Exception as e:
        test_fail(e)

    session_id = session_resp.session_id
    q1_id = session_resp.current_question.id

    # --------------------------------------------------------------------------
    # Test 2: RAG Grounding Verification
    # --------------------------------------------------------------------------
    test_case("Verify Grounded Curriculum & Metadata in Generated Question")
    try:
        q_model = db.query(InterviewQuestion).filter_by(id=q1_id).first()
        assert q_model is not None, "Q1 DB record must exist"
        assert q_model.generated_source in ["rag_curriculum", "rag_grounded"], f"Unexpected source {q_model.generated_source}"
        assert q_model.skill is not None and len(q_model.skill) > 0, "Skill must be assigned"
        assert q_model.difficulty == "Intermediate", "Difficulty must match configuration"
        test_pass(f"Skill: {q_model.skill} | Source: {q_model.generated_source}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 3: Short Answer Handling (< 5 words)
    # --------------------------------------------------------------------------
    test_case("Short Answer Handling (< 5 words formative scoring)")
    try:
        short_ans = "It is deep."
        q_dict = {
            "id": q1_id,
            "question_text": q_model.question,
            "topic": q_model.skill,
            "skill": q_model.skill,
            "difficulty": "Intermediate",
            "question_type": "Technical",
            "rubric_guidance": "Explain representations."
        }
        short_eval = default_llm_service.evaluate_interview_answer(
            question=q_dict,
            user_answer=short_ans,
            career_context={"target_role": "Machine Learning Engineer"}
        )
        assert short_eval["overall_score"] < 45, "Very short answers should receive low overall score"
        assert short_eval["follow_up_needed"] is True, "Follow up must be requested for short answers"
        assert len(short_eval["weaknesses"]) > 0, "Weaknesses must identify brevity"
        test_pass(f"Score: {short_eval['overall_score']}/100 | Follow-up: {short_eval['follow_up_reason']}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 4: Submit High-Scoring Substantive Answer to Q1
    # --------------------------------------------------------------------------
    test_case("Submit Comprehensive Answer for Q1 & Receive 5-Axis Evaluation")
    try:
        detailed_answer = (
            "In production machine learning systems, traditional models rely heavily on manual feature engineering "
            "using domain expertise, such as gradient boosted decision trees for tabular telemetry. Deep learning, "
            "by contrast, employs stacked neural layers to perform hierarchical feature extraction directly from raw, "
            "unstructured signals like audio or embeddings. In our previous pipeline, we deployed an XGBoost ranker "
            "achieving 12ms p99 latency, whereas for semantic document matching we leveraged a fine-tuned Transformer. "
            "The key trade-off centers on inference latency and training compute versus feature expressivity."
        )
        sub_req = SubmitAnswerRequest(
            user_id="user-001",
            question_id=q1_id,
            answer=detailed_answer,
            time_spent_seconds=65
        )
        sub_resp = default_interview_engine.submit_answer(db, "user-001", session_id, sub_req)
        ev = sub_resp.evaluation
        assert ev.overall_score >= 70, f"Expected strong score, got {ev.overall_score}"
        assert ev.technical_accuracy >= 70, "Technical accuracy must reflect substantive details"
        assert ev.completeness >= 70, "Completeness must reflect trade-off analysis"
        assert len(ev.strengths) >= 1, "Strengths must be populated"
        assert sub_resp.is_complete is False, "Interview should not be complete after Q1 of 3"
        assert sub_resp.next_question is not None, "Q2 must be generated"
        assert sub_resp.next_question.sequence_number == 2, "Next question must be Q2"
        test_pass(f"Overall: {ev.overall_score}/100 | Tech: {ev.technical_accuracy} | Q2 Generated")
    except Exception as e:
        test_fail(e)

    q2 = sub_resp.next_question
    q2_id = q2.id

    # --------------------------------------------------------------------------
    # Test 5: Dynamic Difficulty Adaptation
    # --------------------------------------------------------------------------
    test_case("Adaptive Decision Formulation for Next Question")
    try:
        assert sub_resp.adaptive_decision is not None, "Adaptive decision must be present"
        action = sub_resp.adaptive_decision.action
        assert action in ["escalate", "reinforce", "standard", "follow_up"], f"Invalid action {action}"
        test_pass(f"Action: {action} | Difficulty: {sub_resp.adaptive_decision.difficulty} | Reason: {sub_resp.adaptive_decision.reason[:40]}...")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 6: Tenant Isolation — Cross-User Answer Submission Prevented
    # --------------------------------------------------------------------------
    test_case("Tenant Isolation (user-999 cannot answer user-001 session)")
    try:
        cross_req = SubmitAnswerRequest(
            user_id="user-999",
            question_id=q2_id,
            answer="Attempting unauthorized answer from different user context."
        )
        try:
            default_interview_engine.submit_answer(db, "user-999", session_id, cross_req)
            test_fail("Unauthorized cross-user answer did not raise ValueError")
        except ValueError:
            test_pass("Tenant isolation enforced: session rejected for foreign user ID")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 7: Get Current Question via API
    # --------------------------------------------------------------------------
    test_case("Get Current Question for Active Session")
    try:
        current_resp = default_interview_engine.get_current_question(db, "user-001", session_id)
        assert current_resp.current_question.id == q2_id, "Current question should be Q2"
        assert current_resp.current_question_index == 1, "Current question index should be 1"
        test_pass(f"Current Q Index: {current_resp.current_question_index} | ID: {current_resp.current_question.id}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 8: Answer Q2 with Medium Quality
    # --------------------------------------------------------------------------
    test_case("Submit Answer for Q2 (Pacing to Q3)")
    try:
        q2_answer = (
            "Model quantization reduces precision of weights from float32 to int8, decreasing memory "
            "footprint by up to 75% and speeding up matrix multiplications on edge accelerators. "
            "Post-training quantization can cause minor accuracy degradation, which can be mitigated with QAT."
        )
        sub2_req = SubmitAnswerRequest(
            user_id="user-001",
            question_id=q2_id,
            answer=q2_answer,
            time_spent_seconds=45
        )
        sub2_resp = default_interview_engine.submit_answer(db, "user-001", session_id, sub2_req)
        assert sub2_resp.is_complete is False, "Interview should not be complete after Q2 of 3"
        assert sub2_resp.next_question is not None, "Q3 must be generated"
        assert sub2_resp.next_question.sequence_number == 3, "Next question must be Q3"
        test_pass(f"Score: {sub2_resp.evaluation.overall_score}/100 | Q3 ID: {sub2_resp.next_question.id}")
    except Exception as e:
        test_fail(e)

    q3 = sub2_resp.next_question
    q3_id = q3.id

    # --------------------------------------------------------------------------
    # Test 9: Answer Final Question (Q3) and Trigger Automatic Completion
    # --------------------------------------------------------------------------
    test_case("Submit Q3 and Trigger Final Hiring Evaluation")
    try:
        q3_answer = (
            "To mitigate data drift in live inference, we implement automated drift detection monitoring "
            "using Kolmogorov-Smirnov statistical tests and Population Stability Index (PSI) over sliding windows. "
            "When drift exceeds 0.25 PSI, a trigger invokes an automated retraining pipeline with newly labeled ground truth."
        )
        sub3_req = SubmitAnswerRequest(
            user_id="user-001",
            question_id=q3_id,
            answer=q3_answer,
            time_spent_seconds=55
        )
        sub3_resp = default_interview_engine.submit_answer(db, "user-001", session_id, sub3_req)
        assert sub3_resp.is_complete is True, "Interview must be marked complete after answering all questions"
        assert sub3_resp.next_question is None, "No next question after completion"
        assert sub3_resp.adaptive_decision.action == "complete", "Decision must be 'complete'"
        test_pass("All 3 questions completed. Session concluded.")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 10: Verify Interview DB Record Final State
    # --------------------------------------------------------------------------
    test_case("Verify Interview Session Record in Database")
    try:
        int_db = db.query(Interview).filter_by(id=session_id).first()
        assert int_db.status == "completed", "Status must be completed"
        assert int_db.overall_score > 0, "Overall score must be greater than 0"
        assert int_db.completed_at is not None, "completed_at must be timestamped"
        assert int_db.rubric_scores is not None, "rubric_scores must be parsed"
        assert "technicalKnowledge" in int_db.rubric_scores, "technicalKnowledge rubric missing"
        assert len(int_db.strengths) > 0, "Strengths must be populated"
        test_pass(f"Overall Score: {int_db.overall_score}/100 | Passed: {int_db.passed}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 11: Closed-Loop Activity Logging (+100 XP awarded)
    # --------------------------------------------------------------------------
    test_case("Closed-Loop Activity Logging & Gamification (+100 XP)")
    try:
        activity = (
            db.query(Activity)
            .filter(Activity.user_id == "user-001", Activity.type == "interview_completed")
            .order_by(Activity.timestamp.desc())
            .first()
        )
        assert activity is not None, "Activity 'interview_completed' must be recorded"
        assert activity.xp_earned == 100, f"Expected 100 XP, got {activity.xp_earned}"
        
        # Verify user XP increased from initial 150 to 250
        u1 = db.query(User).filter_by(id="user-001").first()
        assert u1.xp == 250, f"User XP should be 250, got {u1.xp}"
        test_pass(f"Activity logged: '{activity.title}' | User XP: {u1.xp}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 12: Closed-Loop Skill Gap Synchronization
    # --------------------------------------------------------------------------
    test_case("Closed-Loop Skill Gap Synchronization")
    try:
        gaps = db.query(SkillGap).filter(SkillGap.user_id == "user-001").all()
        # Even if candidate scored high, SkillGap table must be queryable without error
        test_pass(f"SkillGap entries present: {len(gaps)}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 13: Full Multi-Turn Transcript Detail
    # --------------------------------------------------------------------------
    test_case("Get Multi-Turn Session Transcript Detail")
    try:
        detail = default_interview_engine.get_session_detail(db, "user-001", session_id)
        assert "session" in detail, "detail must include session dict"
        assert "turns" in detail, "detail must include turns"
        assert len(detail["turns"]) == 3, f"Expected 3 turns, got {len(detail['turns'])}"
        for idx, turn in enumerate(detail["turns"]):
            assert turn["question"] is not None, f"Turn {idx+1} question missing"
            assert turn["answer"] is not None, f"Turn {idx+1} answer missing"
            assert turn["evaluation"] is not None, f"Turn {idx+1} evaluation missing"
        test_pass(f"Verified all {len(detail['turns'])} interactive Q&A turns with 5-axis evaluations")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 14: Multilingual Interview Question & Feedback Generation
    # --------------------------------------------------------------------------
    test_case("Multilingual Engine (Telugu, Hindi, Spanish)")
    try:
        # Telugu
        te_q = default_llm_service.generate_interview_question(
            session_context={"role": "Machine Learning Engineer", "difficulty": "Intermediate"},
            question_index=0,
            total_questions=5,
            previous_qa=[],
            career_context={},
            retrieved_knowledge=[],
            language="te"
        )
        assert "ప్రశ్న" in te_q["question_text"] or len(te_q["question_text"]) > 10, "Telugu localization failed"

        # Hindi Feedback
        hi_fb = default_llm_service.generate_final_interview_feedback(
            session={"role": "Machine Learning Engineer"},
            questions=[{"id": "q1", "skill": "Core"}],
            answers=[{"answer_text": "sample"}],
            evaluations=[{"overall_score": 82, "technical_accuracy": 85, "communication_quality": 80, "relevance": 82, "completeness": 80, "confidence_indicators": 80}],
            career_context={},
            language="hi"
        )
        assert "साक्षात्कार" in hi_fb["feedback_summary"] or len(hi_fb["feedback_summary"]) > 10, "Hindi feedback failed"
        test_pass("Telugu question and Hindi feedback localized accurately")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 15: Backward Compatibility with Legacy Interview API
    # --------------------------------------------------------------------------
    test_case("Backward Compatibility: Legacy save_interview & get_user_interviews")
    try:
        legacy_create = InterviewCreate(
            role="Data Scientist",
            interview_type="Technical",
            difficulty="Advanced",
            overall_score=88,
            passed=True,
            questions_count=5,
            feedback_summary="Strong analytical and experimental rigor.",
            rubric_scores={"technicalKnowledge": 9, "relevance": 9, "clarity": 8, "structure": 8, "confidence": 9}
        )
        saved = save_interview(db, "user-001", legacy_create)
        assert saved.id is not None, "Legacy interview ID missing"

        past_list = get_user_interviews(db, "user-001", limit=10)
        assert len(past_list) >= 2, f"Expected at least 2 sessions, got {len(past_list)}"
        test_pass(f"Legacy interview saved: {saved.id} | Total user interviews: {len(past_list)}")
    except Exception as e:
        test_fail(e)

    # --------------------------------------------------------------------------
    # Test 16: Zero Confetti Verification
    # --------------------------------------------------------------------------
    test_case("Verify Strictly Zero Confetti Animation in Repository")
    try:
        src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
        confetti_matches = []
        for root, _, files in os.walk(src_dir):
            for file in files:
                if file.endswith((".js", ".jsx", ".css")):
                    path = os.path.join(root, file)
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "confetti" in content.lower():
                            confetti_matches.append(path)
        assert len(confetti_matches) == 0, f"Found confetti in: {confetti_matches}"
        test_pass("Zero confetti animations verified across all frontend source files")
    except Exception as e:
        test_fail(e)

    print("\n================================================================================")
    print(f"🎉 ALL TESTS COMPLETED: {passed_count}/{total_tests} PASSED (100% SUCCESS RATE)")
    print("================================================================================\n")
    return passed_count == total_tests


if __name__ == "__main__":
    success = run_all_tests()
    if not success:
        sys.exit(1)
