import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Consent, AssignedForm
import bson

target_id = "69df33537be56e52ae11624c"

print(f"Checking ID: {target_id}")

try:
    c = Consent.objects.filter(pk=target_id).first()
    if c:
        print(f"Found in Consent: {c}")
    else:
        print("Not found in Consent")
except Exception as e:
    print(f"Error checking Consent: {e}")

try:
    af = AssignedForm.objects.filter(pk=target_id).first()
    if af:
        print(f"Found in AssignedForm: {af}")
    else:
        print("Not found in AssignedForm")
except Exception as e:
    print(f"Error checking AssignedForm: {e}")
