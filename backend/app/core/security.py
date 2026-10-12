"""
Security, Password Hashing & Token Authentication
AI Career Preparation Agent
"""

import os
import json
import base64
import hmac
import hashlib
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import bcrypt

DEFAULT_DEV_SECRET = "career-agent-dev-secret-key-3f9b2d8e4a7c1b5a9e8f2c6d0a4b7e1f"
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def get_secret_key() -> str:
    """
    Retrieves the HMAC secret key.
    Enforces that in production environments (ENVIRONMENT=production or APP_ENV=production),
    a secure, non-default secret key MUST be provided. Refuses to fall back to the dev secret.
    """
    env = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).strip().lower()
    key = os.getenv("SECRET_KEY", "").strip()
    if env == "production":
        if not key or key == DEFAULT_DEV_SECRET or len(key) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY must be explicitly set to a strong, "
                "unique key (at least 32 characters) in production environments. Refusing to run with "
                "default, missing, or insecure secret key."
            )
        return key
    return key or DEFAULT_DEV_SECRET


def hash_password(plain_password: str) -> str:
    """Hashes a plaintext password using bcrypt with salt."""
    if not plain_password:
        raise ValueError("Password cannot be empty")
    pwd_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def hash_token(token: str) -> str:
    """Computes fixed-length SHA-256 digest of token for indexing and revocation checks."""
    return hashlib.sha256(token.strip().encode("utf-8")).hexdigest()


def revoke_token(token: str, db: Any, user_id: str) -> bool:
    """
    Invalidates a bearer token on the server side by adding it to the RevokedToken blocklist.
    Prevents any further authentication attempts using this token.
    """
    from ..db.models import RevokedToken
    try:
        token_id = hash_token(token)
        claims = decode_access_token(token)
        expires_at = claims.get("exp", int(time.time()) + (DEFAULT_EXPIRE_MINUTES * 60)) if claims else int(time.time()) + (DEFAULT_EXPIRE_MINUTES * 60)

        existing = db.query(RevokedToken).filter(RevokedToken.id == token_id).first()
        if not existing:
            token_prefix = token[:12] if len(token) >= 12 else token
            revoked_record = RevokedToken(
                id=token_id,
                user_id=user_id,
                expires_at=expires_at,
                token_preview=token_prefix
            )
            db.add(revoked_record)
            db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def is_token_revoked(token: str, db: Any) -> bool:
    """Checks whether a token has been revoked on the server."""
    if not token or db is None:
        return False
    from ..db.models import RevokedToken
    try:
        token_id = hash_token(token)
        return db.query(RevokedToken).filter(RevokedToken.id == token_id).first() is not None
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed, tamper-proof bearer token with expiration.
    Uses cryptographically strong HMAC-SHA256 signature.
    """
    to_encode = data.copy()
    now_ts = int(time.time())
    if expires_delta:
        expire_ts = now_ts + int(expires_delta.total_seconds())
    else:
        expire_ts = now_ts + (DEFAULT_EXPIRE_MINUTES * 60)

    to_encode.update({
        "iat": now_ts,
        "exp": expire_ts
    })

    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_json = json.dumps(to_encode, separators=(",", ":")).encode("utf-8")

    header_b64 = _b64url_encode(header_json)
    payload_b64 = _b64url_encode(payload_json)

    secret_key = get_secret_key()
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str, db: Optional[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Verifies token signature and checks expiration in constant time.
    If db session is supplied, checks whether token has been revoked on the server.
    Returns decoded claims dictionary or None if invalid, expired, or revoked.
    """
    if not token or not isinstance(token, str):
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, signature_b64 = parts
    secret_key = get_secret_key()

    # Verify signature in constant time
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        return None

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    # Verify expiration
    exp = payload.get("exp")
    if exp is not None and time.time() > exp:
        return None

    # Single-purpose media streaming tickets cannot be used as master API bearer tokens
    if payload.get("scope") == "media_stream":
        return None

    # Check server-side revocation if db session provided
    if db is not None and is_token_revoked(token, db):
        return None

    return payload


def create_stream_ticket(user_id: str, session_id: str, expires_in_seconds: int = 120) -> str:
    """
    Creates a tightly scoped, short-lived ticket specifically for HTML5 media streaming.
    Valid only for the given session_id and candidate, expiring in 120 seconds.
    Cannot be used for general API access.
    """
    now_ts = int(time.time())
    payload = {
        "sub": user_id,
        "sid": session_id,
        "scope": "media_stream",
        "iat": now_ts,
        "exp": now_ts + expires_in_seconds
    }
    header = {"alg": ALGORITHM, "typ": "TICKET"}
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    header_b64 = _b64url_encode(header_json)
    payload_b64 = _b64url_encode(payload_json)

    secret_key = get_secret_key()
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_stream_ticket(ticket: str, session_id: str) -> Optional[str]:
    """
    Verifies a short-lived stream ticket.
    Guarantees signature validity, non-expired status, scope == 'media_stream', and sid == session_id.
    Returns authenticated user_id or None.
    """
    if not ticket or not isinstance(ticket, str):
        return None

    parts = ticket.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, signature_b64 = parts
    secret_key = get_secret_key()

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        return None

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    if payload.get("scope") != "media_stream":
        return None

    if payload.get("sid") != session_id:
        return None

    exp = payload.get("exp")
    if exp is not None and time.time() > exp:
        return None

    return payload.get("sub")
