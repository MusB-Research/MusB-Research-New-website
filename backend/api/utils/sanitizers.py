import html
import re

def sanitize_html(text):
    if not isinstance(text, str):
        return text
    # Basic sanitization: escape HTML characters
    # This prevents XSS by making tags inert
    return html.escape(text)

def strip_dangerous_tags(text):
    if not isinstance(text, str):
        return text
    # Simple regex to remove <script> and other dangerous tags if we want to allow *some* HTML
    # But for now, full escaping is safer as requested.
    return sanitize_html(text)

def sanitize_payload(data):
    """
    Recursively sanitize all string values in a dictionary or list.
    """
    if isinstance(data, dict):
        return {k: sanitize_payload(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_payload(v) for v in data]
    elif isinstance(data, str):
        return sanitize_html(data)
    return data
