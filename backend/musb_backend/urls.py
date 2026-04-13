from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
from django.utils.timezone import now

def api_root(request):
    return JsonResponse({
        "name": "MusB Research API",
        "status": "online",
        "version": "1.2.1",
        "health": "ok"
    })

def health_check(request):
    """
    Enhanced health check that verifies database connectivity.
    This keeps the MongoDB connection pool 'warm' for faster user logins.
    """
    db_ok = True
    try:
        from authentication.models import User
        # Perform a tiny, lightweight query to keep the connection alive
        User.objects.limit(1).exists() 
    except Exception as e:
        db_ok = False
        print(f"Health Check DB Error: {e}")

    return JsonResponse({
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "timestamp": now().isoformat()
    }, status=200 if db_ok else 503)

urlpatterns = [
    path('', api_root),
    path('api/health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/careers/', include('careers.urls')),
    path('api/', include('api.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/support/', include('support.urls')),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
