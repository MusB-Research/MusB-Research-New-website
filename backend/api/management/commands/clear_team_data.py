from django.core.management.base import BaseCommand
from api.models import TeamMember, Advisor, ClinicalCollaborator, StaffMember, Partner

class Command(BaseCommand):
    help = 'Clears all team-related data from the database'

    def handle(self, *args, **options):
        self.stdout.write('Clearing team data...')
        
        TeamMember.objects.all().delete()
        Advisor.objects.all().delete()
        ClinicalCollaborator.objects.all().delete()
        StaffMember.objects.all().delete()
        Partner.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Successfully cleared all team-related data.'))
