import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import StaffTask
import json

target_id = "69df33537be56e52ae11624c"

tasks = StaffTask.objects.filter(reference_id=target_id)
print(f"Tasks referencing {target_id}: {tasks.count()}")
for t in tasks:
    print(f"Task: {t.title}, Type: {t.task_type}, ID: {t.id}")

# Also check if it's a StaffTask ID itself
try:
    st = StaffTask.objects.filter(pk=target_id).first()
    if st:
        print(f"Found as StaffTask PK: {st.title}, Ref: {st.reference_id}")
except:
    pass
