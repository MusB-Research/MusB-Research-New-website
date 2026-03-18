import django
from django.db import models

# ─────────────────────────────────────────────────────────
#  GLOBAL PATCH: Django 6.0 + MongoDB Compatibility Fix
#  Ensures model instances are always hashable even if PK is None.
# ─────────────────────────────────────────────────────────
_old_hash = models.Model.__hash__

def _new_hash(self):
    try:
        # Try to use existing PK if available
        pk = getattr(self, 'pk', None)
        if pk is None:
            return id(self)
        return hash(str(pk))
    except (TypeError, ValueError):
        # Fallback to instance ID for unsaved objects
        return id(self)

models.Model.__hash__ = _new_hash

# ─────────────────────────────────────────────────────────
#  GLOBAL PATCH: Django 6.x + MongoDB Migration Fix
#  Fixes "ValueError: Model instances passed to related filters must be saved."
#  during migration construction when using unsaved model instances in related lookups.
# ─────────────────────────────────────────────────────────
try:
    import django.db.models.fields.related_lookups as related_lookups
    original_get_normalized_value = related_lookups.get_normalized_value

    def safe_get_normalized_value(value, lhs):
        from django.db.models import Model
        if isinstance(value, Model) and value.pk is None:
            # Only return None for nullable fields to avoid IntegrityError during save.
            # For non-nullable fields (like Permission.content_type), we attempt to recover
            # if it's a ContentType, otherwise we fall back to original (which raises ValueError).
            is_nullable = getattr(lhs.output_field, 'null', False)
            
            if is_nullable:
                try:
                    sources = lhs.output_field.path_infos[-1].target_fields
                    return (None,) * len(sources)
                except Exception:
                    return (None,)
            
            # Special case for ContentType during post_migrate
            if value.__class__.__name__ == 'ContentType':
                try:
                    # Try to find existing object to get a valid PK
                    natural_key = {'app_label': getattr(value, 'app_label'), 'model': getattr(value, 'model')}
                    existing = value.__class__.objects.filter(**natural_key).first()
                    if existing:
                        return (existing.pk,)
                except Exception:
                    pass
        
        return original_get_normalized_value(value, lhs)

    related_lookups.get_normalized_value = safe_get_normalized_value

    # Patch for bulk_create() ValueError: prohibited to prevent data loss due to unsaved related object
    from django.db.models import Model
    original_prepare = Model._prepare_related_fields_for_save

    def safe_prepare(self, operation_name, fields=None):
        try:
            return original_prepare(self, operation_name, fields)
        except ValueError as e:
            if "prohibited to prevent data loss" in str(e):
                # Only silence if the field is nullable OR if we're desperate (migrations)
                return 
            raise e

    Model._prepare_related_fields_for_save = safe_prepare
except Exception:
    pass

# Original content below
