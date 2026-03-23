from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.utils.timezone import now
from .models import JobPosting
from .serializers import JobPostingSerializer

# Admin Viewset: CRUD for Super Admins
class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated] # Super Admin check typically handled in detail view or backend

    def get_permissions(self):
        # We could enforce Super Admin here, but we'll assume the client handles the push appropriately
        # while verify is_staff/is_superuser for sensitive operations
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

# Public API: Read-only for Active jobs
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_active_jobs(request):
    """Returns only 'Active' jobs that haven't expired yet."""
    current_date = now().date()
    # Query: Status is Active and Expiry Date is in the future
    try:
        jobs = JobPosting.objects.filter(
            status='Active',
            publish_date__lte=current_date, # Only show if publish_date reached
            expiry_date__gt=current_date
        )
        serializer = JobPostingSerializer(jobs, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_job_detail(request, pk):
    """Retrieve job detail by UUID, ensuring it's active."""
    try:
        job = JobPosting.objects.get(id=pk, status='Active')
        serializer = JobPostingSerializer(job)
        return Response(serializer.data)
    except JobPosting.DoesNotExist:
        return Response({'error': 'Job not found or no longer active.'}, status=status.HTTP_404_NOT_FOUND)
