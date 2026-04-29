import os
import resend
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('RESEND_API_KEY')
print(f"API Key: {api_key[:10]}...")

resend.api_key = api_key

try:
    params = {
        "from": "onboarding@resend.dev",
        "to": ["info@musbresearch.com"],
        "subject": "Resend Test",
        "text": "This is a test email from the MusB backend."
    }
    r = resend.Emails.send(params)
    print(f"Response: {r}")
except Exception as e:
    print(f"Error: {e}")
