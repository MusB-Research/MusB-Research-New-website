import os
import django
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def get_condition(title, description):
    t = title or ""
    d = description or ""
    title_lower = t.lower()
    text = (t + " " + d).lower()
    
    # Explicit mapping for known studies
    if 'beat the bloat' in title_lower: return 'Gut Health'
    if 'vital-age' in title_lower: return 'Aging'
    if 'sam study' in title_lower: return 'Women’s Health'
    if 'shine study' in title_lower: return 'Women’s Health'
    
    # Keyword based mapping
    if any(kw in text for kw in ['brain', 'cognitive', 'memory', 'neuro', 'focus']):
        return 'Brain Health'
    elif any(kw in text for kw in ['cancer', 'oncology', 'tumor']):
        return 'Cancer Support'
    elif any(kw in text for kw in ['metabolic', 'sugar', 'weight', 'obesity', 'diabetes', 'insulin', 'lipid']):
        return 'Metabolic Health'
    elif any(kw in text for kw in ['age', 'aging', 'longevity', 'vitality']):
        return 'Aging'
    elif any(kw in text for kw in ['women', 'menopause', 'female', 'hormon']):
        return 'Women’s Health'
    elif any(kw in text for kw in ['gut', 'bloat', 'digestion', 'microbiome', 'probiotic', 'leaky', 'bowel', 'ibs']):
        return 'Gut Health'
    
    # Keep existing if it's already one of the valid ones
    return None

updated_count = 0
for study in Study.objects.all():
    new_cond = get_condition(study.title, study.description)
    if new_cond:
        study.condition = new_cond
        study.save()
        updated_count += 1
        print(f"Updated '{study.title}' to {new_cond}")
    elif study.condition not in ['Gut Health', 'Brain Health', 'Metabolic Health', 'Aging', 'Women’s Health', 'Cancer Support']:
        # If no keywords matched and current condition is invalid, set to Gut Health as fallback so it doesn't disappear if they want it categorized.
        # Actually better to set it to 'Other' and if frontend doesn't show 'Other', they need to adjust.
        # Front end has filters for: 'Gut Health', 'Brain Health', 'Metabolic Health', 'Aging', 'Women’s Health', 'Cancer Support' and 'All'
        # Let's set to 'Gut Health' for testing if it's completely unknown, but realistically we'll just leave it if we don't know.
        pass

print(f"Total updated: {updated_count}")
