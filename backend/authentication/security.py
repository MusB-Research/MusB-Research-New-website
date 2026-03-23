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

# Global cache for expensive crypto objects
_CIPHER_CACHE = None
_PRIVATE_KEY_CACHE = None
_PUBLIC_KEY_CACHE = None

def get_all_ciphers():
    """Returns a list of potential ciphers to try for decryption, cached for performance."""
    global _CIPHER_CACHE
    if _CIPHER_CACHE is not None:
        return _CIPHER_CACHE

    ciphers = []
    
    # 1. Main explicit encryption key
    explicit_key = os.getenv('DATA_ENCRYPTION_KEY')
    if explicit_key:
        try:
            # Ensure it is bytes before calling Fernet
            key_bytes = explicit_key.encode() if isinstance(explicit_key, str) else explicit_key
            ciphers.append(Fernet(key_bytes))
        except:
            pass
            
    # 2. Secret Key Fallback
    try:
        fallback_key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'0'))
        ciphers.append(Fernet(fallback_key))
    except:
        pass

    # 3. Default fallback if .env is missing and secret is default
    try:
        default_secret = 'django-insecure-%s_3@h)4+#%gs%)nm@xvwar%j!9e38oa_5j#m2w+0j_mblj78g'
        default_key = base64.urlsafe_b64encode(default_secret[:32].encode().ljust(32, b'0'))
        ciphers.append(Fernet(default_key))
    except:
        pass
        
    _CIPHER_CACHE = ciphers
    return ciphers


def encrypt_data(data: str) -> str:
    if not data or not isinstance(data, str) or data.startswith('gAAAA'):
        return data
        
    explicit_key = os.getenv('DATA_ENCRYPTION_KEY')
    key = explicit_key.encode() if explicit_key else base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'0'))
    
    try:
        return Fernet(key).encrypt(data.encode()).decode()
    except:
        return data


def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data or not isinstance(encrypted_data, str) or not encrypted_data.startswith('gAAAA'):
        return encrypted_data
        
    # Attempt all possible ciphers
    for cipher in get_all_ciphers():
        try:
            return cipher.decrypt(encrypted_data.encode()).decode()
        except Exception:
            continue
            
    return encrypted_data  # Legacy plain-text fallback or failed decryption


# ─────────────────────────────────────────────────────────
#  RSA Key Pair — RS256 JWT signing / verification
# ─────────────────────────────────────────────────────────

def get_private_key() -> bytes:
    global _PRIVATE_KEY_CACHE
    if _PRIVATE_KEY_CACHE: return _PRIVATE_KEY_CACHE

    # Fallback to Env Var
    env_key = os.getenv('JWT_PRIVATE_KEY')
    if env_key:
        _PRIVATE_KEY_CACHE = env_key.replace('\\n', '\n').encode()
        return _PRIVATE_KEY_CACHE
    
    try:
        with open(os.path.join(settings.BASE_DIR, 'private_key.pem'), 'rb') as f:
            _PRIVATE_KEY_CACHE = f.read()
            return _PRIVATE_KEY_CACHE
    except:
        # Emergency fallback to secret key based derivation if files are missing
        return settings.SECRET_KEY.encode()


def get_public_key() -> bytes:
    global _PUBLIC_KEY_CACHE
    if _PUBLIC_KEY_CACHE: return _PUBLIC_KEY_CACHE

    # Fallback to Env Var
    env_key = os.getenv('JWT_PUBLIC_KEY')
    if env_key:
        _PUBLIC_KEY_CACHE = env_key.replace('\\n', '\n').encode()
        return _PUBLIC_KEY_CACHE

    try:
        with open(os.path.join(settings.BASE_DIR, 'public_key.pem'), 'rb') as f:
            _PUBLIC_KEY_CACHE = f.read()
            return _PUBLIC_KEY_CACHE
    except:
        return settings.SECRET_KEY.encode()


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
        'affiliation': getattr(user, 'affiliation', 'musb'),
        'status': getattr(user, 'status', 'active'),
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
