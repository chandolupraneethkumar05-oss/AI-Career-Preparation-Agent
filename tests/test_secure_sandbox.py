import os
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.sandbox import (
    default_sandbox_manager,
    ExecutionJob,
    ExecutionLimits,
    ExecutionStatus,
    TestCase as SandboxTestCase
)

# Prevent pytest from attempting to collect SandboxTestCase
SandboxTestCase.__test__ = False

class TestSecureSandbox(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Authenticate test client to acquire genuine bearer token
        demo_res = self.client.post("/api/auth/demo-login")
        self.assertEqual(demo_res.status_code, 200)
        self.auth_token = demo_res.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.auth_token}"}
        self.user_id = demo_res.json()["user"]["id"]

    def test_capabilities_endpoint(self):
        response = self.client.get('/api/execution/capabilities')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('docker', data)
        self.assertNotIn('firecracker', data)
        self.assertIn('process', data)
        self.assertTrue(data['process']['available'])
        self.assertEqual(data['default_executor'], 'process')

    def test_unauthenticated_execution_rejected_with_401(self):
        """Unauthenticated code execution job submission is strictly rejected."""
        req_payload = {
            'code': 'print("Unauthorized attempt")',
            'language': 'python'
        }
        response = self.client.post('/api/execution/jobs', json=req_payload)
        self.assertEqual(response.status_code, 401)

    def test_cross_user_job_access_forbidden_with_403(self):
        """Users cannot access execution jobs created by another candidate."""
        # Submit job as candidate A
        req_payload = {'code': 'print("Candidate A job")', 'language': 'python'}
        job_res = self.client.post('/api/execution/jobs', json=req_payload, headers=self.auth_headers)
        self.assertEqual(job_res.status_code, 200)
        job_id = job_res.json()['job_id']

        # Register and log in as candidate B
        cand_b_email = "candidate_b_exec@testauth.com"
        self.client.post("/api/auth/register", json={
            "name": "Candidate B",
            "email": cand_b_email,
            "password": "Password12345!"
        })
        login_b = self.client.post("/api/auth/login", json={
            "email": cand_b_email,
            "password": "Password12345!"
        })
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Candidate B attempts to view Candidate A's job status and stdout
        cross_res = self.client.get(f"/api/execution/jobs/{job_id}", headers=headers_b)
        self.assertEqual(cross_res.status_code, 403)
        self.assertIn("Unauthorized access to another candidate's execution job", cross_res.json()["detail"])

    def test_normal_python_execution(self):
        req_payload = {
            'code': 'print("Result: Sandbox OK")',
            'language': 'python'
        }
        response = self.client.post('/api/execution/jobs', json=req_payload, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'PASSED')
        self.assertEqual(data['exit_code'], 0)
        self.assertIn('Result: Sandbox OK', data['stdout'])
        self.assertGreaterEqual(data['execution_time_ms'], 0)

    def test_challenge_test_cases_evaluation(self):
        # arena-py-code-01 is "Find the Second Largest Number in a List"
        valid_solution = '''def find_second_largest(numbers: list[int]) -> int | None:
    distinct = list(set(numbers))
    if len(distinct) < 2:
        return None
    distinct.sort(reverse=True)
    return distinct[1]
'''
        req_payload = {
            'code': valid_solution,
            'challenge_id': 'arena-py-code-01',
            'language': 'python'
        }
        response = self.client.post('/api/execution/jobs', json=req_payload, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'PASSED')
        self.assertGreater(data['total_tests'], 0)
        self.assertEqual(data['passed_tests'], data['total_tests'])

    def test_timeout_protection(self):
        code = 'import time\nwhile True:\n    time.sleep(0.1)\n'
        job = default_sandbox_manager.create_job(
            user_id='test-user',
            code=code,
            language='python'
        )
        job.limits.cpu_timeout_seconds = 0.5
        result = default_sandbox_manager.run_job(job=job)
        self.assertEqual(result.status, ExecutionStatus.TIME_LIMIT_EXCEEDED)
        self.assertIn('timed out', result.stderr.lower())

    def test_secret_scrubbing(self):
        os.environ['GEMINI_API_KEY'] = 'SUPER_SECRET_KEY_12345'
        os.environ['DATABASE_URL'] = 'postgres://user:secret@localhost:5432/db'
        code = '''import os
print("API_KEY:" + str(os.environ.get("GEMINI_API_KEY")))
print("DB_URL:" + str(os.environ.get("DATABASE_URL")))
'''
        job = default_sandbox_manager.create_job(
            user_id='test-user',
            code=code,
            language='python'
        )
        result = default_sandbox_manager.run_job(job=job)
        self.assertEqual(result.status, ExecutionStatus.PASSED)
        self.assertNotIn('SUPER_SECRET_KEY_12345', result.stdout)
        self.assertNotIn('postgres://user:secret', result.stdout)
        self.assertIn('API_KEY:None', result.stdout)
        self.assertIn('DB_URL:None', result.stdout)

    def test_get_job_by_id(self):
        req_payload = {'code': 'print(42)', 'language': 'python'}
        create_res = self.client.post('/api/execution/jobs', json=req_payload, headers=self.auth_headers)
        self.assertEqual(create_res.status_code, 200)
        job_id = create_res.json()['job_id']
        get_res = self.client.get(f'/api/execution/jobs/{job_id}', headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        self.assertEqual(data['job_id'], job_id)
        self.assertIn('42', data['stdout'])

    def test_docker_fail_closed_when_unavailable(self):
        """When preferred_mode='docker' is requested and Docker daemon is unavailable, host fallback is strictly blocked."""
        from unittest.mock import patch
        job = default_sandbox_manager.create_job(
            user_id='test-user',
            code='print("Should not run on host")',
            language='python'
        )
        with patch.object(default_sandbox_manager.docker_executor, 'is_available', return_value=False):
            result = default_sandbox_manager.run_job(job=job, preferred_mode='docker')
            self.assertEqual(result.status, ExecutionStatus.SANDBOX_ERROR)
            self.assertIn("Host execution is not permitted", result.error_message)
            self.assertEqual(result.executor_type, "docker")


if __name__ == '__main__':
    unittest.main()
