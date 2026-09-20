import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app

class TestRealtimeVoice(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_create_session_endpoint(self):
        payload = {
            "role": "Machine Learning Engineer",
            "difficulty": "Advanced",
            "topic": "Transformers & LLM Optimization",
            "voice_name": "Puck"
        }
        response = self.client.post('/api/realtime-voice/session', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('session_id', data)
        self.assertIn('mode', data)
        self.assertIn(data['mode'], ['live', 'simulated'])
        self.assertEqual(data['voice_name'], 'Puck')
        self.assertIn('Machine Learning Engineer', data['system_instruction'])
        self.assertIn('Transformers & LLM Optimization', data['system_instruction'])

    def test_append_and_get_transcript(self):
        session_payload = {
            "role": "Backend Engineer",
            "difficulty": "Intermediate",
            "topic": "Databases & Caching"
        }
        session_res = self.client.post('/api/realtime-voice/session', json=session_payload)
        self.assertEqual(session_res.status_code, 200)
        session_id = session_res.json()['session_id']

        # Append interviewer turn
        turn1 = {"session_id": session_id, "speaker": "interviewer", "text": "Can you explain database indexing?"}
        res1 = self.client.post('/api/realtime-voice/transcript', json=turn1)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()['status'], 'recorded')

        # Append candidate turn
        turn2 = {"session_id": session_id, "speaker": "candidate", "text": "B-Trees are commonly used for indexing..."}
        res2 = self.client.post('/api/realtime-voice/transcript', json=turn2)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()['status'], 'recorded')

        # Retrieve transcript
        get_res = self.client.get(f'/api/realtime-voice/transcript/{session_id}')
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        history = data['turns']
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]['speaker'], 'interviewer')
        self.assertEqual(history[1]['speaker'], 'candidate')
        self.assertIn('B-Trees', history[1]['text'])

    def test_fallback_simulation_mode(self):
        # When running without production API credentials, session gracefully degrades to simulated mode
        with patch.dict('os.environ', {'GEMINI_API_KEY': ''}, clear=False):
            payload = {
                "role": "Frontend Architect",
                "difficulty": "Expert",
                "topic": "Browser Rendering Pipelines"
            }
            response = self.client.post('/api/realtime-voice/session', json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data['mode'], 'simulated')
            self.assertTrue(data['token'].startswith('ephemeral_sim_'))
            self.assertIn('Frontend Architect', data['system_instruction'])

    def test_create_session_with_10_questions(self):
        payload = {
            "role": "Distributed Systems Engineer",
            "difficulty": "Advanced",
            "topic": "Consensus & Raft",
            "total_questions": 10
        }
        response = self.client.post('/api/realtime-voice/session', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('total_questions'), 10)
        self.assertIn('EXACTLY 10 TECHNICAL QUESTIONS', data['system_instruction'])
        self.assertIn('Question 10 of 10', data['system_instruction'])

if __name__ == '__main__':
    unittest.main()
