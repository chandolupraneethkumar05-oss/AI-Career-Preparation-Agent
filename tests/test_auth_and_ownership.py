"""
Unit and Integration Tests for Authentication, Password Hashing & Tenant Isolation
AI Career Preparation Agent
"""

import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal, init_db
from backend.app.db.models import User, Profile, RevokedToken
from backend.app.core.security import verify_password, get_secret_key, DEFAULT_DEV_SECRET


class TestAuthAndTenantIsolation(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        # Clean up any test users created
        test_users = self.db.query(User).filter(User.email.like("%@testauth.com")).all()
        for u in test_users:
            self.db.delete(u)
        self.db.commit()
        self.db.close()

    def test_01_registration_and_password_hashing(self):
        """Test candidate registration hashes password with bcrypt and returns token."""
        payload = {
            "name": "Jane Developer",
            "email": "jane@testauth.com",
            "password": "SecurePassword123!",
            "target_role": "Machine Learning Engineer"
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "jane@testauth.com")

        # Verify password is NOT stored in plaintext
        user_in_db = self.db.query(User).filter(User.email == "jane@testauth.com").first()
        self.assertIsNotNone(user_in_db)
        self.assertIsNotNone(user_in_db.hashed_password)
        self.assertNotEqual(user_in_db.hashed_password, "SecurePassword123!")
        self.assertTrue(verify_password("SecurePassword123!", user_in_db.hashed_password))

    def test_02_login_valid_and_invalid_credentials(self):
        """Test authentication succeeds with valid password and fails with invalid."""
        # Register user
        reg_payload = {
            "name": "Bob Coder",
            "email": "bob@testauth.com",
            "password": "CorrectPassword123!"
        }
        self.client.post("/api/auth/register", json=reg_payload)

        # Invalid password
        bad_login = {
            "email": "bob@testauth.com",
            "password": "WrongPassword999!"
        }
        res_bad = self.client.post("/api/auth/login", json=bad_login)
        self.assertEqual(res_bad.status_code, 401)

        # Valid password
        good_login = {
            "email": "bob@testauth.com",
            "password": "CorrectPassword123!"
        }
        res_good = self.client.post("/api/auth/login", json=good_login)
        self.assertEqual(res_good.status_code, 200)
        token_data = res_good.json()
        self.assertIn("access_token", token_data)

    def test_03_protected_me_endpoint_requires_token(self):
        """Test /api/auth/me rejects unauthenticated requests and accepts valid token."""
        # Unauthenticated
        res_no_auth = self.client.get("/api/auth/me")
        self.assertEqual(res_no_auth.status_code, 401)

        # Authenticate via demo login
        demo_res = self.client.post("/api/auth/demo-login")
        self.assertEqual(demo_res.status_code, 200)
        token = demo_res.json()["access_token"]

        # Authenticated /me
        res_auth = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res_auth.status_code, 200)
        self.assertEqual(res_auth.json()["id"], "user-001")

    def test_04_unauthenticated_profile_rejected_and_not_auto_provisioned(self):
        """Test requesting profile unauthenticated returns 401, never auto-provisioning."""
        res = self.client.get("/api/profile?user_id=usr_non_existent_ghost_999")
        self.assertEqual(res.status_code, 401)

        # Authenticated user attempting to access non-existent user returns 403 Forbidden
        demo_res = self.client.post("/api/auth/demo-login")
        token = demo_res.json()["access_token"]
        auth_res = self.client.get(
            "/api/profile?user_id=usr_non_existent_ghost_999",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(auth_res.status_code, 403)

    def test_05_cross_user_profile_access_forbidden(self):
        """Test user cannot access another user's profile with their own token."""
        # Register user A
        self.client.post("/api/auth/register", json={
            "name": "User Alpha",
            "email": "alpha@testauth.com",
            "password": "AlphaPassword123!"
        })
        login_a = self.client.post("/api/auth/login", json={
            "email": "alpha@testauth.com",
            "password": "AlphaPassword123!"
        }).json()
        token_a = login_a["access_token"]
        id_a = login_a["user"]["id"]

        # Register user B
        self.client.post("/api/auth/register", json={
            "name": "User Beta",
            "email": "beta@testauth.com",
            "password": "BetaPassword123!"
        })
        login_b = self.client.post("/api/auth/login", json={
            "email": "beta@testauth.com",
            "password": "BetaPassword123!"
        }).json()
        token_b = login_b["user"]["id"]
        id_b = login_b["user"]["id"]

        # User A attempts to view User B's profile
        cross_res = self.client.get(
            f"/api/profile?user_id={id_b}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        self.assertEqual(cross_res.status_code, 403)
        self.assertIn("Forbidden", cross_res.json()["detail"])

    def test_06_server_side_token_revocation_on_logout(self):
        """Test logout writes token to revocation blocklist and subsequent requests are rejected."""
        reg_payload = {
            "name": "Revoke User",
            "email": "revoke@testauth.com",
            "password": "RevokePassword123!"
        }
        reg_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(reg_res.status_code, 201)
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Verify token works before logout
        me_before = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_before.status_code, 200)

        # Logout with token
        logout_res = self.client.post("/api/auth/logout", headers=headers)
        self.assertEqual(logout_res.status_code, 200)
        self.assertIn("revoked", logout_res.json()["message"].lower())

        # Verify token is immediately rejected on subsequent requests
        me_after = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_after.status_code, 401)
        self.assertIn("revoked", me_after.json()["detail"].lower())

        profile_after = self.client.get("/api/profile", headers=headers)
        self.assertEqual(profile_after.status_code, 401)

    def test_07_unauthenticated_profile_put_rejected(self):
        """Test unauthenticated PUT /api/profile is rejected with 401."""
        res = self.client.put("/api/profile", json={"name": "Attacker"})
        self.assertEqual(res.status_code, 401)

    def test_08_production_secret_key_fail_closed(self):
        """Test production environment raises RuntimeError if SECRET_KEY is missing or default."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production", "SECRET_KEY": DEFAULT_DEV_SECRET}):
            with self.assertRaises(RuntimeError) as ctx:
                get_secret_key()
            self.assertIn("CRITICAL SECURITY", str(ctx.exception))

        with patch.dict(os.environ, {"ENVIRONMENT": "production", "SECRET_KEY": ""}):
            with self.assertRaises(RuntimeError) as ctx:
                get_secret_key()
            self.assertIn("CRITICAL SECURITY", str(ctx.exception))

        # A secure 32+ character key succeeds in production
        strong_key = "a" * 32
        with patch.dict(os.environ, {"ENVIRONMENT": "production", "SECRET_KEY": strong_key}):
            self.assertEqual(get_secret_key(), strong_key)

    def test_09_password_max_length_bcrypt_guard(self):
        """Test passwords exceeding 72 characters are rejected with 422 to respect bcrypt limit."""
        long_pwd = "A" * 75
        res = self.client.post("/api/auth/register", json={
            "name": "Long Password User",
            "email": "longpwd@testauth.com",
            "password": long_pwd
        })
        self.assertEqual(res.status_code, 422)

    def test_10_recording_endpoints_require_auth(self):
        """Test recording endpoints reject unauthenticated requests with 401."""
        sess_id = "sess_dummy_999"
        # GET recording
        res_get = self.client.get(f"/api/interviews/{sess_id}/recording")
        self.assertEqual(res_get.status_code, 401)

        # DELETE recording
        res_del = self.client.delete(f"/api/interviews/{sess_id}/recording")
        self.assertEqual(res_del.status_code, 401)

        # GET recording stream
        res_stream = self.client.get(f"/api/interviews/{sess_id}/recording/stream")
        self.assertEqual(res_stream.status_code, 401)

        # POST recording
        res_post = self.client.post(f"/api/interviews/{sess_id}/recording", data={"recording_mode": "video"})
        self.assertEqual(res_post.status_code, 401)

    def test_11_cross_user_recording_access_forbidden(self):
        """Test candidate cannot access or manipulate another candidate's recording."""
        # Register user A
        self.client.post("/api/auth/register", json={
            "name": "User Alpha Rec",
            "email": "alpha_rec@testauth.com",
            "password": "AlphaPassword123!"
        })
        login_a = self.client.post("/api/auth/login", json={
            "email": "alpha_rec@testauth.com",
            "password": "AlphaPassword123!"
        }).json()
        token_a = login_a["access_token"]

        # Target user B ID
        user_b_id = "usr_different_target_888"

        # User A attempts to access recording specifying user B's ID
        res = self.client.get(
            f"/api/interviews/sess_dummy/recording?user_id={user_b_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Forbidden", res.json()["detail"])

        # User A attempts to stream recording specifying user B's ID
        res_stream = self.client.get(
            f"/api/interviews/sess_dummy/recording/stream?user_id={user_b_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        self.assertEqual(res_stream.status_code, 403)
        self.assertIn("Forbidden", res_stream.json()["detail"])

    def test_12_short_lived_stream_ticket_lifecycle_and_scope_guard(self):
        """Test media stream tickets are short-lived, session-scoped, and rejected on general APIs."""
        from backend.app.core.security import create_stream_ticket, verify_stream_ticket

        # 1. Register candidate
        self.client.post("/api/auth/register", json={
            "name": "Ticket Candidate",
            "email": "ticket@testauth.com",
            "password": "TicketPassword123!"
        })
        login_res = self.client.post("/api/auth/login", json={
            "email": "ticket@testauth.com",
            "password": "TicketPassword123!"
        }).json()
        token = login_res["access_token"]
        user_id = login_res["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}

        sess_id = "sess_ticket_test_001"

        # 2. Generate valid stream ticket
        ticket = create_stream_ticket(user_id=user_id, session_id=sess_id, expires_in_seconds=120)
        self.assertIsNotNone(ticket)

        # 3. Verify valid ticket returns the authorized user_id
        resolved_uid = verify_stream_ticket(ticket, session_id=sess_id)
        self.assertEqual(resolved_uid, user_id)

        # 4. Verify ticket cannot be used for a DIFFERENT session ID
        mismatched_uid = verify_stream_ticket(ticket, session_id="sess_different_session_999")
        self.assertIsNone(mismatched_uid)

        # 5. Verify tampered ticket is rejected
        tampered = ticket[:-4] + "xxxx"
        self.assertIsNone(verify_stream_ticket(tampered, session_id=sess_id))

        # 6. Critical Security Guard: Verify stream ticket is REJECTED as a bearer token on general APIs
        profile_res = self.client.get("/api/profile", headers={"Authorization": f"Bearer {ticket}"})
        self.assertEqual(profile_res.status_code, 401)

        # 7. Verify stream endpoint rejects invalid ticket with 401
        stream_res = self.client.get(f"/api/interviews/{sess_id}/recording/stream?ticket=invalid_ticket_xyz")
        self.assertEqual(stream_res.status_code, 401)
        self.assertIn("Invalid or expired media playback ticket", stream_res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
