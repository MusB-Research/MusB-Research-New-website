from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, list_active_jobs, get_job_detail

router = DefaultRouter()
router.register(r'job-postings', JobPostingViewSet, basename='job-postings')

urlpatterns = [
    # Admin Interface
    path('admin/', include(router.urls)),
    
    # Public Interface
    path('public/active/', list_active_jobs, name='list-active-jobs'),
    path('public/job/<uuid:pk>/', get_job_detail, name='get-job-detail'),
]
