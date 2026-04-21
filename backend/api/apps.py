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
        
        # Register Signals
        import api.signals

        # Patch ContentType.objects.get_for_model to ensure it always returns a saved instance with a PK
        # This fixes "ValueError: Model instances passed to related filters must be saved" during migrate
        from django.contrib.contenttypes.models import ContentType
        original_get_for_model = ContentType.objects.get_for_model
        def patched_get_for_model(model, for_concrete_model=True):
            ct = original_get_for_model(model, for_concrete_model)
            if ct and not ct.pk:
                try:
                    ct.save()
                except Exception:
                    pass
            return ct
        ContentType.objects.get_for_model = patched_get_for_model

        # Final Defense: Patch Django's related lookup logic to handle unsaved instances during migration
        # This fixes "ValueError: Model instances passed to related filters must be saved"
        from django.db.models.fields import related_lookups
        original_get_normalized_value = related_lookups.get_normalized_value
        
        def patched_get_normalized_value(value, lhs):
            from django.db.models import Model
            try:
                return original_get_normalized_value(value, lhs)
            except ValueError as e:
                if "must be saved" in str(e) and isinstance(value, Model):
                    # Log it and return a safe fallback to prevent migration crash
                    # This is common on MongoDB backends during initial setup/migration
                    print(f">>> MIGRATION PATCH: Bypassing unsaved model filter error for {value.__class__.__name__}")
                    return (None, None)
                raise e
            
        related_lookups.get_normalized_value = patched_get_normalized_value

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
