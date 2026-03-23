from django.core.management.base import BaseCommand
from authentication.models import User
from authentication.security import decrypt_data, encrypt_data
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Reprocesses user PII fields to ensure they are encrypted correctly with the CURRENT key.'

    def handle(self, *args, **options):
        users = User.objects.all()
        count = 0
        self.stdout.write(f"Starting re-synchronization of {len(users)} users...")
        
        for user in users:
            try:
                # Decrypt and re-save. User.save() handles the encryption.
                # Since User.save() has logic to synchronize full_name, we force it here.
                change_detected = False
                
                # Check for double/malformed encryption
                if user.full_name and user.full_name.startswith('gAAAA'):
                    plain = decrypt_data(user.full_name)
                    if plain != user.full_name:
                        # Success decryption
                        logger.info(f"Fixed full_name for {user.email}")
                
                # We basically just need to trigger the save() method logic.
                user.save()
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Processed {count} users...")
            except Exception as e:
                self.stderr.write(f"Failed to process user {user.email}: {str(e)}")
        
        self.stdout.write(self.style.SUCCESS(f"Successfully re-synchronized {count} users."))
