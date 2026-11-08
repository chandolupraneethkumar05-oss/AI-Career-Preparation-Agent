"""
Tests for Phase 3: Resume Builder System
Covers:
- Template metadata catalog
- Draft CRUD operations
- Multi-tenant data isolation & ownership access controls (HTTP 403)
- Plain text compilation with Zero-Fabrication Rule
- Validation for templates and accent colors
"""

import unittest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.database import SessionLocal, init_db
from backend.app.db.models import User, ResumeDraft


class TestResumeBuilder(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Clean any prior test users
        self._cleanup()

        # Create Candidate A
        reg_a = self.client.post("/api/auth/register", json={
            "name": "Candidate Alpha",
            "email": "alpha@testresumebuilder.com",
            "password": "Password123!",
            "target_role": "Backend Engineer"
        })
        self.token_a = reg_a.json()["access_token"]
        self.headers_a = {"Authorization": f"Bearer {self.token_a}"}

        # Create Candidate B
        reg_b = self.client.post("/api/auth/register", json={
            "name": "Candidate Beta",
            "email": "beta@testresumebuilder.com",
            "password": "Password123!",
            "target_role": "Frontend Engineer"
        })
        self.token_b = reg_b.json()["access_token"]
        self.headers_b = {"Authorization": f"Bearer {self.token_b}"}

    def tearDown(self):
        self._cleanup()
        self.db.close()

    def _cleanup(self):
        test_users = self.db.query(User).filter(User.email.like("%@testresumebuilder.com")).all()
        for u in test_users:
            self.db.query(ResumeDraft).filter(ResumeDraft.user_id == u.id).delete()
            self.db.delete(u)
        self.db.commit()

    def test_01_template_catalog(self):
        """Verify template catalog returns the 3 distinct templates without requiring auth."""
        res = self.client.get("/api/resume-builder/templates")
        self.assertEqual(res.status_code, 200)
        templates = res.json()
        self.assertIsInstance(templates, list)
        self.assertEqual(len(templates), 3)

        ids = [t["id"] for t in templates]
        self.assertIn("classic_academic", ids)
        self.assertIn("modern_professional", ids)
        self.assertIn("executive_minimal", ids)

    def test_02_draft_crud_lifecycle(self):
        """Verify full lifecycle: create, list, retrieve, update, delete draft."""
        payload = {
            "title": "Alpha ML Resume",
            "target_role": "Machine Learning Engineer",
            "template_id": "modern_professional",
            "accent_color": "#245A45",
            "content": {
                "personal_info": {
                    "full_name": "Alpha Candidate",
                    "email": "alpha@example.com",
                    "phone": "+1 555-0100",
                    "target_role": "Machine Learning Engineer"
                },
                "professional_summary": "Experienced ML researcher focused on LLM reasoning and transformer architectures.",
                "education": [
                    {
                        "institution": "Stanford University",
                        "degree": "M.S.",
                        "field_of_study": "Computer Science",
                        "start_date": "2022",
                        "end_date": "2024"
                    }
                ],
                "skills": [
                    {
                        "category": "Machine Learning",
                        "skills": ["PyTorch", "Hugging Face", "CUDA", "vLLM"]
                    }
                ],
                "projects": [
                    {
                        "title": "Low-Latency Speculative Decoding",
                        "role": "Lead Researcher",
                        "tech_stack": ["Python", "PyTorch", "C++"],
                        "bullet_points": ["Improved generation speed by 2.4x on Llama 3 models."]
                    }
                ],
                "work_experience": [],
                "internships": [],
                "certifications": [],
                "achievements": [],
                "custom_sections": []
            }
        }

        # Create
        res_create = self.client.post("/api/resume-builder/drafts", json=payload, headers=self.headers_a)
        self.assertEqual(res_create.status_code, 201)
        created = res_create.json()
        draft_id = created["id"]
        self.assertEqual(created["title"], "Alpha ML Resume")
        self.assertEqual(created["template_id"], "modern_professional")
        self.assertEqual(created["accent_color"], "#245A45")

        # List
        res_list = self.client.get("/api/resume-builder/drafts", headers=self.headers_a)
        self.assertEqual(res_list.status_code, 200)
        drafts = res_list.json()
        self.assertTrue(any(d["id"] == draft_id for d in drafts))

        # Retrieve
        res_get = self.client.get(f"/api/resume-builder/drafts/{draft_id}", headers=self.headers_a)
        self.assertEqual(res_get.status_code, 200)
        retrieved = res_get.json()
        self.assertEqual(retrieved["content"]["personal_info"]["full_name"], "Alpha Candidate")
        self.assertEqual(len(retrieved["content"]["skills"][0]["skills"]), 4)

        # Update
        update_payload = {
            "title": "Alpha ML Resume - Updated",
            "accent_color": "#1E293B",
            "content": {
                **retrieved["content"],
                "professional_summary": "Updated summary with state-of-the-art benchmark results."
            }
        }
        res_update = self.client.put(f"/api/resume-builder/drafts/{draft_id}", json=update_payload, headers=self.headers_a)
        self.assertEqual(res_update.status_code, 200)
        updated = res_update.json()
        self.assertEqual(updated["title"], "Alpha ML Resume - Updated")
        self.assertEqual(updated["accent_color"], "#1E293B")
        self.assertIn("benchmark results", updated["content"]["professional_summary"])

        # Delete
        res_del = self.client.delete(f"/api/resume-builder/drafts/{draft_id}", headers=self.headers_a)
        self.assertEqual(res_del.status_code, 204)

        # Confirm deleted
        res_after = self.client.get(f"/api/resume-builder/drafts/{draft_id}", headers=self.headers_a)
        self.assertEqual(res_after.status_code, 404)

    def test_03_tenant_isolation_ownership_enforcement(self):
        """Verify candidate A cannot access, modify, or delete candidate B's resume draft."""
        # Candidate A creates draft
        res_a = self.client.post("/api/resume-builder/drafts", json={
            "title": "Candidate A Confidential Resume",
            "target_role": "Security Architect",
            "template_id": "executive_minimal",
            "accent_color": "#334155",
            "content": {
                "personal_info": {"full_name": "Candidate Alpha"}
            }
        }, headers=self.headers_a)
        self.assertEqual(res_a.status_code, 201)
        draft_id = res_a.json()["id"]

        # Candidate B tries to GET draft A -> 403 Forbidden
        res_b_get = self.client.get(f"/api/resume-builder/drafts/{draft_id}", headers=self.headers_b)
        self.assertEqual(res_b_get.status_code, 403)
        self.assertIn("permission", res_b_get.json()["detail"].lower())

        # Candidate B tries to PUT draft A -> 403 Forbidden
        res_b_put = self.client.put(f"/api/resume-builder/drafts/{draft_id}", json={
            "title": "Tampered Title"
        }, headers=self.headers_b)
        self.assertEqual(res_b_put.status_code, 403)

        # Candidate B tries to DELETE draft A -> 403 Forbidden
        res_b_del = self.client.delete(f"/api/resume-builder/drafts/{draft_id}", headers=self.headers_b)
        self.assertEqual(res_b_del.status_code, 403)

        # Candidate B lists drafts -> Draft A is NOT present
        res_b_list = self.client.get("/api/resume-builder/drafts", headers=self.headers_b)
        self.assertEqual(res_b_list.status_code, 200)
        self.assertFalse(any(d["id"] == draft_id for d in res_b_list.json()))

    def test_04_zero_fabrication_text_compilation(self):
        """Verify Zero-Fabrication Rule: empty fields and unprovided sections are never hallucinated."""
        # Resume with only name, skills, and one project
        content = {
            "personal_info": {
                "full_name": "Strict Zero Fab",
                "email": "zerofab@example.com"
            },
            "skills": [
                {
                    "category": "Core",
                    "skills": ["Rust", "Distributed Systems"]
                }
            ],
            "projects": [
                {
                    "title": "Raft Consensus Node",
                    "tech_stack": ["Rust", "Tokio"],
                    "bullet_points": ["Achieved sub-millisecond leader election under partition simulations."]
                }
            ]
        }

        res = self.client.post("/api/resume-builder/compile-text", json=content, headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        plain_text = data["plain_text"]

        # Present items
        self.assertIn("Strict Zero Fab", plain_text)
        self.assertIn("zerofab@example.com", plain_text)
        self.assertIn("Raft Consensus Node", plain_text)
        self.assertIn("Rust, Tokio", plain_text)
        self.assertIn("sub-millisecond leader election", plain_text)

        # Completely absent sections must NOT appear as headers or dummy entries
        self.assertNotIn("EDUCATION", plain_text)
        self.assertNotIn("PROFESSIONAL SUMMARY", plain_text)
        self.assertNotIn("WORK EXPERIENCE", plain_text)
        self.assertNotIn("INTERNSHIPS", plain_text)
        self.assertNotIn("CERTIFICATIONS", plain_text)
        self.assertNotIn("HONORS & ACHIEVEMENTS", plain_text)
        self.assertNotIn("Lorem ipsum", plain_text)
        self.assertNotIn("Placeholder", plain_text)

    def test_05_validation_of_template_and_color(self):
        """Verify strict schema validation on template IDs and hex colors."""
        # Invalid template ID
        res_bad_tpl = self.client.post("/api/resume-builder/drafts", json={
            "title": "Bad Template Draft",
            "template_id": "non_existent_fancy_template",
            "content": {}
        }, headers=self.headers_a)
        self.assertEqual(res_bad_tpl.status_code, 422)

        # Invalid hex color
        res_bad_color = self.client.post("/api/resume-builder/drafts", json={
            "title": "Bad Color Draft",
            "accent_color": "not_a_valid_hex_color",
            "content": {}
        }, headers=self.headers_a)
        self.assertEqual(res_bad_color.status_code, 422)

    def test_06_compile_saved_draft_text_and_isolation(self):
        """Verify compiling a saved draft via endpoint and verifying ownership check."""
        # Create draft for A
        res_a = self.client.post("/api/resume-builder/drafts", json={
            "title": "Draft for compilation",
            "content": {
                "personal_info": {"full_name": "Compiler Alpha"}
            }
        }, headers=self.headers_a)
        draft_id = res_a.json()["id"]

        # A compiles draft
        res_comp_a = self.client.post(f"/api/resume-builder/drafts/{draft_id}/compile-text", headers=self.headers_a)
        self.assertEqual(res_comp_a.status_code, 200)
        self.assertIn("Compiler Alpha", res_comp_a.json()["plain_text"])

        # B tries to compile A's draft -> 403 Forbidden
        res_comp_b = self.client.post(f"/api/resume-builder/drafts/{draft_id}/compile-text", headers=self.headers_b)
        self.assertEqual(res_comp_b.status_code, 403)

    def test_07_input_validation_oversized_payload(self):
        """Verify draft rejection when payload exceeds 500KB ceiling."""
        huge_summary = "A" * 600_000
        res = self.client.post("/api/resume-builder/drafts", json={
            "title": "Oversized Draft",
            "content": {
                "personal_info": {"full_name": "Bloated Candidate"},
                "professional_summary": huge_summary
            }
        }, headers=self.headers_a)
        self.assertEqual(res.status_code, 422)
        self.assertIn("exceeds maximum allowed size", str(res.json()).lower())

    def test_08_input_validation_excessive_repeatable_items(self):
        """Verify draft rejection when repeatable sections exceed maximum collection bounds."""
        # Max education is 25 entries; send 30
        excessive_education = [
            {"id": f"edu_{i}", "institution": f"University {i}", "degree": "B.S."}
            for i in range(30)
        ]
        res = self.client.post("/api/resume-builder/drafts", json={
            "title": "Excessive Education Draft",
            "content": {
                "personal_info": {"full_name": "Multi Degree"},
                "education": excessive_education
            }
        }, headers=self.headers_a)
        self.assertEqual(res.status_code, 422)

    def test_09_compile_text_oversized_validation(self):
        """Verify /compile-text endpoint rejects oversized payloads with 422."""
        huge_summary = "B" * 600_000
        res = self.client.post("/api/resume-builder/compile-text", json={
            "personal_info": {"full_name": "Direct Bloat"},
            "professional_summary": huge_summary
        }, headers=self.headers_a)
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
