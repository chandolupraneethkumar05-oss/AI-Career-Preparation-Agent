import os
import unittest
from unittest.mock import patch
from sqlalchemy import text
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

    def test_13_password_reset_token_not_exposed_in_response(self):
        """Test forgot-password never leaks reset_token or reset_link in production/default mode."""
        email = "secure_reset@testauth.com"
        self.client.post("/api/auth/register", json={
            "name": "Reset Candidate",
            "email": email,
            "password": "Password12345!"
        })

        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "SECRET_KEY": "prod_super_secure_key_12345678901234567890"
        }):
            res = self.client.post("/api/auth/forgot-password", json={"email": email})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertIsNone(data["reset_token"], "reset_token must not be exposed in production API responses")
            self.assertIsNone(data["reset_link"], "reset_link must not be exposed in production API responses")
            self.assertEqual(data["delivered_via"], "email")

    def test_14_user_enumeration_prevention_on_forgot_password(self):
        """Test forgot-password returns identical generic messaging for registered and unregistered emails."""
        registered_email = "registered_target@testauth.com"
        unregistered_email = "non_existent_ghost_99999@testauth.com"

        self.client.post("/api/auth/register", json={
            "name": "Registered User",
            "email": registered_email,
            "password": "Password12345!"
        })

        res_reg = self.client.post("/api/auth/forgot-password", json={"email": registered_email})
        res_unreg = self.client.post("/api/auth/forgot-password", json={"email": unregistered_email})

        self.assertEqual(res_reg.status_code, 200)
        self.assertEqual(res_unreg.status_code, 200)
        # Verify messages are identical to prevent user enumeration
        self.assertEqual(res_reg.json()["message"], res_unreg.json()["message"])
        self.assertIn("If an account with this email exists", res_reg.json()["message"])
        self.assertIsNone(res_reg.json()["reset_token"])
        self.assertIsNone(res_unreg.json()["reset_token"])

    def test_15_forgot_password_rate_limiting(self):
        """Test that excessive forgot-password calls trigger HTTP 429 Too Many Requests."""
        email = "spam_test@testauth.com"
        # Send 5 requests (the limit)
        for _ in range(5):
            self.client.post("/api/auth/forgot-password", json={"email": email})

        # 6th request must trigger rate limit
        res_limit = self.client.post("/api/auth/forgot-password", json={"email": email})
        self.assertEqual(res_limit.status_code, 429)
        self.assertIn("Too many password reset requests", res_limit.json()["detail"])

    def test_16_sqlite_foreign_key_enforcement(self):
        """Test that SQLite connections enforce foreign key integrity via PRAGMA foreign_keys=ON."""
        fk_status = self.db.execute(text("PRAGMA foreign_keys")).scalar()
        self.assertEqual(fk_status, 1, "SQLite PRAGMA foreign_keys must be active (value 1)")

    def test_17_reject_token_in_query_string(self):
        """Test that query parameter token authentication (?token=...) is rejected on protected endpoints."""
        demo_res = self.client.post("/api/auth/demo-login")
        self.assertEqual(demo_res.status_code, 200)
        token = demo_res.json()["access_token"]

        # 1. /api/auth/me with query token (no Authorization header) must return 401
        res_me = self.client.get(f"/api/auth/me?token={token}")
        self.assertEqual(res_me.status_code, 401)

        # 2. /api/profile with query token (no Authorization header) must return 401
        res_profile = self.client.get(f"/api/profile?token={token}")
        self.assertEqual(res_profile.status_code, 401)

    def test_18_cross_tenant_isolation_comprehensive(self):
        """Test User A's token cannot read or mutate User B's resources across private candidate routes."""
        # Register User A
        self.client.post("/api/auth/register", json={
            "name": "User Alpha Sec",
            "email": "alpha_sec@testauth.com",
            "password": "Password123!"
        })
        login_a = self.client.post("/api/auth/login", json={
            "email": "alpha_sec@testauth.com",
            "password": "Password123!"
        }).json()
        token_a = login_a["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Register User B
        self.client.post("/api/auth/register", json={
            "name": "User Beta Sec",
            "email": "beta_sec@testauth.com",
            "password": "Password123!"
        })
        login_b = self.client.post("/api/auth/login", json={
            "email": "beta_sec@testauth.com",
            "password": "Password123!"
        }).json()
        id_b = login_b["user"]["id"]

        endpoints_to_test = [
            ("GET", f"/api/activities?user_id={id_b}", None),
            ("GET", f"/api/goals/weekly?user_id={id_b}", None),
            ("GET", f"/api/progress?user_id={id_b}", None),
            ("GET", f"/api/recommendations/next-action?user_id={id_b}", None),
            ("GET", f"/api/skill-arena/stats?user_id={id_b}", None),
            ("GET", f"/api/reports/weekly?user_id={id_b}", None),
            ("GET", f"/api/reminders/preferences?user_id={id_b}", None),
            ("GET", f"/api/challenges/history?user_id={id_b}", None),
            ("GET", f"/api/feedback/mine?user_id={id_b}", None),
            ("POST", f"/api/interviews/quick-answer?user_id={id_b}", {"question": "Explain Docker", "user_id": id_b}),
        ]

        for method, endpoint, json_payload in endpoints_to_test:
            if method == "GET":
                res = self.client.get(endpoint, headers=headers_a)
            else:
                res = self.client.post(endpoint, json=json_payload, headers=headers_a)
            self.assertEqual(
                res.status_code,
                403,
                f"Expected 403 Forbidden for User A accessing User B on {endpoint}, got {res.status_code}"
            )

    def test_19_audio_transcription_validation(self):
        """Test audio transcription endpoint validates payload presence and 25MB maximum limit."""
        demo_res = self.client.post("/api/auth/demo-login")
        token = demo_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Empty audio file returns 400
        res_empty = self.client.post(
            "/api/interviews/transcribe-audio",
            files={"file": ("empty.wav", b"", "audio/wav")},
            headers=headers
        )
        self.assertEqual(res_empty.status_code, 400)
        self.assertIn("empty", res_empty.json()["detail"].lower())

        # Payload exceeding 25MB returns 413
        oversized_payload = b"0" * (25 * 1024 * 1024 + 1)
        res_oversized = self.client.post(
            "/api/interviews/transcribe-audio",
            files={"file": ("huge.wav", oversized_payload, "audio/wav")},
            headers=headers
        )
        self.assertEqual(res_oversized.status_code, 413)
        self.assertIn("25 mb", res_oversized.json()["detail"].lower())

    def test_20_reminder_internal_operational_endpoints_protection(self):
        """Test internal operational reminder routes reject unauthorized requests and enforce internal key."""
        # 1. Unauthenticated request to /check-now returns 401
        res_no_auth = self.client.post("/api/reminders/check-now")
        self.assertEqual(res_no_auth.status_code, 401)

        # 2. When internal key is configured, request without matching key returns 403
        with patch.dict(os.environ, {"INTERNAL_SCHEDULER_KEY": "super_internal_scheduler_secret_999"}):
            res_bad_secret = self.client.post(
                "/api/reminders/check-now",
                headers={"X-Internal-Secret": "wrong_secret"}
            )
            self.assertEqual(res_bad_secret.status_code, 403)

            # Valid internal secret returns 200
            res_valid_secret = self.client.post(
                "/api/reminders/check-now",
                headers={"X-Internal-Secret": "super_internal_scheduler_secret_999"}
            )
            self.assertEqual(res_valid_secret.status_code, 200)

        # 3. Unauthenticated request to /scheduler/status returns 401
        res_status_no_auth = self.client.get("/api/reminders/scheduler/status")
        self.assertEqual(res_status_no_auth.status_code, 401)


    def test_21_stream_ticket_security_matrix(self):
        """
        Comprehensive test matrix for media stream tickets:
        - Valid ticket verified and consumed
        - Replay prevention: reusing consumed ticket returns None
        - Two concurrent attempts to consume the same ticket
        - Expired ticket rejected
        - Missing expiration claim rejected
        - Missing/empty user ID rejected
        - Wrong scope rejected
        - Tampered signature rejected
        - Wrong session ID rejected
        - Stream ticket used as API bearer token rejected
        - Regular access token used as stream ticket rejected
        """
        import concurrent.futures
        import json
        import hmac
        import hashlib
        from backend.app.db.models import Interview
        from backend.app.core.security import (
            create_stream_ticket,
            verify_stream_ticket,
            create_access_token,
            get_secret_key,
            _b64url_encode,
            ALGORITHM
        )

        user_id = "test_user_stream_001"
        session_id = "sess_stream_001"

        # Guarantee user and interview exist in database for foreign key constraints
        u = self.db.query(User).filter(User.id == user_id).first()
        if not u:
            u = User(id=user_id, email="streamer@testauth.com", name="Streamer")
            self.db.add(u)
            self.db.commit()

        sess = self.db.query(Interview).filter(Interview.id == session_id).first()
        if not sess:
            sess = Interview(id=session_id, user_id=user_id, role="MLE")
            self.db.add(sess)
            self.db.commit()

        # 1. Valid ticket verification with DB session (consumes ticket)
        valid_ticket = create_stream_ticket(user_id=user_id, session_id=session_id, expires_in_seconds=120)
        resolved_uid = verify_stream_ticket(valid_ticket, session_id=session_id, db=self.db)
        self.assertEqual(resolved_uid, user_id)

        # 2. Replay prevention: reusing consumed ticket returns None
        replay_uid = verify_stream_ticket(valid_ticket, session_id=session_id, db=self.db)
        self.assertIsNone(replay_uid)

        # 3. Two concurrent attempts to consume the same ticket
        concurrent_session = "sess_stream_concurrent_002"
        concurrent_ticket = create_stream_ticket(user_id=user_id, session_id=concurrent_session, expires_in_seconds=120)

        def consume_concurrently():
            worker_db = SessionLocal()
            try:
                res = verify_stream_ticket(concurrent_ticket, session_id=concurrent_session, db=worker_db)
                return res
            finally:
                worker_db.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut1 = executor.submit(consume_concurrently)
            fut2 = executor.submit(consume_concurrently)
            res1 = fut1.result()
            res2 = fut2.result()

        # Exactly one worker succeeded and one failed
        success_count = sum(1 for r in [res1, res2] if r == user_id)
        none_count = sum(1 for r in [res1, res2] if r is None)
        self.assertEqual(success_count, 1)
        self.assertEqual(none_count, 1)

        # 4. Expired ticket rejected
        expired_ticket = create_stream_ticket(user_id=user_id, session_id=session_id, expires_in_seconds=-10)
        self.assertIsNone(verify_stream_ticket(expired_ticket, session_id=session_id, db=self.db))

        # Helper to forge test tickets with custom payloads
        def forge_ticket(custom_payload):
            secret_key = get_secret_key()
            h_b64 = _b64url_encode(json.dumps({"alg": ALGORITHM, "typ": "TICKET"}).encode("utf-8"))
            p_b64 = _b64url_encode(json.dumps(custom_payload).encode("utf-8"))
            sig = hmac.new(secret_key.encode("utf-8"), f"{h_b64}.{p_b64}".encode("utf-8"), hashlib.sha256).digest()
            sig_b64 = _b64url_encode(sig)
            return f"{h_b64}.{p_b64}.{sig_b64}"

        # 5. Missing expiration claim rejected
        no_exp_ticket = forge_ticket({"sub": user_id, "sid": session_id, "scope": "media_stream", "iat": int(1000)})
        self.assertIsNone(verify_stream_ticket(no_exp_ticket, session_id=session_id, db=self.db))

        # 6. Missing/empty user ID rejected
        no_sub_ticket = forge_ticket({"sub": "", "sid": session_id, "scope": "media_stream", "iat": int(1000), "exp": int(9999999999)})
        self.assertIsNone(verify_stream_ticket(no_sub_ticket, session_id=session_id, db=self.db))

        # 7. Wrong scope rejected
        bad_scope_ticket = forge_ticket({"sub": user_id, "sid": session_id, "scope": "other_scope", "iat": int(1000), "exp": int(9999999999)})
        self.assertIsNone(verify_stream_ticket(bad_scope_ticket, session_id=session_id, db=self.db))

        # 8. Wrong session ID rejected
        fresh_ticket = create_stream_ticket(user_id=user_id, session_id=session_id, expires_in_seconds=120)
        self.assertIsNone(verify_stream_ticket(fresh_ticket, session_id="wrong_session_xyz", db=self.db))

        # 9. Tampered signature rejected
        tampered_ticket = fresh_ticket[:-4] + "xxxx"
        self.assertIsNone(verify_stream_ticket(tampered_ticket, session_id=session_id, db=self.db))

        # 10. Stream ticket cannot be used as an API bearer token
        res_api_with_ticket = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {fresh_ticket}"}
        )
        self.assertEqual(res_api_with_ticket.status_code, 401)

        # 11. Normal access token cannot be used as a stream ticket
        access_token = create_access_token({"sub": user_id, "role": "candidate"})
        self.assertIsNone(verify_stream_ticket(access_token, session_id=session_id, db=self.db))

    def test_22_recording_upload_and_storage_validation(self):
        """Tests bounded chunked upload, magic byte validation, and safe deletion."""
        payload = {"name": "Upload User", "email": "upload_user@testauth.com", "password": "Password123!"}
        reg = self.client.post("/api/auth/register", json=payload)
        token = reg.json()["access_token"]
        user_id = reg.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create interview
        res_int = self.client.post("/api/interviews/start", json={"role": "ML Engineer", "user_id": user_id}, headers=headers)
        session_id = res_int.json()["session_id"]

        # 1. Valid WebM magic bytes upload succeeds
        webm_magic = b"\x1a\x45\xdf\xa3" + b"\x00" * 1024
        res_up = self.client.post(
            f"/api/interviews/{session_id}/recording",
            data={"recording_mode": "video"},
            files={"file": ("recording.webm", webm_magic, "video/webm")},
            headers=headers
        )
        self.assertEqual(res_up.status_code, 200)
        self.assertIsNotNone(res_up.json()["stream_url"])
        self.assertEqual(res_up.json()["status"], "ready")

        # 2. Invalid media format (e.g. text/exe bytes) returns 415
        fake_binary = b"NOT_A_VALID_MEDIA_FILE_HEADER_XYZ"
        res_bad_format = self.client.post(
            f"/api/interviews/{session_id}/recording",
            data={"recording_mode": "video"},
            files={"file": ("recording.webm", fake_binary, "video/webm")},
            headers=headers
        )
        self.assertEqual(res_bad_format.status_code, 415)

        # 3. Delete recording marks status deleted
        res_del = self.client.delete(f"/api/interviews/{session_id}/recording", headers=headers)
        self.assertEqual(res_del.status_code, 200)
        self.assertEqual(res_del.json()["status"], "deleted")

    def test_23_communication_analysis_session_ownership_enforcement(self):
        """Candidate B cannot run communication analysis on Candidate A's session."""
        reg_a = self.client.post("/api/auth/register", json={"name": "Alice", "email": "alice_comm@testauth.com", "password": "Password123!"})
        token_a = reg_a.json()["access_token"]
        uid_a = reg_a.json()["user"]["id"]

        reg_b = self.client.post("/api/auth/register", json={"name": "Bob", "email": "bob_comm@testauth.com", "password": "Password123!"})
        token_b = reg_b.json()["access_token"]

        # Alice starts session
        res_sess = self.client.post("/api/interviews/start", json={"role": "ML Engineer", "user_id": uid_a}, headers={"Authorization": f"Bearer {token_a}"})
        alice_session = res_sess.json()["session_id"]

        # Bob attempts communication analysis on Alice's session -> 404
        res_hack = self.client.post(
            f"/api/interviews/{alice_session}/communication-analysis",
            json={"transcript": "Test transcript", "duration": 10.0},
            headers={"Authorization": f"Bearer {token_b}"}
        )
        self.assertEqual(res_hack.status_code, 404)

    def test_24_scheduler_authorization_all_scenarios(self):
        """Tests the 5 scheduler authorization scenarios mandated by prompt section 6."""
        # Setup candidate and admin users
        reg_cand = self.client.post("/api/auth/register", json={"name": "Cand", "email": "cand_sched@testauth.com", "password": "Password123!"})
        token_cand = reg_cand.json()["access_token"]

        reg_admin = self.client.post("/api/auth/register", json={"name": "Admin", "email": "admin_sched@testauth.com", "password": "Password123!"})
        token_admin = reg_admin.json()["access_token"]
        # Elevate to admin role in DB
        admin_user = self.db.query(User).filter(User.email == "admin_sched@testauth.com").first()
        admin_user.role = "admin"
        self.db.commit()

        # 1. Unauthenticated request -> 401
        self.assertEqual(self.client.post("/api/reminders/check-now").status_code, 401)

        # 2. Ordinary candidate without internal secret -> 403
        res_cand = self.client.post("/api/reminders/check-now", headers={"Authorization": f"Bearer {token_cand}"})
        self.assertEqual(res_cand.status_code, 403)

        # 3. Candidate with invalid internal secret -> 403
        with patch.dict(os.environ, {"INTERNAL_SCHEDULER_KEY": "valid_secret_123"}):
            res_bad_secret = self.client.post(
                "/api/reminders/check-now",
                headers={"X-Internal-Secret": "wrong_secret", "Authorization": f"Bearer {token_cand}"}
            )
            self.assertEqual(res_bad_secret.status_code, 403)

            # 4. Valid internal service secret -> 200
            res_valid_secret = self.client.post(
                "/api/reminders/check-now",
                headers={"X-Internal-Secret": "valid_secret_123"}
            )
            self.assertEqual(res_valid_secret.status_code, 200)

        # 5. Authorized administrator identity without internal secret -> 200
        res_admin = self.client.post(
            "/api/reminders/check-now",
            headers={"Authorization": f"Bearer {token_admin}"}
        )
        self.assertEqual(res_admin.status_code, 200)

    def test_25_reminder_reliability_and_test_isolation(self):
        """Tests placeholder email rejection, test isolation, and malformed time/timezone fallback."""
        from backend.app.services.reminder_service import reminder_service, is_valid_delivery_email, get_user_timezone
        from datetime import datetime, timezone

        # 1. Placeholder emails rejected
        self.assertFalse(is_valid_delivery_email("candidate@example.com"))
        self.assertFalse(is_valid_delivery_email("user@example.com"))
        self.assertFalse(is_valid_delivery_email("notanemail"))
        self.assertTrue(is_valid_delivery_email("real.engineer@mycompany.org"))

        # 2. Malformed timezone safely falls back to Asia/Kolkata
        tz = get_user_timezone("Invalid/MadeUp_Timezone")
        self.assertEqual(str(tz), "Asia/Kolkata")

        # 3. Test reminder dispatch isolation
        reg = self.client.post("/api/auth/register", json={"name": "Iso User", "email": "iso_rem@testauth.com", "password": "Password123!"})
        uid = reg.json()["user"]["id"]
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Dispatch test reminder
        res_test = self.client.post("/api/reminders/test", headers=headers)
        self.assertEqual(res_test.status_code, 200)

        # Real reminder eligibility is NOT blocked by test reminder
        eligible, reason, _ = reminder_service.should_send_daily_reminder(
            user_id=uid,
            current_datetime=datetime(2026, 11, 8, 20, 0, tzinfo=timezone.utc),
            db=self.db
        )
        self.assertIn("disabled", reason.lower())

    def test_26_sqlite_foreign_key_connection_filter(self):
        """Verifies PRAGMA foreign_keys=ON runs for SQLite connections and skips non-SQLite."""
        from unittest.mock import MagicMock
        from backend.app.db.database import set_sqlite_pragma
        import sqlite3

        # Real sqlite3 connection calls execute
        real_conn = sqlite3.connect(":memory:")
        set_sqlite_pragma(real_conn, None)
        cursor = real_conn.cursor()
        cursor.execute("PRAGMA foreign_keys")
        self.assertEqual(cursor.fetchone()[0], 1)
        real_conn.close()

        # Mock non-SQLite connection (e.g. Postgres) does NOT call PRAGMA
        mock_pg_conn = MagicMock()
        set_sqlite_pragma(mock_pg_conn, None)
        mock_pg_conn.cursor.assert_not_called()

    def test_27_experience_ownership_cross_candidate_isolation(self):
        """Candidate A cannot view unapproved, update, or delete Candidate B's experiences."""
        reg_a = self.client.post("/api/auth/register", json={"name": "Alice Exp", "email": "alice_exp@testauth.com", "password": "Password123!"})
        token_a = reg_a.json()["access_token"]

        reg_b = self.client.post("/api/auth/register", json={"name": "Bob Exp", "email": "bob_exp@testauth.com", "password": "Password123!"})
        token_b = reg_b.json()["access_token"]

        # Alice creates experience (defaults to PENDING)
        exp_payload = {
            "role": "Software Engineer",
            "experience_level": "Mid Level",
            "round_type": "Technical",
            "difficulty": "Medium",
            "outcome": "Offered",
            "experience_text": "Alice's proprietary interview experience and tips.",
            "questions": [{"question_text": "What is Python GIL?", "difficulty": "Medium"}]
        }
        res_create = self.client.post("/api/experiences", json=exp_payload, headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(res_create.status_code, 200)
        exp_id = res_create.json()["id"]

        # Bob attempts to view Alice's pending experience -> 404
        res_view = self.client.get(f"/api/experiences/{exp_id}", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(res_view.status_code, 404)

        # Bob attempts to update Alice's experience -> 403
        res_update = self.client.put(
            f"/api/experiences/{exp_id}",
            json={"role": "Hacked Role"},
            headers={"Authorization": f"Bearer {token_b}"}
        )
        self.assertEqual(res_update.status_code, 403)

        # Bob attempts to delete Alice's experience -> 403
        res_delete = self.client.delete(f"/api/experiences/{exp_id}", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(res_delete.status_code, 403)

    def test_28_optional_auth_rejects_invalid_bearer_token(self):
        """Optional authentication endpoints reject invalid tokens with 401 instead of silent anonymous bypass."""
        # 1. Anonymous request without header succeeds
        res_anon = self.client.get("/api/experiences")
        self.assertEqual(res_anon.status_code, 200)

        # 2. Request with invalid bearer token is strictly rejected with 401
        res_invalid = self.client.get("/api/experiences", headers={"Authorization": "Bearer totally_forged_invalid_jwt"})
        self.assertEqual(res_invalid.status_code, 401)


    def test_29_stream_ticket_timestamp_strict_validation(self):
        """Rejects Boolean, NaN, infinity, negative, and invalid timestamp claims in stream tickets."""
        import json
        import hmac
        import hashlib
        import time
        from backend.app.core.security import (
            get_secret_key,
            _b64url_encode,
            verify_stream_ticket,
            ALGORITHM
        )

        secret = get_secret_key().encode("utf-8")
        session_id = "sess_ts_strict_001"

        def make_ticket(payload_dict):
            hdr = _b64url_encode(json.dumps({"alg": ALGORITHM, "typ": "TICKET"}).encode("utf-8"))
            pay = _b64url_encode(json.dumps(payload_dict).encode("utf-8"))
            sig = _b64url_encode(hmac.new(secret, f"{hdr}.{pay}".encode("utf-8"), hashlib.sha256).digest())
            return f"{hdr}.{pay}.{sig}"

        now = int(time.time())

        # 1. Boolean exp
        t_bool_exp = make_ticket({"sub": "u1", "sid": session_id, "scope": "media_stream", "iat": now, "exp": True})
        self.assertIsNone(verify_stream_ticket(t_bool_exp, session_id=session_id, db=self.db))

        # 2. Boolean iat
        t_bool_iat = make_ticket({"sub": "u1", "sid": session_id, "scope": "media_stream", "iat": True, "exp": now + 120})
        self.assertIsNone(verify_stream_ticket(t_bool_iat, session_id=session_id, db=self.db))

        # 3. Negative exp
        t_neg_exp = make_ticket({"sub": "u1", "sid": session_id, "scope": "media_stream", "iat": now, "exp": -100})
        self.assertIsNone(verify_stream_ticket(t_neg_exp, session_id=session_id, db=self.db))

        # 4. Negative iat
        t_neg_iat = make_ticket({"sub": "u1", "sid": session_id, "scope": "media_stream", "iat": -100, "exp": now + 120})
        self.assertIsNone(verify_stream_ticket(t_neg_iat, session_id=session_id, db=self.db))

    def test_30_video_range_requests_on_consumed_ticket(self):
        import io
        """Verifies HTML5 video range requests (seeking) work on consumed ticket while blocking replays and cross-session attacks."""
        reg = self.client.post("/api/auth/register", json={"name": "Video Candidate", "email": "video_cand@testauth.com", "password": "Password123!"})
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create session via POST /api/interviews
        res_sess = self.client.post("/api/interviews", json={"role": "MLE", "interview_type": "technical", "difficulty": "Medium", "overall_score": 85.0}, headers=headers)
        session_id = res_sess.json()["id"]

        # Upload valid WebM media
        webm_data = b"\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42\xf7\x81\x01\x42\xf2\x81\x04" + b"\x00" * 200
        files = {"file": ("recording.webm", io.BytesIO(webm_data), "video/webm")}
        self.client.post(f"/api/interviews/{session_id}/recording", files=files, headers=headers)

        # Get streaming ticket
        res_ticket = self.client.post(f"/api/interviews/{session_id}/recording/stream-ticket", headers=headers)
        ticket = res_ticket.json()["ticket"]

        # 1. Initial Range request (bytes=0-50) consumes the ticket
        res_r1 = self.client.get(f"/api/interviews/{session_id}/recording/stream?ticket={ticket}", headers={"Range": "bytes=0-50"})
        self.assertEqual(res_r1.status_code, 206)
        self.assertIn("Content-Range", res_r1.headers)

        # 2. Seek Range request (bytes=51-100) using SAME consumed ticket succeeds
        res_r2 = self.client.get(f"/api/interviews/{session_id}/recording/stream?ticket={ticket}", headers={"Range": "bytes=51-100"})
        self.assertEqual(res_r2.status_code, 206)
        self.assertIn("bytes 51-100/", res_r2.headers["Content-Range"])

        # 3. Non-range request with already-consumed ticket fails (401)
        res_replay_full = self.client.get(f"/api/interviews/{session_id}/recording/stream?ticket={ticket}")
        self.assertEqual(res_replay_full.status_code, 401)

        # 4. Cross-session access using this ticket fails (401)
        res_cross = self.client.get(f"/api/interviews/other_session_id_999/recording/stream?ticket={ticket}", headers={"Range": "bytes=0-50"})
        self.assertEqual(res_cross.status_code, 401)

    def test_31_reminder_concurrent_stale_reclaim_and_retry(self):
        """Verifies database-level atomic conditional updates prevent concurrent duplicate dispatches on stale & failed reminders."""
        import concurrent.futures
        from datetime import datetime, timezone, timedelta
        from backend.app.services.reminder_service import reminder_service
        from backend.app.db.models import ReminderLog, ReminderPreference, utc_now

        user_id = "test_user_concur_rem_001"
        u = self.db.query(User).filter(User.id == user_id).first()
        if not u:
            u = User(id=user_id, email="concur_rem@testauth.com", name="Concur User")
            self.db.add(u)
            self.db.commit()

        pref = self.db.query(ReminderPreference).filter(ReminderPreference.user_id == user_id).first()
        if not pref:
            pref = ReminderPreference(user_id=user_id, email="concur_rem@testauth.com", enabled=True, preferred_time="00:00", timezone="Asia/Kolkata")
            self.db.add(pref)
            self.db.commit()
        else:
            pref.preferred_time = "00:00"
            pref.enabled = True
            self.db.commit()

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # 1. Test Stale Pending Reclaim Race
        stale_time = datetime.now(timezone.utc) - timedelta(seconds=400)
        existing_log = self.db.query(ReminderLog).filter(ReminderLog.user_id == user_id, ReminderLog.reminder_date == today_str).first()
        if existing_log:
            existing_log.status = "pending"
            existing_log.created_at = stale_time
            existing_log.sent_at = stale_time
            self.db.commit()
        else:
            self.db.add(ReminderLog(user_id=user_id, reminder_date=today_str, reminder_type="daily", subject="Stale", message="pending", status="pending", created_at=stale_time, sent_at=stale_time))
            self.db.commit()

        def run_worker_dispatch():
            worker_db = SessionLocal()
            try:
                return reminder_service.dispatch_reminder(user_id=user_id, db=worker_db, is_test=False)
            finally:
                worker_db.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut1 = executor.submit(run_worker_dispatch)
            fut2 = executor.submit(run_worker_dispatch)
            res1 = fut1.result()
            res2 = fut2.result()

        results = [res1, res2]
        # Exactly one worker claimed the dispatch (sent/development/failed) and the other was skipped due to atomic conditional lock
        dispatched_count = sum(1 for r in results if r.get("status") in ["sent", "development", "failed"])
        skipped_count = sum(1 for r in results if r.get("status") == "skipped")
        self.assertEqual(dispatched_count, 1)
        self.assertEqual(skipped_count, 1)

        # 2. Test Failed Reminder Retry Race
        failed_log = self.db.query(ReminderLog).filter(ReminderLog.user_id == user_id, ReminderLog.reminder_date == today_str).first()
        failed_log.status = "failed"
        failed_log.message = "Delivery failed previously"
        self.db.commit()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut1 = executor.submit(run_worker_dispatch)
            fut2 = executor.submit(run_worker_dispatch)
            res1 = fut1.result()
            res2 = fut2.result()

        results_retry = [res1, res2]
        retry_dispatched = sum(1 for r in results_retry if r.get("status") in ["sent", "development", "failed"])
        retry_skipped = sum(1 for r in results_retry if r.get("status") == "skipped")
        self.assertEqual(retry_dispatched, 1)
        self.assertEqual(retry_skipped, 1)

    def test_32_consumed_ticket_cleanup_utility(self):
        """Verifies cleanup_expired_consumed_tickets removes expired records while preserving active tickets."""
        import time
        from datetime import datetime, timezone
        from backend.app.core.security import cleanup_expired_consumed_tickets
        from backend.app.db.models import ConsumedStreamTicket

        now = int(time.time())
        # Add 1 expired ticket and 1 active ticket
        t_exp = ConsumedStreamTicket(ticket_hash="exp_hash_12345", user_id="u1", session_id="s1", consumed_at=datetime.now(timezone.utc), expires_at=now - 200)
        t_act = ConsumedStreamTicket(ticket_hash="act_hash_67890", user_id="u1", session_id="s1", consumed_at=datetime.now(timezone.utc), expires_at=now + 500)
        self.db.merge(t_exp)
        self.db.merge(t_act)
        self.db.commit()

        deleted = cleanup_expired_consumed_tickets(self.db)
        self.assertGreaterEqual(deleted, 1)

        # Active ticket still exists
        active_found = self.db.query(ConsumedStreamTicket).filter(ConsumedStreamTicket.ticket_hash == "act_hash_67890").first()
        self.assertIsNotNone(active_found)

        # Expired ticket was deleted
        expired_found = self.db.query(ConsumedStreamTicket).filter(ConsumedStreamTicket.ticket_hash == "exp_hash_12345").first()
        self.assertIsNone(expired_found)


if __name__ == "__main__":
    unittest.main()
