# Backend Caching Strategy for MusB Portal
# Add this to settings.py or create a separate config file

CACHE_TIMEOUT_CONFIG = {
    'studies_list': 300,           # 5 minutes - Studies change infrequently
    'participants_list': 120,      # 2 minutes - Participants data 
    'dashboard_summary': 60,       # 1 minute - Dashboard data
    'user_profile': 3600,          # 1 hour - User profile rarely changes
    'notifications': 30,           # 30 seconds - Notifications need to be fresher
    'visits_schedule': 300,        # 5 minutes - Visit schedule
    'compensation': 600,           # 10 minutes - Compensation data
    'lab_results': 300,            # 5 minutes - Lab results
}

# Required cache backends in Django settings.py:
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'redis.Redis',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'POOL_CLASS': 'redis.connection.BlockingConnectionPool',
            'CONNECTION_POOL_CLASS_KWARGS': {
                'max_connections': 50,
                'timeout': 20,
            }
        },
        'KEY_PREFIX': 'musb',
        'TIMEOUT': 300,  # Default 5 minutes
    }
}

# QuerySet optimization helpers
from django.views.decorators.cache import cache_result

def cached_query(timeout=300):
    """
    Decorator to cache Django QuerySet results
    Usage: @cached_query(timeout=60)
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}_{str(args)}_{str(kwargs)}"
            result = cache.get(cache_key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator
