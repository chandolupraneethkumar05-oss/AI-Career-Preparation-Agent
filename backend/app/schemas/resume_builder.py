"""
Pydantic Schemas for Resume Builder
AI Career Preparation Agent
"""

import re
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


VALID_TEMPLATES = {"classic_academic", "modern_professional", "executive_minimal"}
DEFAULT_TEMPLATE = "modern_professional"
DEFAULT_ACCENT = "#245A45"
HEX_COLOR_REGEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
MAX_RESUME_CONTENT_BYTES = 500_000  # 500 KB serialized JSON ceiling


def _validate_str_list(items: Optional[List[str]], max_len: int = 1000) -> Optional[List[str]]:
    if not items:
        return []
    for item in items:
        if isinstance(item, str) and len(item) > max_len:
            raise ValueError(f"List item exceeds maximum character limit of {max_len}.")
    return items


class BaseFlexibleSchema(BaseModel):
    model_config = ConfigDict(extra="allow")


class PersonalInfoSchema(BaseFlexibleSchema):
    full_name: str = Field(default="", max_length=128)
    email: str = Field(default="", max_length=128)
    phone: str = Field(default="", max_length=32)
    location: str = Field(default="", max_length=128)
    linkedin_url: str = Field(default="", max_length=256)
    github_url: str = Field(default="", max_length=256)
    portfolio_url: str = Field(default="", max_length=256)
    target_role: Optional[str] = Field(default="", max_length=128)


class EducationItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    institution: str = Field(default="", max_length=256)
    degree: str = Field(default="", max_length=128)
    specialization: Optional[str] = Field(default="", max_length=128)
    field_of_study: Optional[str] = Field(default="", max_length=128)
    start_date: str = Field(default="", max_length=32)
    end_date: str = Field(default="", max_length=32)
    gpa: Optional[str] = Field(default="", max_length=32)
    honors: Optional[str] = Field(default="", max_length=256)
    coursework: Optional[str] = Field(default="", max_length=512)
    location: Optional[str] = Field(default="", max_length=128)
    description: Optional[str] = Field(default="", max_length=2000)


class SkillCategorySchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    category: str = Field(default="Technical Skills", max_length=128)
    skills: List[str] = Field(default_factory=list, max_length=50)

    @field_validator("skills")
    @classmethod
    def validate_skills_items(cls, v: List[str]) -> List[str]:
        return _validate_str_list(v, max_len=128) or []


class ProjectItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    title: str = Field(default="", max_length=256)
    role: Optional[str] = Field(default="", max_length=128)
    technologies: Optional[str] = Field(default="", max_length=256)
    tech_stack: Optional[Union[List[str], str]] = Field(default_factory=list)
    url: Optional[str] = Field(default="", max_length=256)
    start_date: Optional[str] = Field(default="", max_length=32)
    end_date: Optional[str] = Field(default="", max_length=32)
    description: Optional[str] = Field(default="", max_length=2000)
    bullets: Optional[List[str]] = Field(default_factory=list, max_length=30)
    bullet_points: Optional[List[str]] = Field(default_factory=list, max_length=30)

    @field_validator("bullets", "bullet_points")
    @classmethod
    def validate_bullet_items(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return _validate_str_list(v, max_len=1000)


class InternshipItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    organization: Optional[str] = Field(default="", max_length=256)
    company: Optional[str] = Field(default="", max_length=256)
    role: str = Field(default="", max_length=128)
    location: Optional[str] = Field(default="", max_length=128)
    start_date: Optional[str] = Field(default="", max_length=32)
    end_date: Optional[str] = Field(default="", max_length=32)
    responsibilities: Optional[str] = Field(default="", max_length=2000)
    description: Optional[str] = Field(default="", max_length=2000)
    bullets: Optional[List[str]] = Field(default_factory=list, max_length=30)
    bullet_points: Optional[List[str]] = Field(default_factory=list, max_length=30)

    @field_validator("bullets", "bullet_points")
    @classmethod
    def validate_bullet_items(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return _validate_str_list(v, max_len=1000)


class WorkExperienceItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    organization: Optional[str] = Field(default="", max_length=256)
    company: Optional[str] = Field(default="", max_length=256)
    role: Optional[str] = Field(default="", max_length=128)
    job_title: Optional[str] = Field(default="", max_length=128)
    location: Optional[str] = Field(default="", max_length=128)
    start_date: Optional[str] = Field(default="", max_length=32)
    end_date: Optional[str] = Field(default="", max_length=32)
    current: Optional[bool] = False
    is_current: Optional[bool] = False
    responsibilities: Optional[str] = Field(default="", max_length=2000)
    description: Optional[str] = Field(default="", max_length=2000)
    bullets: Optional[List[str]] = Field(default_factory=list, max_length=30)
    bullet_points: Optional[List[str]] = Field(default_factory=list, max_length=30)

    @field_validator("bullets", "bullet_points")
    @classmethod
    def validate_bullet_items(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return _validate_str_list(v, max_len=1000)


class CertificationItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    name: str = Field(default="", max_length=256)
    issuer: Optional[str] = Field(default="", max_length=256)
    issue_date: Optional[str] = Field(default="", max_length=32)
    expiry_date: Optional[str] = Field(default="", max_length=32)
    expiration_date: Optional[str] = Field(default="", max_length=32)
    credential_id: Optional[str] = Field(default="", max_length=128)
    credential_url: Optional[str] = Field(default="", max_length=256)


class AchievementItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    title: str = Field(default="", max_length=256)
    organization: Optional[str] = Field(default="", max_length=256)
    date: Optional[str] = Field(default="", max_length=32)
    description: Optional[str] = Field(default="", max_length=2000)


class CustomSectionItemSchema(BaseFlexibleSchema):
    id: str = Field(default="", max_length=64)
    title: Optional[str] = Field(default="", max_length=128)
    section_title: Optional[str] = Field(default="", max_length=128)
    content: Optional[str] = Field(default="", max_length=2000)
    items: Optional[List[str]] = Field(default_factory=list, max_length=30)
    bullet_points: Optional[List[str]] = Field(default_factory=list, max_length=30)

    @field_validator("items", "bullet_points")
    @classmethod
    def validate_items(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return _validate_str_list(v, max_len=1000)


class ResumeContentSchema(BaseFlexibleSchema):
    personal_info: Optional[PersonalInfoSchema] = Field(default_factory=PersonalInfoSchema)
    summary: Optional[str] = Field(default="", max_length=5000)
    professional_summary: Optional[str] = Field(default="", max_length=5000)
    education: Optional[List[EducationItemSchema]] = Field(default_factory=list, max_length=25)
    skills: Optional[List[SkillCategorySchema]] = Field(default_factory=list, max_length=30)
    projects: Optional[List[ProjectItemSchema]] = Field(default_factory=list, max_length=30)
    internships: Optional[List[InternshipItemSchema]] = Field(default_factory=list, max_length=25)
    work_experience: Optional[List[WorkExperienceItemSchema]] = Field(default_factory=list, max_length=30)
    certifications: Optional[List[CertificationItemSchema]] = Field(default_factory=list, max_length=30)
    achievements: Optional[List[AchievementItemSchema]] = Field(default_factory=list, max_length=30)
    custom_sections: Optional[List[CustomSectionItemSchema]] = Field(default_factory=list, max_length=20)


class ResumeDraftCreate(BaseModel):
    title: str = Field(default="Untitled Resume", max_length=128)
    target_role: Optional[str] = Field(default="", max_length=64)
    template_id: str = Field(default=DEFAULT_TEMPLATE)
    accent_color: str = Field(default=DEFAULT_ACCENT)
    content: Optional[Dict[str, Any]] = None

    @field_validator("template_id")
    @classmethod
    def validate_template(cls, v: str) -> str:
        if v not in VALID_TEMPLATES:
            raise ValueError(f"Invalid template_id '{v}'. Allowed templates: {sorted(list(VALID_TEMPLATES))}")
        return v

    @field_validator("accent_color")
    @classmethod
    def validate_accent(cls, v: str) -> str:
        if not v or not HEX_COLOR_REGEX.match(v):
            raise ValueError(f"Invalid accent_color '{v}'. Must be a valid hex color code (e.g. #245A45)")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[Any]) -> Optional[Dict[str, Any]]:
        if v is None:
            return {}
        import json
        if isinstance(v, dict):
            raw = json.dumps(v)
            if len(raw.encode("utf-8")) > MAX_RESUME_CONTENT_BYTES:
                raise ValueError(f"Resume content payload exceeds maximum allowed size of {MAX_RESUME_CONTENT_BYTES // 1000}KB")
            validated = ResumeContentSchema.model_validate(v)
            return validated.model_dump()
        elif hasattr(v, "model_dump"):
            raw = json.dumps(v.model_dump())
            if len(raw.encode("utf-8")) > MAX_RESUME_CONTENT_BYTES:
                raise ValueError(f"Resume content payload exceeds maximum allowed size of {MAX_RESUME_CONTENT_BYTES // 1000}KB")
            return v.model_dump()
        raise ValueError("Resume content must be a valid dictionary or structured schema.")


class ResumeDraftUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=128)
    target_role: Optional[str] = Field(default=None, max_length=64)
    template_id: Optional[str] = None
    accent_color: Optional[str] = None
    content: Optional[Dict[str, Any]] = None

    @field_validator("template_id")
    @classmethod
    def validate_template(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_TEMPLATES:
            raise ValueError(f"Invalid template_id '{v}'. Allowed templates: {sorted(list(VALID_TEMPLATES))}")
        return v

    @field_validator("accent_color")
    @classmethod
    def validate_accent(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not HEX_COLOR_REGEX.match(v)):
            raise ValueError(f"Invalid accent_color '{v}'. Must be a valid hex color code (e.g. #245A45)")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[Any]) -> Optional[Dict[str, Any]]:
        if v is None:
            return None
        import json
        if isinstance(v, dict):
            raw = json.dumps(v)
            if len(raw.encode("utf-8")) > MAX_RESUME_CONTENT_BYTES:
                raise ValueError(f"Resume content payload exceeds maximum allowed size of {MAX_RESUME_CONTENT_BYTES // 1000}KB")
            validated = ResumeContentSchema.model_validate(v)
            return validated.model_dump()
        elif hasattr(v, "model_dump"):
            raw = json.dumps(v.model_dump())
            if len(raw.encode("utf-8")) > MAX_RESUME_CONTENT_BYTES:
                raise ValueError(f"Resume content payload exceeds maximum allowed size of {MAX_RESUME_CONTENT_BYTES // 1000}KB")
            return v.model_dump()
        raise ValueError("Resume content must be a valid dictionary or structured schema.")


class ResumeDraftListItem(BaseModel):
    id: str
    user_id: str
    title: str
    target_role: Optional[str] = ""
    template_id: str
    accent_color: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeDraftResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_role: Optional[str] = ""
    template_id: str
    accent_color: str
    content: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TemplateInfoResponse(BaseModel):
    id: str
    name: str
    description: str
    typography: str
    ideal_for: str
    default_accent: str
    allowed_accents: List[str]
