import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv('RESEND_API_KEY')

print(f"Testing primary send from info@musbhealth.com...")

try:
    res = resend.Emails.send({
        "from": "info@musbhealth.com",
        "to": "info@musbresearch.com",
        "subject": "Verification Test (Alternative Domain)",
        "html": "<strong>Testing musbhealth.com status.</strong>"
    })
    print(f"Success! ID: {res['id']}")
except Exception as e:
    print(f"Failed: {e}")
