import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Consent, QuestionnaireScheduleInstance, AssignedForm

def fix_prefix(queryset, field_name):
    count = 0
    for obj in queryset:
        field = getattr(obj, field_name)
        if field and field.name.startswith('media/'):
            field.name = field.name[6:]
            obj.save()
            count += 1
    return count

print(f"Fixed {fix_prefix(Consent.objects.all(), 'signed_pdf')} Consents")
print(f"Fixed {fix_prefix(QuestionnaireScheduleInstance.objects.all(), 'signed_pdf')} Questionnaires")
print(f"Fixed {fix_prefix(AssignedForm.objects.all(), 'signed_pdf')} Forms")
