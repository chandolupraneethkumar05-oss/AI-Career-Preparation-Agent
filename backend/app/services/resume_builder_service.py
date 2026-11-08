"""
Resume Builder Service
AI Career Preparation Agent - Phase 3

Provides isolated management of structured resume drafts:
- Deterministic template metadata catalog
- Draft CRUD operations with tenant-isolated ownership checks (HTTP 403)
- Plain text compilation following the Zero-Fabrication Guarantee (no placeholder/dummy data)
"""

import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..db.models import ResumeDraft
from ..schemas.resume_builder import (
    ResumeDraftCreate,
    ResumeDraftUpdate,
    DEFAULT_TEMPLATE,
    DEFAULT_ACCENT,
)

logger = logging.getLogger("resume_builder")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


TEMPLATES_CATALOG = [
    {
        "id": "classic_academic",
        "name": "Classic Academic",
        "description": "Traditional serif typography, centered header, elegant rules. Optimized for academia, research, and legal applications.",
        "typography": "Serif (Times / Georgia standard)",
        "ideal_for": "Academic, Research, Graduate Studies, Legal, Publications",
        "default_accent": "#245A45",
        "allowed_accents": ["#245A45", "#334155", "#1E293B", "#831843", "#1E3A8A", "#0F766E"]
    },
    {
        "id": "modern_professional",
        "name": "Modern Professional",
        "description": "Crisp sans-serif, left-aligned header, modern accent line, and skill tags. Ideal for technology, engineering, and startups.",
        "typography": "Sans-serif (Inter / System UI)",
        "ideal_for": "Software Engineering, Product, Data Science, Startups",
        "default_accent": "#245A45",
        "allowed_accents": ["#245A45", "#334155", "#1E293B", "#831843", "#1E3A8A", "#0F766E"]
    },
    {
        "id": "executive_minimal",
        "name": "Executive Minimal",
        "description": "Refined high-contrast typography, generous whitespace, metric-focused presentation. Perfect for leadership and consulting.",
        "typography": "Minimal Sans-serif with generous letter spacing",
        "ideal_for": "Engineering Management, Architecture, Executive, Strategy",
        "default_accent": "#245A45",
        "allowed_accents": ["#245A45", "#334155", "#1E293B", "#831843", "#1E3A8A", "#0F766E"]
    }
]


