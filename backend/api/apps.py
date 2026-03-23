from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'api'

    def ready(self):
        # Only run in the main process, not the reloader
        import os
        if os.environ.get('RUN_MAIN') == 'true':
            from django.db import connections
            
            try:
                # Trigger a connection check
                connections['default'].ensure_connection()
                print("\n" + "="*40)
                print(">>> SERVER STATUS: RUNNING on port 8000")
                print(">>> DATABASE STATUS: MongoDB Connected")
                print("="*40 + "\n")
            except Exception as e:
                print("\n" + "!"*40)
                print(f">>> DATABASE ERROR: {e}")
                print("!"*40 + "\n")
