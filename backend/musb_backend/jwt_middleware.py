import jwt
import requests
from django.http import JsonResponse
from django.core.cache import cache

PUBLIC_KEY_URL = (
    "https://musb-research-vct.vercel.app/api/auth/public-key"
)

# Public routes — no token needed
PUBLIC_PATHS = [
    "/",
    "/studies",
    "/api/studies",
    "/api/home",
    "/api/news",
    "/api/capabilities",
    "/api/facilities",
    "/api/team",
    "/api/about",
    "/api/innovation",
    "/api/contact/settings",
    "/api/contact/form-config",
    "/api/contact/inquiry-types",
    "/auth/callback",
    "/favicon.ico",
    "/static",
]

def get_public_key():
    # Cache public key for 1 hour
    cached = cache.get("jwt_public_key")
    if cached:
        return cached
    try:
        res = requests.get(PUBLIC_KEY_URL, timeout=5)
        key = res.json()["public_key"]
        cache.set("jwt_public_key", key, 3600)
        return key
    except Exception:
        return None

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip public routes
        if any(
            request.path.startswith(p) 
            for p in PUBLIC_PATHS
        ):
            return self.get_response(request)

        # Get token from header or localStorage
        auth_header = request.headers.get(
            "Authorization", ""
        )
        token = auth_header.replace("Bearer ", "").strip()

        if not token:
            return JsonResponse(
                {"error": "Unauthorized — No token"}, 
                status=401
            )

        try:
            public_key = get_public_key()
            if not public_key:
                return JsonResponse(
                    {"error": "Auth service unavailable"}, 
                    status=503
                )

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"]
            )

            modules = payload.get("modules", [])
            role = payload.get("role", "")

            # Allow SUPER_ADMIN full access
            # Allow ADMIN if MAIN in modules
            if role == "SUPER_ADMIN" or "MAIN" in modules:
                request.user_payload = payload
                request.user_role = role
                return self.get_response(request)
            else:
                return JsonResponse(
                    {"error": "No access to MAIN module"},
                    status=403
                )

        except jwt.ExpiredSignatureError:
            return JsonResponse(
                {"error": "Token expired"}, 
                status=401
            )
        except jwt.InvalidTokenError as e:
            return JsonResponse(
                {"error": f"Invalid token: {str(e)}"}, 
                status=401
            )
        except Exception as e:
            return JsonResponse(
                {"error": "Auth error"}, 
                status=500
            )
