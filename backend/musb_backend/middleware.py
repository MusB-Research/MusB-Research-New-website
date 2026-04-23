import time
import sys
import io

# Force stdout to UTF-8 so emoji/unicode characters don't crash on Windows cp1252
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

class TimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time
        duration_ms = int(duration * 1000)

        # Determine prefix based on speed (no emoji — Windows cp1252 safe)
        if duration_ms > 800:
            prefix = "[CRITICAL]"
        elif duration_ms > 200:
            prefix = "[SLOW]"
        else:
            prefix = "[FAST]"

        # Only print for API routes to avoid console spam
        if getattr(request, 'path', '').startswith('/api/'):
            try:
                print(f"{prefix} {request.method} {request.path} took {duration_ms}ms")
            except Exception:
                pass  # Never crash a request due to logging

        # Add a custom header to the response for observability
        response['X-Request-Duration-MS'] = str(duration_ms)

        return response
