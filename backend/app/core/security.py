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
import math
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
    Strictly validates header and payload types and required claims (sub, exp).
    Rejects malformed, non-dict, non-finite, boolean, and expired payloads safely.
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
        header_bytes = _b64url_decode(header_b64)
        header = json.loads(header_bytes.decode("utf-8"))
    except Exception:
        return None

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    # Verify header and payload are dictionaries
    if not isinstance(header, dict) or not isinstance(payload, dict):
        return None

    # Validate required 'sub' (subject/user_id) claim
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        return None

    # Validate required 'exp' (expiration) claim
    exp = payload.get("exp")
    if exp is None:
        return None
    if isinstance(exp, bool) or not isinstance(exp, (int, float)) or math.isnan(exp) or math.isinf(exp) or exp <= 0:
        return None
    if time.time() >= exp:
        return None

    # Validate optional 'iat' (issued-at) claim if present
    iat = payload.get("iat")
    if iat is not None:
        if isinstance(iat, bool) or not isinstance(iat, (int, float)) or math.isnan(iat) or math.isinf(iat) or iat <= 0:
            return None

    # Single-purpose media streaming tickets cannot be used as master API bearer tokens
    if payload.get("scope") == "media_stream" or header.get("typ") == "TICKET":
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


def verify_stream_ticket(ticket: str, session_id: str, db: Optional[Any] = None) -> Optional[str]:
    """
    Verifies and atomically consumes a short-lived stream ticket.
    Guarantees:
    - 3-part format: header.payload.signature
    - Valid HMAC-SHA256 signature
    - Safe JSON decoding without unhandled exceptions
    - scope strictly equals 'media_stream'
    - sid strictly equals session_id
    - sub (user_id) is non-empty string
    - exp claim exists, is numeric, and has not elapsed
    - iat claim is numeric and not in future (> now + 60)
    - Single-use replay protection: atomically logged in consumed_stream_tickets table if db is provided.
    Returns authenticated user_id if valid and successfully consumed, else None.
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
        header_bytes = _b64url_decode(header_b64)
        header = json.loads(header_bytes.decode("utf-8"))
        if not isinstance(header, dict) or header.get("alg") != ALGORITHM:
            return None
    except Exception:
        return None

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    # Scope validation
    if payload.get("scope") != "media_stream":
        return None

    # Session ID validation
    sid = payload.get("sid")
    if not sid or not isinstance(sid, str) or sid != session_id:
        return None

    # Candidate ID validation
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str) or not sub.strip():
        return None

    # Expiration validation (must be present, numeric, finite, non-boolean, positive, and not expired)
    exp = payload.get("exp")
    if exp is None or isinstance(exp, bool) or not isinstance(exp, (int, float)):
        return None
    if math.isnan(exp) or math.isinf(exp) or exp <= 0:
        return None
    if time.time() > exp:
        return None

    # Issued-at validation (must be present, numeric, finite, non-boolean, positive, and not in future)
    iat = payload.get("iat")
    if iat is None or isinstance(iat, bool) or not isinstance(iat, (int, float)):
        return None
    if math.isnan(iat) or math.isinf(iat) or iat <= 0:
        return None
    if iat > time.time() + 60:
        return None

    # Server-side atomic consumption
    if db is not None:
        from ..db.models import ConsumedStreamTicket
        ticket_hash = hashlib.sha256(ticket.encode("utf-8")).hexdigest()

        # Check if already consumed
        already_consumed = (
            db.query(ConsumedStreamTicket)
            .filter(ConsumedStreamTicket.ticket_hash == ticket_hash)
            .first()
        )
        if already_consumed:
            return None

        consumed_record = ConsumedStreamTicket(
            ticket_hash=ticket_hash,
            user_id=sub,
            session_id=session_id,
            consumed_at=datetime.now(timezone.utc),
            expires_at=int(exp)
        )
        try:
            db.add(consumed_record)
            db.commit()
        except Exception:
            db.rollback()
            return None

    return sub


def verify_consumed_ticket_for_range(ticket: str, session_id: str, db: Optional[Any] = None) -> Optional[str]:
    """
    Validates an already-consumed stream ticket for subsequent HTTP Range requests (seeking/scrubbing)
    originating from an active HTML5 video playback session.
    Guarantees:
    - Ticket has valid HMAC-SHA256 signature
    - Safe JSON decoding without unhandled exceptions
    - scope strictly equals 'media_stream'
    - sid strictly equals session_id
    - sub (user_id) is non-empty string
    - Ticket has not expired (now <= exp)
    - Ticket was previously verified and atomically consumed in consumed_stream_tickets
    Returns authenticated user_id if valid active streaming session, else None.
    """
    if not ticket or not isinstance(ticket, str) or db is None:
        return None

    parts = ticket.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, signature_b64 = parts
    expected_sig = hmac.new(
        get_secret_key().encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256
    ).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        return None

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    if payload.get("scope") != "media_stream":
        return None

    sid = payload.get("sid")
    if not sid or sid != session_id:
        return None

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str) or not sub.strip():
        return None

    exp = payload.get("exp")
    if exp is None or isinstance(exp, bool) or not isinstance(exp, (int, float)):
        return None
    if math.isnan(exp) or math.isinf(exp) or exp <= 0 or time.time() > exp:
        return None

    from ..db.models import ConsumedStreamTicket
    ticket_hash = hashlib.sha256(ticket.encode("utf-8")).hexdigest()
    consumed_record = (
        db.query(ConsumedStreamTicket)
        .filter(
            ConsumedStreamTicket.ticket_hash == ticket_hash,
            ConsumedStreamTicket.session_id == session_id,
            ConsumedStreamTicket.user_id == sub
        )
        .first()
    )
    if not consumed_record:
        return None

    if time.time() > consumed_record.expires_at:
        return None

    return sub


def cleanup_expired_consumed_tickets(db: Any) -> int:
    """
    Removes expired consumed-ticket records from database.
    Safe maintenance utility to prevent table bloat.
    """
    if db is None:
        return 0
    from ..db.models import ConsumedStreamTicket
    now = int(time.time())
    try:
        deleted = (
            db.query(ConsumedStreamTicket)
            .filter(ConsumedStreamTicket.expires_at < now)
            .delete(synchronize_session=False)
        )
        db.commit()
        return deleted
    except Exception:
        db.rollback()
        return 0


def create_password_reset_token(user_id: str, email: str, expires_minutes: int = 30) -> str:
    """Creates a short-lived signed JWT for secure password recovery."""
    data = {
        "sub": user_id,
        "email": email,
        "purpose": "password_reset"
    }
    return create_access_token(data, expires_delta=timedelta(minutes=expires_minutes))


def decode_password_reset_token(token: str, db: Optional[Any] = None) -> Optional[Dict[str, Any]]:
    """Verifies a password reset token, ensuring purpose matches and token is not revoked."""
    claims = decode_access_token(token, db=db)
    if not claims:
        return None
    if claims.get("purpose") != "password_reset":
        return None
    return claims
