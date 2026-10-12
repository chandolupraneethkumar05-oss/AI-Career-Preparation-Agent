"""
Tests for Skill Taxonomy Fallback Disclosure and Logging
"""

import pytest
import logging
from backend.app.services.skill_taxonomy import (
    get_canonical_role,
    resolve_canonical_role_with_disclosure,
    is_canonical_role_fallback,
    ROLE_REQUIREMENTS,
)


def test_canonical_roles_resolve_without_fallback():
    for role in ROLE_REQUIREMENTS.keys():
        canonical, is_fallback, reason = resolve_canonical_role_with_disclosure(role)
        assert canonical == role
        assert is_fallback is False
        assert reason is None
        assert is_canonical_role_fallback(role) is False


def test_role_aliases_resolve_without_fallback():
    test_cases = [
        ("ml engineer", "Machine Learning Engineer"),
        ("mle", "Machine Learning Engineer"),
        ("sde", "Software Engineer"),
        ("devops engineer", "DevOps & Cloud Engineer"),
    ]
    for raw, expected in test_cases:
        canonical, is_fallback, reason = resolve_canonical_role_with_disclosure(raw)
        assert canonical == expected
        assert is_fallback is False
        assert reason is None
        assert is_canonical_role_fallback(raw) is False


def test_unmapped_roles_trigger_honest_fallback_disclosure(caplog):
    caplog.set_level(logging.WARNING)
    unknown_role = "Quantum Cryogenic Architect"

    canonical, is_fallback, reason = resolve_canonical_role_with_disclosure(unknown_role)
    assert canonical == "Machine Learning Engineer"
    assert is_fallback is True
    assert "not in the canonical taxonomy" in reason
    assert is_canonical_role_fallback(unknown_role) is True

    # Test that get_canonical_role logs a warning
    res = get_canonical_role(unknown_role)
    assert res == "Machine Learning Engineer"
    assert any("Taxonomy fallback triggered" in record.message for record in caplog.records)


def test_empty_role_triggers_honest_fallback_disclosure():
    canonical, is_fallback, reason = resolve_canonical_role_with_disclosure("")
    assert canonical == "Machine Learning Engineer"
    assert is_fallback is True
    assert "No role specified" in reason
