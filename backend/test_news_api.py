"""Grab raw 500 response body."""
import urllib.request, urllib.error, json

BASE = 'http://127.0.0.1:8000'

# Login
with urllib.request.urlopen(urllib.request.Request(
    f'{BASE}/api/auth/login/',
    data=json.dumps({'email': 'dryadav@musbresearch.com', 'password': 'Admin@123456'}).encode(),
    headers={'Content-Type': 'application/json'},
), timeout=5) as r:
    token = json.loads(r.read())['access']
    print('[Login] OK')

BOUNDARY = 'mXBOUND0RY'
def mp(name, value):
    return f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'

body = (
    mp('title', 'Live API Test')
    + mp('content', 'Test content body')
    + mp('is_success_story', 'false')
    + f'--{BOUNDARY}--\r\n'
).encode()

news_req = urllib.request.Request(
    f'{BASE}/api/news/', data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={BOUNDARY}', 'Authorization': f'Bearer {token}'},
)
try:
    with urllib.request.urlopen(news_req, timeout=5) as r:
        print('[News POST] OK:', json.loads(r.read()))
except urllib.error.HTTPError as e:
    raw = e.read().decode('utf-8', errors='replace')
    # write to file for inspection
    with open('error_500.html', 'w', encoding='utf-8') as f:
        f.write(raw)
    print(f'[News POST] FAILED {e.code} - saved to error_500.html')
    # Also print first 2000 chars
    print(raw[:2000])
