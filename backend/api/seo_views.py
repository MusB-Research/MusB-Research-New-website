from django.http import HttpResponse
from django.utils.timezone import now
from .models import Study, News, Event
from careers.models import JobPosting

def robots_txt(request):
    """Serve robots.txt directly."""
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/auth/
Disallow: /dashboard/participant/settings/
Sitemap: https://www.musbhealth.com/sitemap.xml
"""
    return HttpResponse(content, content_type="text/plain")

def sitemap_xml(request):
    """Generate a dynamic XML sitemap."""
    base_url = "https://www.musbhealth.com"
    static_routes = [
        "/", "/about", "/contact", "/innovations", "/news", "/careers", 
        "/facilities", "/trials", "/support", "/why-choose-us", 
        "/capabilities", "/mellow-consortium"
    ]
    
    # Dashboard marketing landing pages (public side)
    portal_routes = [
        "/participant-portal", "/pi-dashboard", "/coordinator-portal", "/sponsor-portal"
    ]

    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # 1. Static Routes
    for route in static_routes + portal_routes:
        xml.append(f'  <url><loc>{base_url}{route}</loc><lastmod>{now().date().isoformat()}</lastmod><priority>0.8</priority></url>')

    # 2. Dynamic Studies
    for study in Study.objects.filter(approval_status='approved', is_archived=False):
        xml.append(f'  <url><loc>{base_url}/studies/{study.protocol_id}</loc><lastmod>{study.updated_at.date().isoformat()}</lastmod><priority>0.9</priority></url>')

    # 3. Dynamic News
    for news_item in News.objects.all():
        xml.append(f'  <url><loc>{base_url}/news/{news_item.id}</loc><lastmod>{news_item.created_at.date().isoformat()}</lastmod><priority>0.7</priority></url>')

    # 4. Dynamic Careers
    for job in JobPosting.objects.filter(status='Active'):
        xml.append(f'  <url><loc>{base_url}/careers/{job.id}</loc><lastmod>{now().date().isoformat()}</lastmod><priority>0.7</priority></url>')

    xml.append('</urlset>')
    return HttpResponse("\n".join(xml), content_type="application/xml")
