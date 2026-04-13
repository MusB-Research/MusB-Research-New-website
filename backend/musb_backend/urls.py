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

from django.db import connections
from django.db.utils import OperationalError

def health_check(request):
    db_status = "connected"
    db_detail = "ok"
    try:
        # For MongoDB, we check if we can reach the server
        connections['default'].ensure_connection()
        db_detail = "MongoDB responding"
    except Exception as e:
        db_status = "disconnected"
        db_detail = str(e)

    status_code = 200 if db_status == "connected" else 503
    
    return JsonResponse({
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "detail": db_detail,
        "timestamp": now().isoformat()
    }, status=status_code)

urlpatterns = [
    path('', api_root),
    path('api/health/', health_check, name='health_check'),
    path('api/health', health_check), # Fallback for monitoring tools without trailing slash
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
