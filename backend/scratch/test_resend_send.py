import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv('RESEND_API_KEY')

print(f"Testing primary send from info@musbresearch.com...")

try:
    res = resend.Emails.send({
        "from": "info@musbresearch.com",
        "to": "info@musbresearch.com",
        "subject": "Verification Test",
        "html": "<strong>Testing domain verification status.</strong>"
    })
    print(f"Success! ID: {res['id']}")
except Exception as e:
    print(f"Failed: {e}")
