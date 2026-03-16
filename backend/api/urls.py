from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'studies', views.StudyViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'forms', views.FormViewSet)
router.register(r'form-responses', views.FormResponseViewSet)
router.register(r'participants', views.ParticipantViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'participant-tasks', views.ParticipantTaskViewSet)
router.register(r'consent', views.ConsentViewSet)

router.register(r'leads', views.LeadViewSet)
router.register(r'communications', views.CommunicationLogViewSet)
router.register(r'compensations', views.CompensationViewSet)
router.register(r'lab-results', views.LabResultViewSet)
router.register(r'audit-logs', views.DataAuditLogViewSet)
router.register(r'news', views.NewsViewSet)
router.register(r'events', views.EventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
