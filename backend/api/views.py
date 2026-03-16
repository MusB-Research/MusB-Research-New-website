from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Study, StudyAssignment, Participant
from .serializers import StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, UserSerializer
from authentication.models import User

from django.db.models import Q

class IsAdminOrCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']

class StudyViewSet(viewsets.ModelViewSet):
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Study.objects.all()
        
        # Coordinators and PIs only see assigned studies
        return Study.objects.filter(assignments__user=user)

    def perform_create(self, serializer):
        # Allow Admin, SuperAdmin, PI, and Coordinator to create studies
        if self.request.user.role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            study = serializer.save()
            # Automatically assign the creator as a lead
            StudyAssignment.objects.create(
                study=study,
                user=self.request.user,
                role=self.request.user.role if self.request.user.role in ['PI', 'COORDINATOR'] else 'PI'
            )
        else:
            raise permissions.PermissionDenied("Not authorized to create studies")

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only view for the frontend website"""
    queryset = Study.objects.filter(status='RECRUITING') # Only show recruiting studies or all? Let's show all and filter on frontend or allow query params. Actually, let's just return all for now or order by created.
    # We will just return all and let the frontend filter.
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.AllowAny]

class SponsorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='SPONSOR')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        sponsor = self.get_object()
        # In a real app, 'teams' might be the same company users
        # For simplicity, we filter by company/country or a specific team model
        # Let's assume sponsors share a "company" or specific filter
        team_members = User.objects.filter(role='SPONSOR') # Placeholder for team logic
        serializer = UserSerializer(team_members, many=True)
        return Response(serializer.data)

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Participant.objects.all()
        return Participant.objects.filter(study__assignments__user=user)
