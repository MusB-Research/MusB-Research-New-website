"""
Sanitization utilities for API input.

IMPORTANT: These functions strip dangerous HTML tags (XSS prevention) but do NOT
HTML-encode plain text characters like & ' " < > — that would corrupt stored data.
HTML encoding is the *renderer's* job, not the storage layer's job.
"""
import re

# Tags that are always dangerous and must be stripped entirely (including content)
_STRIP_CONTENT_TAGS = re.compile(
    r'<(script|style|svg|iframe|object|embed|form|input|button)[^>]*>.*?</\1>',
    flags=re.IGNORECASE | re.DOTALL
)

# Any remaining HTML tags (strip the tag itself, keep inner text)
_STRIP_TAGS = re.compile(r'<[^>]+>')

# Pattern to find event handlers (onclick=, onerror=, etc.)
_EVENT_HANDLERS = re.compile(r'\bon\w+\s*=\s*["\'][^"\']*["\']', re.IGNORECASE)

# javascript: URIs
_JS_URLS = re.compile(r'javascript\s*:', re.IGNORECASE)


def sanitize_html(text: str) -> str:
    """
    Strip dangerous HTML from user input to prevent XSS.
    Does NOT HTML-encode plain text — stored values remain readable.
    
    Use this on text that will be stored in the database.
    The frontend/template layer should handle display encoding.
    """
    if not isinstance(text, str):
        return text
    
    # 1. Remove script/style/iframe etc. blocks entirely (with their content)
    text = _STRIP_CONTENT_TAGS.sub('', text)
    # 2. Strip remaining HTML tags
    text = _STRIP_TAGS.sub('', text)
    # 3. Strip on* event handlers that might have snuck through
    text = _EVENT_HANDLERS.sub('', text)
    # 4. Strip javascript: URIs
    text = _JS_URLS.sub('', text)
    
    return text.strip()


def strip_dangerous_tags(text: str) -> str:
    """Alias for sanitize_html — strips tags but keeps plain text as-is."""
    return sanitize_html(text)


def sanitize_payload(data):
    """Recursively sanitize all string values in a dict/list."""
    if isinstance(data, dict):
        return {k: sanitize_payload(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_payload(v) for v in data]
    elif isinstance(data, str):
        return sanitize_html(data)
    return data
