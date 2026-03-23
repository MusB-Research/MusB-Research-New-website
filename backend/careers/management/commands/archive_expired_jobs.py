from django.core.management.base import BaseCommand
from django.utils.timezone import now
from careers.models import JobPosting

class Command(BaseCommand):
    help = 'Automatically archives Job Postings that have passed their expiry date.'

    def handle(self, *args, **options):
        current_date = now().date()
        
        # 1. Archive expired jobs
        expired_jobs = JobPosting.objects.filter(
            status='Active',
            expiry_date__lte=current_date
        )
        
        count = expired_jobs.count()
        if count > 0:
            # Atomic update to Archived status
            expired_jobs.update(status='Archived')
            self.stdout.write(self.style.SUCCESS(f"Successfully archived {count} expired job(s)."))
        else:
            self.stdout.write(self.style.NOTICE("No expired jobs found for archiving."))
