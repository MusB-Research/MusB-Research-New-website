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

            import hashlib
            params = json.dumps(request.GET, sort_keys=True)
            params_hash = hashlib.md5(params.encode()).hexdigest()
            
            # Identify the user (or use 'anonymous' for public data)
            user_id = 'anonymous'
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_id = str(request.user.id)
                
            cache_key = f"{key_prefix}:{user_id}:{params_hash}"

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
    Supports granular user-level invalidation or global pattern clearing.
    """
    try:
        if user_id:
            # Targeted invalidation for a specific user
            pattern = f"{key_prefix}:{user_id}:*"
        else:
            # Global invalidation for all versions of this data
            pattern = f"{key_prefix}:*"
            
        if hasattr(cache, 'delete_pattern'):
            count = cache.delete_pattern(pattern)
            logger.info(f"Invalidated cache for {pattern} ({count} keys removed)")
        else:
            # Fallback for standard cache backends
            logger.warning(f"Cache backend does not support pattern deletion. Manual TTL expiry will apply for: {pattern}")
            
    except Exception as e:
        logger.error(f"Failed to invalidate cache for {key_prefix}: {e}")
