"""
Comprehensive Tests for Deterministic, Grounded Resume ATS Scoring Engine
Validates all 10 bug fixes and requirements:
1. Determinism: identical inputs yield identical scores and breakdowns.
2. Zero skill-match points: 0 matching skills yields 0 skill points (no 4-point bonus).
3. Job description scoring: JD skills override role requirements when JD is provided.
4. Unknown role handling: unknown roles do NOT silently become Machine Learning Engineer.
5. Exact 100-point rubric sum: sum of breakdown scores == ats_score, maxes sum to 100.
6. LLM containment: LLM cannot overwrite ats_score or inject unverified skills.
7. LLM resilience: LLM failure leaves deterministic score and feedback intact.
8. Grounded feedback: missing skills phrased as not found in text, no 'dramatically increases ATS ranking'.
9. Section detection: does not match inline body words (no body regex fallback).
10. Impact quantification: requires both impact verb and metric, not generic words.
11. User authentication: requires explicit user_id when db is provided.
"""

import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db.models import Base, User, ResumeAnalysis, SkillEvidence
from backend.app.services.resume_analysis_service import (
    calculate_ats_score,
    detect_sections,
    generate_strengths_and_weaknesses,
    _quantified_impact_lines,
    ResumeAnalysisService
)


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # Create test user
    user = User(id="candidate-123", email="cand@example.com", name="Alice", target_role="Software Engineer")
    session.add(user)
    session.commit()
    yield session
    session.close()


SAMPLE_ML_RESUME = """# Alice Smith
Email: alice@example.com | GitHub: alice

## Experience
Senior Machine Learning Engineer at Tech Corp
- Deployed machine learning pipeline scaling inference to 10k requests per second.
- Optimized PyTorch model reducing latency by 45ms and improving accuracy by 12%.
- Built data processing pipelines using Python and Docker.

## Education
B.S. in Computer Science, Stanford University

## Skills
Python, PyTorch, Docker, Machine Learning, Deep Learning, SQL, Git

## Projects
- Autonomous Navigation System: Built deep learning vision models with 98% accuracy.
"""

SAMPLE_NO_SKILLS_RESUME = """# Bob Jones
Contact: bob@example.com

## Experience
Account Manager at Sales Corp
- Managed client relationships and answered customer inquiries.
- Organized weekly meetings and coordinated team schedules.

## Education
B.A. in History, State College
"""


def test_1_determinism():
    """Identical resume, role, and job description must produce identical score and breakdown across multiple runs."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    res1 = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role="Machine Learning Engineer"
    )

    res2 = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role="Machine Learning Engineer"
    )

    assert res1.ats_score == res2.ats_score
    assert [b.score for b in res1.breakdown] == [b.score for b in res2.breakdown]
    assert [b.max for b in res1.breakdown] == [b.max for b in res2.breakdown]
    assert res1.matched_skills == res2.matched_skills
    assert res1.missing_skills == res2.missing_skills
    assert res1.strengths == res2.strengths
    assert res1.weaknesses == res2.weaknesses


def test_2_zero_skill_match_points():
    """When a resume contains 0 matching skills for a role, skill match score must be exactly 0 (no 4-point bonus)."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_NO_SKILLS_RESUME.encode("utf-8")

    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="sales_resume.txt",
        target_role="Machine Learning Engineer"
    )

    skill_breakdown = next(b for b in res.breakdown if b.label == "Role/Job Skill Match")
    assert skill_breakdown.score == 0
    assert len(res.matched_skills) == 0


def test_3_job_description_overrides_role():
    """When a job description is supplied, recognized skills from the JD are used for skill matching."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")
    custom_jd = "Looking for a Developer experienced in Python, Docker, and Kubernetes."

    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role="Software Engineer",
        job_description=custom_jd
    )

    # Resume has Python and Docker (2 out of 3: Python, Docker, Kubernetes)
    assert "python" in res.matched_skills or "Python" in res.matched_skills
    assert "docker" in res.matched_skills or "Docker" in res.matched_skills
    assert "kubernetes" in res.missing_skills or "Kubernetes" in res.missing_skills
    assert "job description" in res.score_basis.lower()


def test_4_unknown_role_does_not_default_to_ml_engineer():
    """Unknown roles without a JD do not default to Machine Learning Engineer. Skill match is 0 with explicit basis."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    unknown_role = "Quantum Cryogenic Architect"
    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role=unknown_role
    )

    assert res.target_role == unknown_role
    assert res.is_role_aligned is False
    assert "not in the predefined taxonomy" in res.score_basis
    skill_item = next(b for b in res.breakdown if b.label == "Role/Job Skill Match")
    assert skill_item.score == 0


