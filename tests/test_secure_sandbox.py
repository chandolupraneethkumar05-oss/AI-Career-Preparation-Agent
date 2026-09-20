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

    def test_capabilities_endpoint(self):
        response = self.client.get('/api/execution/capabilities')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('docker', data)
        self.assertIn('firecracker', data)
        self.assertIn('process', data)
        self.assertTrue(data['process']['available'])
        self.assertEqual(data['default_executor'], 'process')

    def test_normal_python_execution(self):
        req_payload = {
            'code': 'print("Result: Sandbox OK")',
            'language': 'python'
        }
        response = self.client.post('/api/execution/jobs', json=req_payload)
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
        response = self.client.post('/api/execution/jobs', json=req_payload)
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
        create_res = self.client.post('/api/execution/jobs', json=req_payload)
        self.assertEqual(create_res.status_code, 200)
        job_id = create_res.json()['job_id']
        get_res = self.client.get(f'/api/execution/jobs/{job_id}')
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        self.assertEqual(data['job_id'], job_id)
        self.assertIn('42', data['stdout'])

if __name__ == '__main__':
    unittest.main()
