import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import News, Event

news = News.objects.all()
events = Event.objects.all()

print(f"News count: {news.count()}")
for n in news:
    print(f" - News: {n.title} (ID: {n.pk})")

print(f"Events count: {events.count()}")
for e in events:
    print(f" - Event: {e.title} (ID: {e.pk})")
