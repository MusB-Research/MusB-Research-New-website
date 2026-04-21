"""
One-time cleanup script: strips HTML tags, comments, and MS Word clipboard artifacts
from all existing News records in the database.

Run with:
  py -3.11 manage.py shell < backend/scripts/clean_news_content.py
OR:
  py -3.11 -c "exec(open('backend/scripts/clean_news_content.py').read())"
  (from backend/ directory with django set up)
"""
import os
import sys
import django

# ---- Bootstrap Django if run standalone ----
if 'django' not in sys.modules or not django.apps.apps.ready:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
    django.setup()

import re
from api.models import News

# ---- HTML cleaning pipeline ----

# 1. MS Word / clipboard comments: <!--StartFragment--> <!--EndFragment--> etc.
_HTML_COMMENTS = re.compile(r'<!--[\s\S]*?-->', re.IGNORECASE)

# 2. Block-level closing tags → replace with a space to prevent word merging
_BLOCK_CLOSE = re.compile(r'</(p|div|li|br|h[1-6]|blockquote|tr|td|th)[^>]*>', re.IGNORECASE)

# 3. All remaining HTML tags
_ALL_TAGS = re.compile(r'<[^>]+>', re.DOTALL)

# 4. Collapse excessive whitespace (but keep single newlines for paragraphs)
_WHITESPACE = re.compile(r'[ \t]{2,}')

# 5. Collapse more than 2 consecutive newlines
_NEWLINES = re.compile(r'\n{3,}')


def clean_html(raw: str) -> str:
    if not isinstance(raw, str) or not raw.strip():
        return raw
    text = _HTML_COMMENTS.sub('', raw)
    text = _BLOCK_CLOSE.sub('\n', text)
    text = _ALL_TAGS.sub('', text)
    text = _WHITESPACE.sub(' ', text)
    text = _NEWLINES.sub('\n\n', text)
    return text.strip()


# ---- Run cleanup ----

news_qs = News.objects.all()
total = news_qs.count()
updated = 0

print(f"\nFound {total} news records to scan...\n")

for article in news_qs:
    dirty = False
    
    original_title = article.title or ''
    clean_title = clean_html(original_title)
    if clean_title != original_title:
        article.title = clean_title
        dirty = True
        print(f"  [TITLE]   #{article.id}: {original_title[:60]!r} → {clean_title[:60]!r}")

    original_content = article.content or ''
    clean_content = clean_html(original_content)
    if clean_content != original_content:
        article.content = clean_content
        dirty = True
        print(f"  [CONTENT] #{article.id}: stripped HTML from content (len {len(original_content)} → {len(clean_content)})")

    if hasattr(article, 'excerpt'):
        original_excerpt = article.excerpt or ''
        clean_excerpt = clean_html(original_excerpt)
        if clean_excerpt != original_excerpt:
            article.excerpt = clean_excerpt
            dirty = True
            print(f"  [EXCERPT] #{article.id}: stripped HTML from excerpt")

    if dirty:
        try:
            article.save(update_fields=[f for f in ['title', 'content', 'excerpt'] if hasattr(article, f)])
            updated += 1
        except Exception as e:
            print(f"  [ERROR]   #{article.id}: {e}")

print(f"\n✅ Done: cleaned {updated} / {total} records.\n")
