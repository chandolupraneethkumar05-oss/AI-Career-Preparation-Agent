"""
Peer Interview Room Persistence & Server Reboot Recovery Test
AI Career Preparation Agent
"""

import os
import sys
import unittest
import asyncio
from typing import Dict, Any

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.database import SessionLocal, init_db
from app.db.models import PeerRoomSession
from app.services.peer_room_service import default_peer_room_service, PeerRoom


class TestPeerRoomPersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_room_creation_persists_to_database(self):
        """Verifies that room creation immediately saves a record in peer_room_sessions table."""
        room = asyncio.run(default_peer_room_service.create_room(
            role="Distributed Systems Architect",
            difficulty="Advanced",
            topic="Consensus Algorithms (Raft & Paxos)"
        ))

        self.assertIsNotNone(room.room_id)

        with SessionLocal() as db:
            db_room = db.query(PeerRoomSession).filter(PeerRoomSession.id == room.room_id).first()
            self.assertIsNotNone(db_room, "Peer room was not persisted to SQLite!")
            self.assertEqual(db_room.role, "Distributed Systems Architect")
            self.assertEqual(db_room.difficulty, "Advanced")
            self.assertEqual(db_room.topic, "Consensus Algorithms (Raft & Paxos)")

    def test_02_server_restart_hydration_from_database(self):
        """CRITICAL: Simulates backend restart (_rooms cache wiped) and verifies room hydration from DB."""
        # 1. Create room
        room = asyncio.run(default_peer_room_service.create_room(
            role="Site Reliability Engineer",
            difficulty="Intermediate",
            topic="Incident Management & Post-Mortems"
        ))
        room_id = room.room_id

        # Add mock transcript and question
        room.questions.append({"question": "How do you mitigate a cascading service failure?", "difficulty": "Intermediate"})
        room.transcript.append({"speaker": "interviewer", "text": "Walk me through your runbook triage."})
        default_peer_room_service._persist_room_sync(room)

        # 2. Simulate complete server reboot / memory flush
        default_peer_room_service._rooms.clear()
        self.assertNotIn(room_id, default_peer_room_service._rooms)

        # 3. Retrieve room via get_room (should transparently hydrate from SQLite)
        hydrated = default_peer_room_service.get_room(room_id)
        self.assertIsNotNone(hydrated, "Failed to hydrate room from SQLite after simulated server restart!")
        self.assertEqual(hydrated.room_id, room_id)
        self.assertEqual(hydrated.role, "Site Reliability Engineer")
        self.assertEqual(len(hydrated.questions), 1)
        self.assertEqual(len(hydrated.transcript), 1)
        self.assertEqual(hydrated.transcript[0]["text"], "Walk me through your runbook triage.")

    def test_03_report_persists_across_restart(self):
        """Verifies that 360 evaluation reports persist and are readable after cache flush."""
        room = asyncio.run(default_peer_room_service.create_room(
            role="Frontend Architect",
            difficulty="Advanced"
        ))
        room_id = room.room_id

        # Generate report
        report = default_peer_room_service.generate_fallback_360_evaluation(room)
        self.assertIsNotNone(report)

        # Wipe memory
        default_peer_room_service._rooms.clear()

        # Re-fetch
        rehydrated = default_peer_room_service.get_room(room_id)
        self.assertIsNotNone(rehydrated.final_report, "Final report was lost after memory clear!")
        self.assertIn("candidate_evaluation", rehydrated.final_report)
        self.assertIn("interviewer_evaluation", rehydrated.final_report)


if __name__ == "__main__":
    unittest.main()
