from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'studies', views.StudyViewSet)
router.register(r'public-studies', views.PublicStudyViewSet, basename='public-study')
router.register(r'sponsors', views.SponsorViewSet, basename='sponsor')
router.register(r'participants', views.ParticipantViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
