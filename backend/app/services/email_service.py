"""
Email Service & Notification Dispatcher Abstraction
AI Career Preparation Agent
"""

import os
import smtplib
import logging
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)


class BaseEmailService(ABC):
    """Abstract base email service interface."""

    @abstractmethod
    def send_email(
        self,
        recipient_email: str,
        candidate_name: str,
        target_role: str,
        current_streak: int,
        drill_title: str,
        drill_prompt: str,
        primary_skill: str,
        subject: Optional[str] = None,
        cta_url: str = "http://localhost:5173/daily-challenge"
    ) -> Dict[str, Any]:
        pass

    def build_html_template(
        self,
        candidate_name: str,
        target_role: str,
        current_streak: int,
        drill_title: str,
        drill_prompt: str,
        primary_skill: str,
        cta_url: str = "http://localhost:5173/daily-challenge"
    ) -> str:
        """
        Builds a high-impact, branded responsive HTML email template.
        Matches the Purple + Cyan futuristic SaaS aesthetic.
        """
        streak_badge = (
            f"🔥 {current_streak}-Day Streak Active"
            if current_streak > 0
            else "🔥 Start Your Streak Today!"
        )

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily AI Career Preparation Drill</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0C1E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0C1E; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: linear-gradient(135deg, #191A3A 0%, #151630 100%); border: 1px solid #7C3AED; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #7C3AED, #06B6D4);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid rgba(124, 58, 237, 0.25);">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #06B6D4;">
                      AI CAREER PREPARATION AGENT
                    </span>
                    <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                      Daily Proactive Practice Drill 🎯
                    </h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 6px 12px; background: rgba(249, 115, 22, 0.15); border: 1px solid #F97316; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #FDBA74;">
                      {streak_badge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Context -->
          <tr>
            <td style="padding: 28px 32px 16px;">
              <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                Hi <strong style="color: #FFFFFF;">{candidate_name}</strong>,
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Your autonomous AI Career Coach noticed your daily career preparation is still pending for your target role: <strong style="color: #06B6D4;">{target_role}</strong>. Completing one focused 5-minute drill today protects your consistency and strengthens high-yield competencies.
              </p>
            </td>
          </tr>

          <!-- Challenge Prompt Box -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(11, 12, 30, 0.7); border: 1px solid rgba(6, 182, 212, 0.35); border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #A78BFA; margin-bottom: 6px;">
                      Targeted Focus: {primary_skill}
                    </div>
                    <h2 style="margin: 0 0 10px; font-size: 16px; font-weight: 800; color: #FFFFFF;">
                      {drill_title}
                    </h2>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #CBD5E1; font-style: italic;">
                      "{drill_prompt}"
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px;">
              <a href="{cta_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%); color: #FFFFFF; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35); letter-spacing: 0.3px;">
                Solve Today's Conceptual Drill (+50 XP) &rarr;
              </a>
              <div style="margin-top: 12px; font-size: 12px; color: #64748B;">
                Takes ~5 minutes • Protects your practice streak
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #0F1026; border-top: 1px solid rgba(124, 58, 237, 0.15); text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94A3B8;">
                AI Career Preparation Agent
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                Automated Career Preparation & Daily Practice Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class DevelopmentEmailService(BaseEmailService):
    """
    Simulated development mode email service.
    Logs structured notifications to terminal console and creates preview records
    without requiring a paid email API or external credentials.
    """

    def send_email(
        self,
        recipient_email: str,
        candidate_name: str,
        target_role: str,
        current_streak: int,
        drill_title: str,
        drill_prompt: str,
        primary_skill: str,
        subject: Optional[str] = None,
        cta_url: str = "http://localhost:5173/daily-challenge"
    ) -> Dict[str, Any]:
        clean_first_name = candidate_name.split()[0] if candidate_name else "Candidate"
        computed_subject = subject or (
            f"🔥 Keep your streak alive, {clean_first_name}! Today's {primary_skill} drill is ready"
            if current_streak > 0
            else f"🎯 Your {primary_skill} practice drill is waiting ({target_role})"
        )

        html_content = self.build_html_template(
            candidate_name=candidate_name,
            target_role=target_role,
            current_streak=current_streak,
            drill_title=drill_title,
            drill_prompt=drill_prompt,
            primary_skill=primary_skill,
            cta_url=cta_url
        )

        body_preview = (
            f"Hello {candidate_name},\n\n"
            f"Your AI Career Coach detected daily preparation is pending for {target_role}.\n"
            f"Focus Area: {primary_skill}\n"
            f"Challenge: {drill_title}\n\n"
            f"Prompt:\n\"{drill_prompt}\"\n\n"
            f"Complete this 5-minute drill to earn +50 XP and protect your {current_streak}-day streak!"
        )

        now_iso = datetime.now().isoformat()

        # Structured development console log (safe for Windows cp1252 consoles)
        safe_subject = computed_subject.encode("ascii", "replace").decode("ascii")
        safe_prompt = drill_prompt.encode("ascii", "replace").decode("ascii")
        safe_title = drill_title.encode("ascii", "replace").decode("ascii")
        try:
            print("\n" + "=" * 80)
            print("[PROACTIVE DAILY PRACTICE REMINDER - DEVELOPMENT MODE]")
            print(f"Timestamp: {now_iso}")
            print(f"Recipient: {recipient_email}")
            print(f"Subject:   {safe_subject}")
            print(f"Candidate: {candidate_name} | Role: {target_role} | Streak: {current_streak} days")
            print(f"Focus:     {primary_skill} -> {safe_title}")
            print(f"Prompt:    {safe_prompt}")
            print("Status:    Recorded to SQLite Database (Development Mode - No SMTP credentials required)")
            print("=" * 80 + "\n")
        except Exception:
            pass

        return {
            "status": "development",
            "delivered": False,
            "email_sent": False,
            "mode": "development",
            "recipient": recipient_email,
            "subject": computed_subject,
            "bodyPreview": body_preview,
            "htmlContent": html_content,
            "timestamp": now_iso,
            "explanation": "Simulated in Development Mode. Full HTML rendered and logged to terminal without SMTP dispatch."
        }


class SMTPEmailService(BaseEmailService):
    """
    Real SMTP delivery service using TLS/SSL credentials from environment.
    """

    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "").strip()
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.user = os.getenv("SMTP_USER", "").strip()
        self.password = os.getenv("SMTP_PASSWORD", "").strip()
        self.sender = os.getenv("SMTP_FROM", "noreply@career-agent.dev").strip()

    def send_email(
        self,
        recipient_email: str,
        candidate_name: str,
        target_role: str,
        current_streak: int,
        drill_title: str,
        drill_prompt: str,
        primary_skill: str,
        subject: Optional[str] = None,
        cta_url: str = "http://localhost:5173/daily-challenge"
    ) -> Dict[str, Any]:
        clean_first_name = candidate_name.split()[0] if candidate_name else "Candidate"
        computed_subject = subject or f"🔥 Keep your streak alive, {clean_first_name}! Today's {primary_skill} drill is ready"

        html_content = self.build_html_template(
            candidate_name=candidate_name,
            target_role=target_role,
            current_streak=current_streak,
            drill_title=drill_title,
            drill_prompt=drill_prompt,
            primary_skill=primary_skill,
            cta_url=cta_url
        )

        plain_text = (
            f"Hello {candidate_name},\n\n"
            f"Your daily {target_role} preparation drill is waiting:\n"
            f"Topic: {drill_title} ({primary_skill})\n\n"
            f"\"{drill_prompt}\"\n\n"
            f"Complete it here: {cta_url}\n"
        )

        now_iso = datetime.now().isoformat()

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = computed_subject
            msg["From"] = self.sender
            msg["To"] = recipient_email

            part1 = MIMEText(plain_text, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.sender, [recipient_email], msg.as_string())

            logger.info(f"Successfully sent live SMTP email to {recipient_email}")
            return {
                "status": "sent",
                "delivered": True,
                "email_sent": True,
                "mode": "smtp",
                "recipient": recipient_email,
                "subject": computed_subject,
                "bodyPreview": plain_text[:200] + "...",
                "htmlContent": html_content,
                "timestamp": now_iso,
                "explanation": f"Delivered via live SMTP ({self.host}:{self.port})"
            }
        except Exception as exc:
            logger.error(f"SMTP email dispatch failed: {exc}")
            return {
                "status": "failed",
                "delivered": False,
                "email_sent": False,
                "mode": "smtp",
                "recipient": recipient_email,
                "subject": computed_subject,
                "bodyPreview": plain_text[:200] + "...",
                "htmlContent": html_content,
                "timestamp": now_iso,
                "explanation": f"SMTP dispatch failed: {str(exc)}"
            }


def get_email_service() -> BaseEmailService:
    """Factory selecting EmailService implementation based on environment configuration."""
    mode = os.getenv("EMAIL_MODE", "development").strip().lower()
    has_smtp = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD"))

    if mode == "smtp" and has_smtp:
        return SMTPEmailService()
    return DevelopmentEmailService()


# Global default email service instance
email_service = get_email_service()
