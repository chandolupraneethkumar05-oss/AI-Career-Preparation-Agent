"""
Comprehensive Test Suite for Peer-to-Peer Collaborative Chamber & Reverse Mock Interview
AI Career Preparation Agent
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.peer_room_service import (
    default_peer_room_service,
    default_reverse_interview_service,
    PeerRoom
)


@pytest.fixture
def client():
    return TestClient(app)


def test_peer_room_creation(client):
    """Verifies creating a peer room via REST returns room ID and join URLs."""
    res = client.post("/api/peer-rooms/create", json={
        "role": "Backend Engineer",
        "difficulty": "Intermediate",
        "topic": "Distributed Concurrency & Locking"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["room_id"].startswith(("ROOM-", "PEER-"))
    assert data["role"] == "Backend Engineer"
    assert "interviewer_url" in data
    assert "candidate_url" in data

    # Verify retrieval
    room_res = client.get(f"/api/peer-rooms/{data['room_id']}")
    assert room_res.status_code == 200
    room_data = room_res.json()["room"]
    assert room_data["room_id"] == data["room_id"]
    assert room_data["status"] == "waiting"


def test_ai_question_generation_and_fallback():
    """Verifies AI question teleprompter produces required keys and follow-ups."""
    q = default_peer_room_service.generate_ai_question(
        role="Software Engineer",
        difficulty="Intermediate",
        topic="Microservices & APIs",
        question_num=1
    )
    assert "question" in q
    assert "what_to_look_for" in q
    assert len(q["what_to_look_for"]) > 0
    assert "probing_follow_ups" in q
    assert len(q["probing_follow_ups"]) > 0


def test_live_answer_eval_copilot():
    """Verifies live answer evaluation gives real-time proctoring hints."""
    q = {
        "question": "Explain optimistic concurrency versus row-level locking.",
        "what_to_look_for": [
            "Mentions version columns or timestamps",
            "Mentions SELECT FOR UPDATE",
            "Discusses collision frequency"
        ],
        "probing_follow_ups": ["How do you handle retry storms?"]
    }
    answer = "We can use a version column in the database table so when two users update, only one succeeds without locking rows."
    hint = default_peer_room_service.evaluate_live_answer(q, answer)
    assert "coverage_status" in hint
    assert "suggested_probe" in hint


def test_joint_360_evaluation_generation():
    """Verifies 360° evaluation grades both the candidate and the student interviewer."""
    room = PeerRoom("ROOM-TEST99", "Software Engineer", "Intermediate")
    room.interviewer = {"user_id": "u1", "user_name": "Sarah (Interviewer)", "ws": None}
    room.candidate = {"user_id": "u2", "user_name": "Devin (Candidate)", "ws": None}
    room.transcript = [
        {"speaker": "interviewer", "text": "Can you explain how you design an idempotent payment API?"},
        {"speaker": "candidate", "text": "I would generate a client UUID idempotency key stored in Redis and check database transaction state."},
        {"speaker": "interviewer", "text": "What happens if the database crashes after the payment processor charges the card?"},
        {"speaker": "candidate", "text": "We implement a reconciliation worker with exponential backoff."}
    ]
    report = default_peer_room_service.generate_360_evaluation(room)
    assert "candidate_evaluation" in report
    assert "interviewer_evaluation" in report
    assert report["candidate_evaluation"]["overall_score"] >= 0
    assert report["interviewer_evaluation"]["overall_score"] >= 0
    assert "strengths" in report["candidate_evaluation"]
    assert "leadership_verdict" in report["interviewer_evaluation"]


def test_reverse_mock_interview_flow(client):
    """Verifies Reverse Mock Interview: user starts session, asks question, and gets evaluation."""
    # 1. Start reverse interview
    start_res = client.post("/api/interviews/reverse/start", json={
        "role": "Frontend Engineer",
        "difficulty": "Intermediate"
    })
    assert start_res.status_code == 200, start_res.text
    data = start_res.json()
    sess_id = data["session"]["session_id"]
    assert data["opening_turn"]["speaker"] == "candidate"

    # 2. User asks candidate Alex a question
    ask_res = client.post("/api/interviews/reverse/ask", json={
        "session_id": sess_id,
        "message": "Can you explain how React's virtual DOM diffing works and how keys prevent unnecessary re-renders?"
    })
    assert ask_res.status_code == 200, ask_res.text
    turn_data = ask_res.json()["turn"]
    assert turn_data["speaker"] == "candidate"
    assert len(turn_data["text"]) > 20
    assert "candidate_thought" in turn_data
    assert "interviewer_guidance_tip" in turn_data

    # 3. User finishes session and receives leadership evaluation
    finish_res = client.post("/api/interviews/reverse/finish", json={
        "session_id": sess_id
    })
    assert finish_res.status_code == 200, finish_res.text
    eval_data = finish_res.json()["evaluation"]
    assert "overall_score" in eval_data
    assert "question_clarity" in eval_data
    assert "probing_depth" in eval_data
    assert "hint_calibration" in eval_data
    assert "leadership_mentorship" in eval_data
    assert "verdict" in eval_data


def test_websocket_signaling_peer_exchange(client):
    """Verifies WebSocket handshake, joining, and signaling relay between two peers."""
    room_res = client.post("/api/peer-rooms/create", json={
        "role": "Software Engineer",
        "difficulty": "Beginner"
    })
    room_id = room_res.json()["room_id"]

    # Connect Interviewer WebSocket
    with client.websocket_connect(f"/api/ws/peer-room/{room_id}") as ws_interviewer:
        ws_interviewer.send_json({
            "type": "join",
            "role": "interviewer",
            "userId": "usr_int_1",
            "userName": "Lead Interviewer"
        })
        resp1 = ws_interviewer.receive_json()
        assert resp1["type"] == "joined"
        assert resp1["role"] == "interviewer"

        # Connect Candidate WebSocket
        with client.websocket_connect(f"/api/ws/peer-room/{room_id}") as ws_candidate:
            ws_candidate.send_json({
                "type": "join",
                "role": "candidate",
                "userId": "usr_cand_2",
                "userName": "Job Applicant"
            })
            resp2 = ws_candidate.receive_json()
            assert resp2["type"] == "joined"
            assert resp2["role"] == "candidate"

            # Interviewer receives peer_joined event and initiate_offer trigger
            peer_joined_evt = ws_interviewer.receive_json()
            assert peer_joined_evt["type"] == "peer_joined"
            assert peer_joined_evt["peerRole"] == "candidate"

            initiate_evt = ws_interviewer.receive_json()
            assert initiate_evt["type"] == "initiate_offer"

            # Both peers receive synchronized session_start when both are connected
            cand_start = ws_candidate.receive_json()
            assert cand_start["type"] == "session_start"
            int_start = ws_interviewer.receive_json()
            assert int_start["type"] == "session_start"

            # Test WebRTC Offer relay from Interviewer to Candidate
            ws_interviewer.send_json({
                "type": "signal_offer",
                "sdp": {"type": "offer", "sdp": "fake_sdp_offer_content"}
            })
            cand_signal = ws_candidate.receive_json()
            assert cand_signal["type"] == "signal_offer"
            assert cand_signal["sdp"]["sdp"] == "fake_sdp_offer_content"

            # Test AI Question Teleprompter request by Interviewer
            ws_interviewer.send_json({"type": "request_ai_question"})
            teleprompter = ws_interviewer.receive_json()
            assert teleprompter["type"] == "ai_question_suggested"
            assert "question" in teleprompter["question"]

            # Interviewer pushes question to Candidate
            ws_interviewer.send_json({"type": "push_question_to_candidate"})
            cand_q = ws_candidate.receive_json()
            assert cand_q["type"] == "active_question"
            int_q = ws_interviewer.receive_json()
            assert int_q["type"] == "active_question"
