from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupportTicket, TicketMessage, TicketAuditLog
from .serializers import SupportTicketSerializer, TicketMessageSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins can see all, PIs see their created tickets or study-related
        user = self.request.user
        if user.is_staff or user.role == 'ADMIN':
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(creator=user)

    def perform_create(self, serializer):
        # Generation of ticket unique identifier TCK-XXXX
        # Use count for a simpler, safer sequential ID if not many concurrent deletes happen
        count = SupportTicket.objects.count()
        num = 1001 + count
        ticket_id = f"TCK-{num}"
        
        # Save the ticket
        ticket = serializer.save(creator=self.request.user, ticket_id=ticket_id)
        
        # Handle initial description as the first message
        description = self.request.data.get('description')
        if description:
            user = self.request.user
            role_label = getattr(user, 'role', 'RESEARCHER')
            if user.is_staff: role_label = "ADMIN"
            
            TicketMessage.objects.create(
                ticket=ticket,
                sender=user,
                content=description,
                user_role_label=role_label
            )

        # Initial Audit Log
        user_display = getattr(self.request.user, 'decrypted_name', self.request.user.email)
        TicketAuditLog.objects.create(
            ticket=ticket,
            user=user_display,
            action="Ticket created"
        )

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        content = request.data.get('content')
        is_internal = request.data.get('is_internal', False)
        
        if not content:
            return Response({"error": "Content required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine the role label for display
        user = request.user
        role_label = getattr(user, 'role', 'RESEARCHER') # Fallback if no role
        if user.is_staff:
            role_label = "ADMIN"
            
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=user,
            content=content,
            is_internal=is_internal,
            user_role_label=role_label
        )
        
        return Response(TicketMessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'RESOLVED'
        ticket.save()
        
        user_display = getattr(request.user, 'decrypted_name', request.user.email)
        TicketAuditLog.objects.create(
            ticket=ticket,
            user=user_display,
            action="Ticket resolved"
        )
        
        return Response({"status": "Ticket resolved"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'ESCALATED'
        ticket.assigned_to = 'SUPER_ADMIN'
        ticket.save()
        
        user_display = getattr(request.user, 'decrypted_name', request.user.email)
        TicketAuditLog.objects.create(
            ticket=ticket,
            user=user_display,
            action="Ticket escalated to Super Admin"
        )
        
        return Response({"status": "Ticket escalated"}, status=status.HTTP_200_OK)
