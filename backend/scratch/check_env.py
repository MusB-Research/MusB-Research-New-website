import os
from dotenv import load_dotenv

load_dotenv(override=True)
print(f"RESEND_API_KEY: {os.getenv('RESEND_API_KEY')[:10]}...")
print(f"ADMIN_EMAIL: {os.getenv('ADMIN_EMAIL')}")
print(f"Default from settings: {os.getenv('ADMIN_EMAIL', 'info@musbresearch.com')}")
