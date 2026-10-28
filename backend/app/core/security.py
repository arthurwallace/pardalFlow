import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt
try:
    import bcrypt
except ImportError:
    bcrypt = None

from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a password using bcrypt if available, with PBKDF2-HMAC-SHA256 fallback."""
    if bcrypt:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    else:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return f"pbkdf2${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a password against its hash."""
    if not hashed_password:
        return False
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        if bcrypt:
            try:
                return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
            except Exception:
                return False
        return False
    elif hashed_password.startswith("pbkdf2$"):
        try:
            parts = hashed_password.split("$")
            salt = bytes.fromhex(parts[1])
            expected_key = parts[2]
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
            return hmac.compare_digest(key.hex(), expected_key)
        except Exception:
            return False
    return False

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Generates a JWT access token for a given user subject."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict | None:
    """Decodes and validates a JWT access token."""
    try:
        decoded_payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return decoded_payload
    except (jwt.PyJWTError, Exception):
        return None

def verify_access_token(token: str) -> str | None:
    payload = decode_access_token(token)
    if payload and 'sub' in payload:
        return payload['sub']
    return None
