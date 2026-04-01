from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt
from . import views

router = DefaultRouter()
router.register(r'studies', views.StudyViewSet)
router.register(r'public-studies', views.PublicStudyViewSet, basename='public-study')
router.register(r'sponsors', views.SponsorViewSet, basename='sponsor')
router.register(r'users', views.UserViewSet)
router.register(r'forms', views.FormViewSet)
router.register(r'form-responses', views.FormResponseViewSet)
router.register(r'participants', views.ParticipantViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'participant-tasks', views.ParticipantTaskViewSet)
router.register(r'consent-templates', views.ConsentTemplateViewSet)
router.register(r'consent', views.ConsentViewSet)
router.register(r'kits', views.KitViewSet)
router.register(r'dosing-logs', views.DosingLogViewSet, basename='dosing-log')
router.register(r'ae-reports', views.AEReportViewSet, basename='ae-report')

router.register(r'leads', views.LeadViewSet)
router.register(r'communications', views.CommunicationLogViewSet)
router.register(r'compensations', views.CompensationViewSet)
router.register(r'lab-results', views.LabResultViewSet)
router.register(r'audit-logs', views.DataAuditLogViewSet)
router.register(r'news', views.NewsViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'partnerships', views.PartnershipViewSet)
router.register(r'publications', views.PublicationViewSet)
router.register(r'education', views.EducationMaterialViewSet)
router.register(r'study-inquiries', views.StudyInquiryViewSet)
router.register(r'intervention-arms', views.InterventionArmViewSet)
router.register(r'clinical-conversations', views.ClinicalConversationViewSet)

urlpatterns = [
    path('apply/', csrf_exempt(views.CandidateApplyView.as_view({'post': 'apply'})), name='candidate-apply'),
    path('facilities-inquiry/', views.FacilityInquiryView.as_view(), name='facilities-inquiry'),
    path('newsletter/subscribe/', views.SubscribeNewsletterView.as_view(), name='newsletter-subscribe'),
    path('booklet-download/', views.BookletDownloadRequestCreateView.as_view(), name='booklet-download'),
    path('help-request/', views.ParticipantHelpRequestView.as_view(), name='participant-help-request'),
    path('', include(router.urls)),
]
