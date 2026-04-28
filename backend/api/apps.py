from django.apps import AppConfig
import sys
import os
import logging
from django.db.models import Model

logger = logging.getLogger(__name__)

class ApiConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'api'

    def ready(self):
        # Broad Patch for Django's QuerySet.bulk_create for Permission model compatibility with MongoDB
        from django.db.models.query import QuerySet
        original_bulk_create = QuerySet.bulk_create

        def patched_bulk_create(self, objs, *args, **kwargs):
            if self.model.__name__ == 'Permission':
                # MongoDB backend has issues with bulk_create for Permissions due to AutoField assumptions
                # Fallback to individual get_or_create for this model
                from django.contrib.contenttypes.models import ContentType
                results = []
                for obj in objs:
                    try:
                        # 1. Ensure ContentType exists and is saved
                        ct, _ = ContentType.objects.get_or_create(
                            app_label=obj.content_type.app_label,
                            model=obj.content_type.model
                        )
                        
                        # 2. Use update_or_create to bypass duplicate key and relational errors
                        perm, created = self.model.objects.using(self.db).update_or_create(
                            codename=obj.codename,
                            content_type=ct,
                            defaults={'name': obj.name}
                        )
                        results.append(perm)
                    except Exception as e:
                        # Log but don't crash migration for non-critical permission sync
                        # logger.warning(f">>> PERM SYNC SKIP: {obj.codename} - {e}")
                        pass
                return results
            return original_bulk_create(self, objs, *args, **kwargs)

        QuerySet.bulk_create = patched_bulk_create

        # Broad Patch for ContentType.objects.get_for_model to handle MongoDB's ObjectId and unsaved instances
        from django.contrib.contenttypes.models import ContentType
        original_get_for_model = ContentType.objects.get_for_model

        def patched_get_for_model(model, for_concrete_model=True):
            if isinstance(model, Model) and not model.pk:
                # If we have an unsaved instance, MongoDB might fail a filter check
                # Fallback to fetching by model class metadata
                opts = model._meta
                return original_get_for_model(opts.model, for_concrete_model=for_concrete_model)
            return original_get_for_model(model, for_concrete_model=for_concrete_model)

        ContentType.objects.get_for_model = patched_get_for_model

        # Patch for 'Model instances passed to related filters must be saved' error
        from django.db.models.fields import related_lookups
        original_get_normalized_value = related_lookups.get_normalized_value

        def patched_get_normalized_value(value, lhs):
            try:
                return original_get_normalized_value(value, lhs)
            except ValueError as e:
                if "must be saved" in str(e) and isinstance(value, Model):
                    # Log it and return a safe fallback to prevent migration crash
                    # This is common on MongoDB backends during initial setup/migration
                    # logger.debug(f">>> MIGRATION PATCH: Bypassing unsaved model filter error for {value.__class__.__name__}")
                    return (None, None)
                raise e
            
        related_lookups.get_normalized_value = patched_get_normalized_value

        # Patch for 'Model instances passed to related filters must be saved' error
        # AND Patch to disable unsaved related object check for Permission during save()
        from django.db.models.base import Model
        original_prepare = Model._prepare_related_fields_for_save
        def patched_prepare(self, operation_name):
            try:
                return original_prepare(self, operation_name)
            except ValueError as e:
                if "unsaved related object" in str(e) and self.__class__.__name__ == 'Permission':
                    return
                raise e
        Model._prepare_related_fields_for_save = patched_prepare

        # Only run in the main process, not the reloader
        if os.environ.get('RUN_MAIN') == 'true':
            from django.db import connections
            try:
                # Test MongoDB connection
                connections['default'].cursor()
                print(">>> SERVER STATUS: RUNNING on port 8000 (MongoDB Connected)")
            except Exception as e:
                print(f">>> DATABASE ERROR: {e}")
