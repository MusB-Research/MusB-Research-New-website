import os
import uuid
import hashlib
import datetime
import jwt as pyjwt
from cryptography.fernet import Fernet
from django.conf import settings
import base64

# ─────────────────────────────────────────────────────────
#  Symmetric Encryption (Fernet) — for PII field encryption
# ─────────────────────────────────────────────────────────

def get_cipher():
    key = os.getenv('DATA_ENCRYPTION_KEY')
    if not key:
        key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'0'))
    return Fernet(key)


def encrypt_data(data: str) -> str:
    if not data:
        return data
    return get_cipher().encrypt(data.encode()).decode()


def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data:
        return encrypted_data
    try:
        return get_cipher().decrypt(encrypted_data.encode()).decode()
    except Exception:
        return encrypted_data  # Legacy plain-text fallback


# ─────────────────────────────────────────────────────────
#  RSA Key Pair — RS256 JWT signing / verification
# ─────────────────────────────────────────────────────────

def get_private_key() -> bytes:
    # Fallback to Env Var for deployed environments (Heroku/Vercel/Docker)
    env_key = os.getenv('JWT_PRIVATE_KEY')
    if env_key:
        return env_key.replace('\\n', '\n').encode()
    
    with open(os.path.join(settings.BASE_DIR, 'private_key.pem'), 'rb') as f:
        return f.read()


def get_public_key() -> bytes:
    # Fallback to Env Var for deployed environments
    env_key = os.getenv('JWT_PUBLIC_KEY')
    if env_key:
        return env_key.replace('\\n', '\n').encode()

    with open(os.path.join(settings.BASE_DIR, 'public_key.pem'), 'rb') as f:
        return f.read()


# ─────────────────────────────────────────────────────────
#  Token Helpers
# ─────────────────────────────────────────────────────────

ACCESS_TOKEN_LIFETIME  = datetime.timedelta(hours=8)
REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=30)


def hash_token(token: str) -> str:
    """SHA-256 hash of a token string — safe to store in DB."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_access_token(user) -> str:
    """RS256-signed access token with unique JTI for blacklisting."""
    now = datetime.datetime.utcnow()
    payload = {
        'sub':   str(user.pk),
        'email': user.email,
        'role':  user.role,
        'profile_completed': user.profile_completed,
        'must_change_password': user.must_change_password,
        'iat':   now,
        'exp':   now + ACCESS_TOKEN_LIFETIME,
        'type':  'access',
        'jti':   str(uuid.uuid4()),   # Fix #4 — unique ID per token
    }
    return pyjwt.encode(payload, get_private_key(), algorithm='RS256')


def generate_refresh_token(user) -> tuple[str, str]:
    """
    RS256-signed refresh token with unique JTI.
    Returns (token_string, jti) so the caller can store the JTI in DB.
    """
    now = datetime.datetime.utcnow()
    jti = str(uuid.uuid4())
    payload = {
        'sub':  str(user.pk),
        'iat':  now,
        'exp':  now + REFRESH_TOKEN_LIFETIME,
        'type': 'refresh',
        'jti':  jti,   # Fix #2 — JTI needed for rotation
    }
    token = pyjwt.encode(payload, get_private_key(), algorithm='RS256')
    return token, jti


def decode_access_token(token: str) -> dict:
    """Verify and decode an access token using the RSA public key."""
    return pyjwt.decode(
        token,
        get_public_key(),
        algorithms=['RS256'],
        options={'require': ['exp', 'sub', 'email', 'role', 'jti']},
    )


def decode_refresh_token(token: str) -> dict:
    """Verify and decode a refresh token using the RSA public key."""
    return pyjwt.decode(
        token,
        get_public_key(),
        algorithms=['RS256'],
        options={'require': ['exp', 'sub', 'jti']},
    )
