import pytest
from backend.app.services.email_service import (
    BaseEmailService,
    DevelopmentEmailService,
    SMTPEmailService,
    ResendEmailService,
    CascadingEmailService,
    get_email_service
)


class MockFailingEmailService(BaseEmailService):
    def send_email(self, *args, **kwargs):
        raise ConnectionError("Upstream API unreachable")

    def send_generic_email(self, *args, **kwargs):
        return {"status": "failed", "delivered": False, "email_sent": False, "mode": "mock_fail"}


class MockSuccessEmailService(BaseEmailService):
    def send_email(self, *args, **kwargs):
        return {"status": "sent", "delivered": True, "email_sent": True, "mode": "mock_success"}

    def send_generic_email(self, *args, **kwargs):
        return {"status": "sent", "delivered": True, "email_sent": True, "mode": "mock_success"}


def test_cascading_email_service_falls_back_on_failure():
    failing = MockFailingEmailService()
    success = MockSuccessEmailService()
    cascade = CascadingEmailService([failing, success])

    res = cascade.send_email(
        recipient_email="user@test.com",
        candidate_name="Alice",
        target_role="Software Engineer",
        current_streak=3,
        drill_title="System Design",
        drill_prompt="Design a rate limiter",
        primary_skill="System Design"
    )
    assert res["status"] == "sent"
    assert res["delivered"] is True
    assert res["mode"] == "mock_success"


def test_cascading_email_service_generic_email_fallback():
    failing = MockFailingEmailService()
    dev = DevelopmentEmailService()
    cascade = CascadingEmailService([failing, dev])

    res = cascade.send_generic_email(
        recipient_email="user@test.com",
        subject="Password Reset",
        html_body="<p>Reset token</p>"
    )
    assert res["recipient"] == "user@test.com"
    assert res["subject"] == "Password Reset"


def test_get_email_service_returns_active_service(monkeypatch):
    monkeypatch.setenv("EMAIL_MODE", "development")
    svc = get_email_service()
    assert isinstance(svc, DevelopmentEmailService)
