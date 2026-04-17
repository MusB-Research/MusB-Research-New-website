from celery import shared_task
from django.core.cache import cache
from .models import Participant, Study, QuestionnaireScheduleInstance
from .serializers import ParticipantBriefSerializer, StudySerializer
import logging
import json

logger = logging.getLogger(__name__)

@shared_task
def refresh_study_stats_cache(study_id):
    """
    Background task to recalculate study stats and update cache.
    """
    try:
        study = Study.objects.get(pk=study_id)
        # Mocking the PI/Coordinator context for stats calculation
        participants = Participant.objects.filter(study=study)
        total_enrolled = participants.count()
        
        instances = QuestionnaireScheduleInstance.objects.filter(participant__study=study)
        total_tasks = instances.count()
        completed = instances.filter(status='COMPLETED').count()
        late = instances.filter(status='LATE').count()
        missed = instances.filter(status='MISSED').count()
        
        compliance = (completed / total_tasks * 100) if total_tasks > 0 else 0
        
        stats_data = {
            'enrolled': total_enrolled,
            'completion': {
                'total': total_tasks,
                'completed': completed,
                'late': late,
                'missed': missed,
                'compliance_rate': round(compliance, 1)
            }
        }
        
        # We'd need to know which users to update for. 
        # For now, we'll just invalidate the general pattern.
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(f"study_stats:{study_id}:*")
            logger.info(f"Invalidated stats cache for study {study_id}")
            
    except Study.DoesNotExist:
        pass

@shared_task
def refresh_participants_list_cache():
    """
    Invalidates all participant list caches when any participant data changes.
    """
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern("participants_list:*")
        logger.info("Invalidated all participants list caches")