class ResumeBuilderService:
    """Core domain service for resume draft management and text compilation."""

    @staticmethod
    def get_templates() -> List[Dict[str, Any]]:
        """Returns the catalog of 3 distinct, professionally styled templates."""
        return TEMPLATES_CATALOG

    @staticmethod
    def list_drafts(db: Session, user_id: str) -> List[ResumeDraft]:
        """Lists all resume drafts owned by the authenticated student."""
        return (
            db.query(ResumeDraft)
            .filter(ResumeDraft.user_id == user_id)
            .order_by(ResumeDraft.updated_at.desc())
            .all()
        )

    @staticmethod
    def get_draft(db: Session, draft_id: str, user_id: str) -> ResumeDraft:
        """
        Retrieves a single draft, strictly enforcing tenant isolation.
        Returns HTTP 403 Forbidden if accessed by another user.
        """
        draft = db.query(ResumeDraft).filter(ResumeDraft.id == draft_id).first()
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume draft '{draft_id}' was not found."
            )

        if draft.user_id != user_id:
            logger.warning(
                f"Unauthorized draft access attempt: user '{user_id}' requested draft '{draft_id}' owned by '{draft.user_id}'"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to access another student's resume draft."
            )

        return draft

    @staticmethod
    def create_draft(db: Session, user_id: str, draft_in: ResumeDraftCreate) -> ResumeDraft:
        """Creates a new resume draft for the authenticated user."""
        draft_id = f"draft_{uuid.uuid4().hex[:12]}"

        if isinstance(draft_in.content, dict):
            content_dict = draft_in.content
        elif hasattr(draft_in.content, "model_dump"):
            content_dict = draft_in.content.model_dump()
        else:
            content_dict = {}

        now = utc_now()
        draft = ResumeDraft(
            id=draft_id,
            user_id=user_id,
            title=(draft_in.title or "Untitled Resume").strip(),
            target_role=(draft_in.target_role or "").strip(),
            template_id=draft_in.template_id or DEFAULT_TEMPLATE,
            accent_color=draft_in.accent_color or DEFAULT_ACCENT,
            content_json=json.dumps(content_dict),
            created_at=now,
            updated_at=now
        )

        try:
            db.add(draft)
            db.commit()
            db.refresh(draft)
            logger.info(f"Created resume draft '{draft.id}' for user '{user_id}'.")
            return draft
        except Exception as exc:
            db.rollback()
            logger.error(f"Error creating resume draft: {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save resume draft to database."
            )

    @staticmethod
    def update_draft(db: Session, draft_id: str, user_id: str, draft_in: ResumeDraftUpdate) -> ResumeDraft:
        """Updates an existing resume draft, validating student ownership."""
        draft = ResumeBuilderService.get_draft(db=db, draft_id=draft_id, user_id=user_id)

        if draft_in.title is not None:
            draft.title = draft_in.title.strip() or "Untitled Resume"
        if draft_in.target_role is not None:
            draft.target_role = draft_in.target_role.strip()
        if draft_in.template_id is not None:
            draft.template_id = draft_in.template_id
        if draft_in.accent_color is not None:
            draft.accent_color = draft_in.accent_color
        if draft_in.content is not None:
            if isinstance(draft_in.content, dict):
                draft.content_json = json.dumps(draft_in.content)
            elif hasattr(draft_in.content, "model_dump"):
                draft.content_json = json.dumps(draft_in.content.model_dump())
            else:
                draft.content_json = json.dumps({})

        draft.updated_at = utc_now()

        try:
            db.commit()
            db.refresh(draft)
            logger.info(f"Updated resume draft '{draft_id}' for user '{user_id}'.")
            return draft
        except Exception as exc:
            db.rollback()
            logger.error(f"Error updating resume draft '{draft_id}': {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update resume draft in database."
            )

    @staticmethod
    def delete_draft(db: Session, draft_id: str, user_id: str) -> bool:
        """Deletes a resume draft after verifying student ownership."""
        draft = ResumeBuilderService.get_draft(db=db, draft_id=draft_id, user_id=user_id)

        try:
            db.delete(draft)
            db.commit()
            logger.info(f"Deleted resume draft '{draft_id}' for user '{user_id}'.")
            return True
        except Exception as exc:
            db.rollback()
            logger.error(f"Error deleting resume draft '{draft_id}': {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete resume draft from database."
            )

    @staticmethod
    def compile_draft_to_plain_text(content: Dict[str, Any], title: str = "", target_role: str = "") -> str:
        """
        Compiles structured resume draft content into clean, ATS-standard plaintext.
        Strictly observes the Zero-Fabrication Guarantee:
        - If a field is empty, it is omitted.
        - If an entire section has no entries, the section heading is omitted.
        - No fictional data or placeholder strings are inserted.
        """
        if not content or not isinstance(content, dict):
            return ""

        lines: List[str] = []

        # 1. Personal Information & Header
        pi = content.get("personal_info") or {}
        name = (pi.get("full_name") or "").strip()
        if name:
            lines.append(name)

        role_header = (target_role or pi.get("target_role") or "").strip()
        if role_header:
            lines.append(role_header)

        contact_parts: List[str] = []
        email = (pi.get("email") or "").strip()
        phone = (pi.get("phone") or "").strip()
        loc = (pi.get("location") or "").strip()
        if email:
            contact_parts.append(email)
        if phone:
            contact_parts.append(phone)
        if loc:
            contact_parts.append(loc)
        if contact_parts:
            lines.append(" | ".join(contact_parts))

        link_parts: List[str] = []
        linkedin = (pi.get("linkedin_url") or "").strip()
        github = (pi.get("github_url") or "").strip()
        portfolio = (pi.get("portfolio_url") or "").strip()
        if linkedin:
            link_parts.append(f"LinkedIn: {linkedin}")
        if github:
            link_parts.append(f"GitHub: {github}")
        if portfolio:
            link_parts.append(f"Portfolio: {portfolio}")
        if link_parts:
            lines.append(" | ".join(link_parts))

        if lines:
            lines.append("")

        # 2. Professional Summary
        summary = (content.get("summary") or content.get("professional_summary") or "").strip()
        if summary:
            lines.append("PROFESSIONAL SUMMARY")
            lines.append(summary)
            lines.append("")

        # 3. Technical Skills
        skills_categories = content.get("skills") or []
        non_empty_skills = []
        for cat in skills_categories:
            cat_name = (cat.get("category") or "").strip()
            skills_list = [s.strip() for s in (cat.get("skills") or []) if s and s.strip()]
            if skills_list:
                label = f"{cat_name}: " if cat_name else ""
                non_empty_skills.append(f"{label}{', '.join(skills_list)}")

        if non_empty_skills:
            lines.append("TECHNICAL SKILLS")
            for sk_line in non_empty_skills:
                lines.append(sk_line)
            lines.append("")

        # 4. Work Experience
        work_exp = content.get("work_experience") or []
        valid_work = [
            w for w in work_exp
            if (w.get("company") or w.get("organization") or w.get("job_title") or w.get("role") or "").strip()
        ]
        if valid_work:
            lines.append("WORK EXPERIENCE")
            for w in valid_work:
                role = (w.get("job_title") or w.get("role") or "").strip()
                org = (w.get("company") or w.get("organization") or "").strip()
                loc = (w.get("location") or "").strip()
                s_date = (w.get("start_date") or "").strip()
                is_curr = w.get("is_current") or w.get("current")
                e_date = "Present" if is_curr else (w.get("end_date") or "").strip()
                date_str = f"{s_date} - {e_date}" if s_date or e_date else ""

                header_parts = [p for p in [role, org, loc, date_str] if p]
                if header_parts:
                    lines.append(" | ".join(header_parts))

                resp = (w.get("description") or w.get("responsibilities") or "").strip()
                if resp:
                    lines.append(resp)

                bullets = w.get("bullet_points") or w.get("bullets") or []
                for b in bullets:
                    b_str = b.strip() if isinstance(b, str) else ""
                    if b_str:
                        lines.append(f"- {b_str}")
            lines.append("")

        # 5. Projects
        projects = content.get("projects") or []
        valid_projects = [p for p in projects if (p.get("title") or "").strip()]
        if valid_projects:
            lines.append("PROJECTS")
            for p in valid_projects:
                title = (p.get("title") or "").strip()
                role = (p.get("role") or "").strip()
                tech_raw = p.get("tech_stack") or p.get("technologies") or ""
                if isinstance(tech_raw, list):
                    tech = ", ".join([t.strip() for t in tech_raw if t and t.strip()])
                else:
                    tech = str(tech_raw).strip()

                url = (p.get("url") or "").strip()
                s_date = (p.get("start_date") or "").strip()
                e_date = (p.get("end_date") or "").strip()
                date_str = f"{s_date} - {e_date}" if s_date or e_date else ""

                header_parts = [pt for pt in [title, role, date_str] if pt]
                if header_parts:
                    lines.append(" | ".join(header_parts))
                if tech:
                    lines.append(f"Technologies: {tech}")
                if url:
                    lines.append(f"Link: {url}")

                desc_text = (p.get("description") or "").strip()
                if desc_text:
                    lines.append(desc_text)

                bullets = p.get("bullet_points") or p.get("bullets") or []
                for b in bullets:
                    b_str = b.strip() if isinstance(b, str) else ""
                    if b_str:
                        lines.append(f"- {b_str}")
            lines.append("")

        # 6. Internships
        internships = content.get("internships") or []
        valid_internships = [
            i for i in internships
            if (i.get("organization") or i.get("company") or i.get("role") or "").strip()
        ]
        if valid_internships:
            lines.append("INTERNSHIPS")
            for i in valid_internships:
                role = (i.get("role") or "").strip()
                org = (i.get("organization") or i.get("company") or "").strip()
                loc = (i.get("location") or "").strip()
                s_date = (i.get("start_date") or "").strip()
                e_date = (i.get("end_date") or "").strip()
                date_str = f"{s_date} - {e_date}" if s_date or e_date else ""

                header_parts = [pt for pt in [role, org, loc, date_str] if pt]
                if header_parts:
                    lines.append(" | ".join(header_parts))

                resp = (i.get("description") or i.get("responsibilities") or "").strip()
                if resp:
                    lines.append(resp)

                bullets = i.get("bullet_points") or i.get("bullets") or []
                for b in bullets:
                    b_str = b.strip() if isinstance(b, str) else ""
                    if b_str:
                        lines.append(f"- {b_str}")
            lines.append("")

        # 7. Education
        education = content.get("education") or []
        valid_edu = [e for e in education if (e.get("institution") or e.get("degree") or "").strip()]
        if valid_edu:
            lines.append("EDUCATION")
            for e in valid_edu:
                deg = (e.get("degree") or "").strip()
                spec = (e.get("field_of_study") or e.get("specialization") or "").strip()
                degree_full = f"{deg} in {spec}" if deg and spec else (deg or spec)
                inst = (e.get("institution") or "").strip()
                s_date = (e.get("start_date") or "").strip()
                e_date = (e.get("end_date") or "").strip()
                date_str = f"{s_date} - {e_date}" if s_date or e_date else ""
                gpa = (e.get("gpa") or "").strip()
                gpa_str = f"GPA: {gpa}" if gpa else ""

                header_parts = [pt for pt in [degree_full, inst, date_str, gpa_str] if pt]
                if header_parts:
                    lines.append(" | ".join(header_parts))

                honors = (e.get("honors") or "").strip()
                if honors:
                    lines.append(f"Honors: {honors}")

                coursework = (e.get("coursework") or "").strip()
                if coursework:
                    lines.append(f"Coursework: {coursework}")

                desc_text = (e.get("description") or "").strip()
                if desc_text:
                    lines.append(desc_text)
            lines.append("")

        # 8. Certifications
        certifications = content.get("certifications") or []
        valid_certs = [c for c in certifications if (c.get("name") or "").strip()]
        if valid_certs:
            lines.append("CERTIFICATIONS")
            for c in valid_certs:
                c_name = (c.get("name") or "").strip()
                issuer = (c.get("issuer") or "").strip()
                date = (c.get("issue_date") or "").strip()
                cred_id = (c.get("credential_id") or "").strip()
                url = (c.get("credential_url") or "").strip()
                parts = [p for p in [c_name, issuer, date] if p]
                line = " - ".join(parts)
                if cred_id:
                    line += f" (ID: {cred_id})"
                if url:
                    line += f" ({url})"
                lines.append(f"- {line}")
            lines.append("")

        # 9. Achievements
        achievements = content.get("achievements") or []
        valid_ach = [a for a in achievements if (a.get("title") or a.get("description") or "").strip()]
        if valid_ach:
            lines.append("HONORS & ACHIEVEMENTS")
            for a in valid_ach:
                title = (a.get("title") or "").strip()
                org = (a.get("organization") or "").strip()
                date = (a.get("date") or "").strip()
                desc_text = (a.get("description") or "").strip()

                header_parts = [p for p in [title, org, date] if p]
                if header_parts:
                    lines.append(" - ".join(header_parts))
                if desc_text:
                    lines.append(f"  {desc_text}")
            lines.append("")

        # 10. Custom Sections
        custom_sections = content.get("custom_sections") or []
        for cs in custom_sections:
            sec_title = (cs.get("title") or cs.get("section_title") or "").strip()
            sec_content = (cs.get("content") or "").strip()
            bullets = cs.get("bullet_points") or cs.get("items") or []
            items = [item.strip() for item in bullets if item and isinstance(item, str) and item.strip()]
            if sec_title and (sec_content or items):
                lines.append(sec_title.upper())
                if sec_content:
                    lines.append(sec_content)
                for item in items:
                    lines.append(f"- {item}")
                lines.append("")

        return "\n".join(lines).strip()


resume_builder_service = ResumeBuilderService()
