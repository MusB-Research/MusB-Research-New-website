import logging
from rest_framework import authentication, exceptions
from .security import decode_access_token
from .models import User, TokenBlacklist

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for Django REST Framework that reads
    the 'access_token' from HttpOnly cookies.
    """
    def authenticate(self, request):
        # 1. Get token from cookie
        access_token = request.COOKIES.get('access_token')

        # 2. Fallback to Authorization header
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG AUTH: access_token_cookie={access_token != None}, auth_header={auth_header}")
        if not access_token and auth_header and auth_header.startswith('Bearer '):
            access_token = auth_header.split(' ')[1]

        if not access_token:
            print("DEBUG AUTH: No access token found. Returning None.")
            return None

        try:
            # 3. Decode and verify token
            payload = decode_access_token(access_token)

            # 4. Check if token is blacklisted
            if TokenBlacklist.is_blacklisted(payload.get('jti', '')):
                logger.debug("Token blacklisted for %s", payload.get('email'))
                return None # Simply do not authenticate

            # 5. Fetch user
            user = User.objects.filter(email=payload['email']).first()
            if not user or not user.is_active:
                logger.debug("User not found or deactivated: %s", payload.get('email'))
                return None # Simply do not authenticate

            logger.debug("Auth success for %s (role: %s)", user.email, user.role)
            return (user, None)

        except Exception as e:
            logger.error(f"Auth error decoding token: {str(e)}")
            import traceback
            traceback.print_exc()
            # Re-raise authentication failed exceptions
            if isinstance(e, exceptions.AuthenticationFailed):
                raise e
            # Ignore other decoding errors (they result in 401 anyway)
            return None
