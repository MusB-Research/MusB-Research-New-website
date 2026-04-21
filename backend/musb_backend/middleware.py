import time
import logging

class TimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        duration_ms = int(duration * 1000)
        
        # Determine prefix and color based on speed
        if duration_ms > 800:
            prefix = "\033[91m🔴 [CRITICAL]\033[0m" # Red
        elif duration_ms > 200:
            prefix = "\033[93m🟡 [SLOW]\033[0m" # Yellow
        else:
            prefix = "\033[92m🟢 [FAST]\033[0m" # Green

        # Only print for API routes to avoid console spam
        if getattr(request, 'path', '').startswith('/api/'):
            print(f"{prefix} {request.method} {request.path} took {duration_ms}ms")
        
        # Add a custom header to the response for observability
        response['X-Request-Duration-MS'] = str(duration_ms)
        
        return response
