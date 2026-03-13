from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "MusB Research API",
        "status": "online",
        "version": "1.2.0",
        "endpoints": {
            "auth": "/api/auth/",
            "studies": "/api/studies/",
            "participants": "/api/participants/"
        }
    })

urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/auth/', include('authentication.urls')),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
