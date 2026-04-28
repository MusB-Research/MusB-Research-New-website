import time
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class RequestTimingMiddleware:
    """
    Middleware to track and log the time taken for each request.
    Outputs to both the system console and adds an X-Request-Duration header.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start the clock
        start_time = time.time()
        
        # Process the request
        response = self.get_response(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Format the log message for better terminal visibility
        log_message = f"⏱️  [TIMING] {request.method} {request.path} completed in {duration:.4f}s"
        
        # Alert if the request is particularly slow (> 1 second)
        if duration > 1.0:
            log_message = f"⚠️  [SLOW REQUEST] {request.method} {request.path} took {duration:.4f}s"
            logger.warning(log_message)
        else:
            logger.info(log_message)
            
        # Print directly to stdout for immediate developer visibility in the runserver terminal
        # This is useful because logger levels might be silenced in dev configurations
        # print(f"\n{log_message}\n")
        
        # Add a custom header so the developer can see it in Browser Network Tab
        response['X-Request-Duration'] = f"{duration:.4f}s"
        
        return response
