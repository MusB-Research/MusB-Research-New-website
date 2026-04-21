import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv('RESEND_API_KEY')

print(f"Using API Key: {resend.api_key[:10]}...")

try:
    domains = resend.Domains.list()
    print("\nVerified Domains:")
    if not domains:
        print("No domains found.")
    else:
        for domain in domains:
            print(f"- {domain['name']} (Status: {domain['status']})")
except Exception as e:
    print(f"Error listing domains: {e}")
