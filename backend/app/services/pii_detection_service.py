"""
PII Detection Service
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)

Deterministic scanner for Personal Identifiable Information (PII) and confidential credentials.
Scans interview submissions before persistence to protect candidate privacy and institutional integrity.
"""

import re
from typing import Dict, Any, List, Tuple


# Pre-compiled regex patterns for common PII and credential types
EMAIL_REGEX = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# International and Indian phone numbers (e.g. +91 9876543210, 9876543210, +1-555-123-4567)
PHONE_REGEX = re.compile(
    r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b'
)

# Secret tokens, API keys, JWTs
SECRET_KEY_REGEX = re.compile(
    r'(?:sk_[a-zA-Z0-9_\-]{20,}|ghp_[a-zA-Z0-9]{36}|eyJh[a-zA-Z0-9_\-]+\.eyJh[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+|bearer\s+[a-zA-Z0-9_\-\.]{20,})',
    re.IGNORECASE
)

# Sensitive IDs (SSN: XXX-XX-XXXX, Aadhaar: XXXX XXXX XXXX)
SENSITIVE_ID_REGEX = re.compile(
    r'\b(?:\d{3}-\d{2}-\d{4}|\d{4}\s\d{4}\s\d{4})\b'
)

# Sensitive URLs with query tokens or passwords
SENSITIVE_URL_REGEX = re.compile(
    r'https?://[^\s]*(?:token=|key=|secret=|password=|pwd=|auth=)[^\s]*',
    re.IGNORECASE
)


def scan_text_pii(text: str) -> Tuple[bool, List[str], List[str]]:
    """
    Scans a raw string for PII or secrets.
    Returns:
        is_clean: bool (True if no PII found)
        detected_categories: list of detected issue categories
        snippets: list of matched snippets (redacted where sensitive)
    """
    if not text or not isinstance(text, str):
        return True, [], []

    detected_categories = []
    snippets = []

    # 1. Emails
    emails = EMAIL_REGEX.findall(text)
    if emails:
        detected_categories.append("email")
        for em in emails[:3]:
            parts = em.split("@")
            redacted = f"{parts[0][:1]}***@{parts[1]}" if len(parts) == 2 else "***"
            snippets.append(f"Email detected: {redacted}")

    # 2. Secret keys / tokens
    secrets = SECRET_KEY_REGEX.findall(text)
    if secrets:
        detected_categories.append("secret_token")
        snippets.append("Secret token / API key detected")

    # 3. Sensitive government / financial IDs
    ids = SENSITIVE_ID_REGEX.findall(text)
    if ids:
        detected_categories.append("government_id")
        snippets.append("Government/ID format pattern detected (e.g. SSN/Aadhaar)")

    # 4. Sensitive URLs
    sensitive_urls = SENSITIVE_URL_REGEX.findall(text)
    if sensitive_urls:
        detected_categories.append("sensitive_url")
        snippets.append("URL containing credential query parameters detected")

    # 5. Phone numbers (filter out small digits or false positives like year 2024 or versions)
    phones = PHONE_REGEX.findall(text)
    valid_phones = []
    for p in phones:
        digits_only = re.sub(r'\D', '', p)
        if 10 <= len(digits_only) <= 13:
            valid_phones.append(digits_only)
    if valid_phones:
        detected_categories.append("phone_number")
        for p in valid_phones[:3]:
            snippets.append(f"Phone number pattern detected: ***-***-{p[-4:]}")

    is_clean = len(detected_categories) == 0
    return is_clean, detected_categories, snippets


def scan_submission_pii(submission_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aggregates PII scanning across all user-supplied fields in an interview experience submission.
    """
    detected_categories = set()
    all_snippets = []

    text_fields = [
        ("experience_text", submission_data.get("experience_text", "")),
        ("preparation_tips", submission_data.get("preparation_tips", "")),
        ("company", submission_data.get("company", "")),
        ("role", submission_data.get("role", "")),
    ]

    questions = submission_data.get("questions", [])
    if isinstance(questions, list):
        for idx, q in enumerate(questions):
            q_text = q.get("question_text", "") if isinstance(q, dict) else str(q)
            text_fields.append((f"question_{idx + 1}", q_text))

    for field_name, field_val in text_fields:
        if isinstance(field_val, str) and field_val.strip():
            clean, cats, snips = scan_text_pii(field_val)
            if not clean:
                for c in cats:
                    detected_categories.add(c)
                for s in snips:
                    all_snippets.append(f"[{field_name}] {s}")

    is_clean = len(detected_categories) == 0
    return {
        "is_clean": is_clean,
        "pii_scan_status": "CLEAN" if is_clean else "FLAGGED",
        "detected_categories": sorted(list(detected_categories)),
        "flagged_snippets": all_snippets[:10]
    }
