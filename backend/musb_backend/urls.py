from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
from django.utils.timezone import now
from django.db import connections

def api_root(request):
    return JsonResponse({
        "name": "MusB Research API",
        "status": "online",
        "version": "1.2.1",
        "health": "ok"
    })

def health_check(request):
    """
    High-availability health check diagnostic.
    This helps us confirm if the MongoDB user has correct permissions.
    """
    db_status = "connected"
    db_detail = "ok"
    try:
        # Verify direct connectivity and permissions
        connections['default'].ensure_connection()
        db_detail = "MongoDB responding"
    except Exception as e:
        db_status = "disconnected"
        db_detail = str(e)

    # Return 200 for monitor stability, but 'degraded' status if DB fails
    return JsonResponse({
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "detail": db_detail,
        "timestamp": now().isoformat()
    }, status=200)

urlpatterns = [
    path('', api_root),
    path('api/health/', health_check, name='health_check'),
    path('api/health', health_check), # Fallback for monitoring tools
    
    # Technical SEO Endpoints
    path('robots.txt', include('api.seo_urls')),
    path('sitemap.xml', include('api.seo_urls')),
    
    path('admin/', admin.site.urls),
    path('api/careers/', include('careers.urls')),
    path('api/', include('api.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/support/', include('support.urls')),
]

from django.views.static import serve
from django.urls import re_path

# Serve media files in both development and production (required for Render persistent disk)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]