def test_5_exact_100_point_rubric_sum():
    """Component scores must sum exactly to ats_score, and component max values must sum to 100."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role="Machine Learning Engineer"
    )

    sum_scores = sum(b.score for b in res.breakdown)
    sum_max = sum(b.max for b in res.breakdown)

    assert sum_scores == res.ats_score
    assert sum_max == 100
    for b in res.breakdown:
        assert 0 <= b.score <= b.max


def test_6_llm_cannot_overwrite_deterministic_score_or_invent_skills():
    """LLM cannot overwrite ats_score or breakdown, and cannot add skills not substantiated in resume text."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    mock_llm_service = MagicMock()
    mock_llm_service.analyze_resume.return_value = {
        "ats_score": 99,  # Attempted override
        "score_breakdown": {"keyword_match_score": 100},
        "extracted_skills": ["Rust", "Solidity", "Python"],  # Rust and Solidity are not in resume!
        "summary": "Hallucinated LLM summary of exceptional blockchain skills."
    }

    with patch("backend.app.services.resume_analysis_service.get_resume_llm_service", return_value=mock_llm_service):
        res = service.analyze_resume_document(
            file_bytes=file_bytes,
            filename="resume.txt",
            target_role="Machine Learning Engineer"
        )

        # Deterministic score must NOT be 99!
        assert res.ats_score != 99
        # Rust and Solidity must NOT be in extracted_skills because they are absent from the resume text
        assert "rust" not in [s.lower() for s in res.extracted_skills]
        assert "solidity" not in [s.lower() for s in res.extracted_skills]
        # Python should be retained because it is in the resume text
        assert "python" in [s.lower() for s in res.extracted_skills]


def test_7_llm_failure_leaves_deterministic_results_intact():
    """If LLM service fails or raises exception, deterministic scores and feedback are completely intact."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    mock_llm_service = MagicMock()
    mock_llm_service.analyze_resume.side_effect = RuntimeError("OpenAI API rate limit exceeded")

    with patch("backend.app.services.resume_analysis_service.get_resume_llm_service", return_value=mock_llm_service):
        res = service.analyze_resume_document(
            file_bytes=file_bytes,
            filename="resume.txt",
            target_role="Machine Learning Engineer"
        )

        assert res.ats_score > 0
        assert len(res.breakdown) == 3
        assert sum(b.score for b in res.breakdown) == res.ats_score
        assert len(res.strengths) > 0


def test_8_grounded_feedback_no_exaggerated_claims():
    """Missing skills must be phrased as not found in text, not candidate personal lack. No 'dramatically increases'."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_NO_SKILLS_RESUME.encode("utf-8")

    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="sales_resume.txt",
        target_role="Machine Learning Engineer"
    )

    for weakness in res.weaknesses:
        assert "lacks" not in weakness.lower()
        assert "dramatically increases ats ranking" not in weakness.lower()
        assert "distributed systems" not in weakness.lower()


def test_9_section_detection_ignores_inline_body_words():
    """Words in body sentences (e.g. 'I gained valuable experience working...') must not trigger section detection."""
    body_text_only = """John Doe
Email: john@example.com

In my career I have gained extensive experience in designing systems.
My projects have included education and developing skills for various teams.
"""
    sections = detect_sections(body_text_only)
    # None of the lines are section headings (they are long narrative sentences)
    assert len(sections) == 0


def test_10_impact_metric_detection_requires_verb_and_number():
    """Metric detection requires both an impact/action verb and a quantifiable metric, not generic words."""
    # Generic words without numbers
    generic_text = "Responsible for pipeline accuracy and production deployment."
    impact1 = _quantified_impact_lines(generic_text)
    assert len(impact1) == 0

    # Impact verb with quantifiable metric
    quantified_text = "Optimized model pipeline reducing latency by 45ms and improving accuracy by 15%."
    impact2 = _quantified_impact_lines(quantified_text)
    assert len(impact2) == 1


def test_11_db_persistence_requires_authenticated_user_id(test_db):
    """Calling analyze_resume_document with db session requires a non-empty user_id."""
    service = ResumeAnalysisService()
    file_bytes = SAMPLE_ML_RESUME.encode("utf-8")

    with pytest.raises(ValueError, match="A valid authenticated user_id is required"):
        service.analyze_resume_document(
            file_bytes=file_bytes,
            filename="resume.txt",
            target_role="Machine Learning Engineer",
            user_id="",
            db=test_db
        )

    # Valid user_id succeeds and does NOT create arbitrary 40/55/85/80 SkillEvidence
    res = service.analyze_resume_document(
        file_bytes=file_bytes,
        filename="resume.txt",
        target_role="Machine Learning Engineer",
        user_id="candidate-123",
        db=test_db
    )
    assert res.user_id == "candidate-123"

    # Verify no arbitrary skill evidence with fixed values (40, 55, 85, 80) was inserted
    evidences = test_db.query(SkillEvidence).filter(SkillEvidence.user_id == "candidate-123").all()
    assert len(evidences) == 0
