from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'api'

    def ready(self):
        # Broad Patch for Django's QuerySet.bulk_create for Permission model compatibility with MongoDB
        from django.db.models.query import QuerySet
        from django.contrib.auth.models import Permission
        
        original_bulk_create = QuerySet.bulk_create
        
        def patched_bulk_create(self, objs, **kwargs):
            # Check if this queryset belongs to the Permission model or ContentType model
            if self.model is Permission or self.model.__name__ == 'Permission':
                try:
                    return original_bulk_create(self, objs, **kwargs)
                except Exception as e:
                    # Fallback to individual saves if bulk_create fails on MongoDB (usually content_type integrity)
                    created_objs = []
                    for obj in objs:
                        try:
                            ct = getattr(obj, 'content_type', None)
                            if ct and not ct.pk:
                                try:
                                    ct.save(using=self._db)
                                except:
                                    pass
                            
                            if ct and ct.pk:
                                obj.save(using=self._db)
                                created_objs.append(obj)
                        except Exception:
                            pass
                    return created_objs
            return original_bulk_create(self, objs, **kwargs)
        
        QuerySet.bulk_create = patched_bulk_create

        # Proactive ContentType Sync to prevent IntegrityError in MongoDB migration
        import sys
        if 'migrate' in sys.argv:
            try:
                from django.contrib.contenttypes.models import ContentType
                from django.apps import apps
                for app_config in apps.get_app_configs():
                    for model in app_config.get_models():
                        ContentType.objects.get_for_model(model)
            except:
                pass

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
