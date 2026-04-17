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
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(*args, **kwargs):
            # args[0] is self for methods, or request for functions
            request = args[1] if len(args) > 1 and hasattr(args[1], 'user') else args[0]
            
            # If still not found or doesn't have user, try to get from self.request (for ViewSets)
            if not hasattr(request, 'user') and hasattr(args[0], 'request'):
                request = args[0].request

            # Generate a unique cache key based on user and parameters
            user_id = request.user.id if request.user.is_authenticated else "anonymous"
            params = json.dumps(request.GET, sort_keys=True)
            cache_key = f"{key_prefix}:{user_id}:{hash(params)}"

            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info(f"Cache hit for {cache_key}")
                return Response(cached_data)

            response = view_func(*args, **kwargs)
            
            if response.status_code == 200:
                logger.info(f"Caching response for {cache_key}")
                cache.set(cache_key, response.data, timeout)
            
            return response
        return _wrapped_view
    return decorator

def invalidate_cache(key_prefix, user_id=None):
    """
    Invalidates cache for a specific prefix.
    If user_id is provided, invalidate only for that user.
    Otherwise, we'd need to track keys (redis-style) which is more complex.
    For simplicity, we'll use a versioned or pattern-based approach if needed.
    """
    # Note: django-redis allows deleting by pattern: cache.delete_pattern(f"{key_prefix}:*")
    try:
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(f"{key_prefix}:*")
        else:
            # Fallback if not using django-redis
            pass
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
