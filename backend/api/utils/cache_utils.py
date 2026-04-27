import json
from django.core.cache import cache
from django.db.models.query import QuerySet
from rest_framework.response import Response
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def cache_api_response(key_prefix, timeout=300):
    """
    Decorator to cache API responses.
    Cache key includes user_id + query params so each user/filter combo is cached independently.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(*args, **kwargs):
            # args[0] is self for methods, or request for functions
            request = args[1] if len(args) > 1 and hasattr(args[1], 'user') else args[0]

            # Fallback for ViewSets where request is on self
            if not hasattr(request, 'user') and hasattr(args[0], 'request'):
                request = args[0].request

            import hashlib
            params = json.dumps(dict(request.GET), sort_keys=True)
            params_hash = hashlib.md5(params.encode()).hexdigest()

            # Identify the user (or use 'anonymous' for public data)
            user_id = 'anonymous'
            role = 'anon'
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_id = str(request.user.id)
                role = (getattr(request.user, 'role', None) or 'user').lower()

            # Include role so different role tiers see their own cached slice
            cache_key = f"{key_prefix}:{role}:{user_id}:{params_hash}"

            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.info(f"Cache HIT  → {cache_key}")
                return Response(cached_data)

            response = view_func(*args, **kwargs)

            if response.status_code == 200:
                logger.info(f"Cache MISS → {cache_key} (stored for {timeout}s)")
                cache.set(cache_key, response.data, timeout)

            return response
        return _wrapped_view
    return decorator


def invalidate_cache(key_prefix, user_id=None):
    """
    Invalidates cache for a given key prefix.
    Uses delete_pattern when the backend supports it (django-redis).
    Falls back to clearing the whole cache in DEBUG mode if pattern deletion isn't supported.
    """
    from django.conf import settings
    try:
        if user_id:
            pattern = f"{key_prefix}:*:{user_id}:*"
        else:
            # Bust every role/user combination for this prefix
            pattern = f"{key_prefix}:*"

        if hasattr(cache, 'delete_pattern'):
            count = cache.delete_pattern(pattern)
            logger.info(f"Cache INVALIDATED: {pattern} ({count} keys removed)")
        elif settings.DEBUG:
            # Fallback for LocMemCache during local development
            cache.clear()
            logger.info(f"Cache CLEAR (Full): pattern deletion not supported, clearing all for DEBUG mode.")
        else:
            # Standard backends (FileCache etc) in production without redis
            logger.warning(f"Cache backend does not support delete_pattern. TTL expiry will handle: {pattern}")

    except Exception as e:
        logger.error(f"Cache invalidation failed for {key_prefix}: {e}")
