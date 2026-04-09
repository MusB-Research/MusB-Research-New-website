from django.utils.timezone import now
from api.models import Compensation, Study, ParticipantTask, Visit

def trigger_reward_logic(instance, trigger_type):
    """
    Auto-calculates and records compensation based on study configuration.
    trigger_type: 'TASK' or 'VISIT'
    """
    if trigger_type == 'TASK':
        participant = instance.participant
        item = instance.task
        logic_required = 'PER_TASK'
        trans_type = 'TASK_COMPLETION'
        desc = f"Reward for completing task: {item.title}"
        amount_key = 'tasks'
        item_id = str(item.id)
    else:
        participant = instance.participant
        item = instance # Visit instance itself
        logic_required = 'PER_VISIT'
        trans_type = 'VISIT_COMPLETION'
        desc = f"Reward for completing visit: {item.visit_type}"
        amount_key = 'visits'
        item_id = str(item.visit_type) # Or use visit number if available

    study = participant.study
    
    # Check if study has rewards enabled and logic matches
    if not getattr(study, 'compensation_enabled', True):
        return

    if study.reward_logic != logic_required:
        # Check if it's the final goal reward if logic is FULL_STUDY
        if study.reward_logic == 'FULL_STUDY':
            # Logic for full study completion would go here if we had a clear trigger
            pass
        return

    # Get amount from config
    config = study.reward_config or {}
    amounts = config.get(amount_key, {})
    amount = amounts.get(item_id, 0)

    if not amount:
        # Check if there's a default in the compensation char field (legacy)
        try:
            # Maybe the study.compensation field has a numeric value?
            import re
            match = re.search(r'\$?(\d+)', study.compensation)
            if match:
                amount = float(match.group(1))
        except:
            amount = 0

    if amount > 0:
        # Create compensation record
        # Avoid duplicates for same task instance
        if trigger_type == 'TASK':
            if Compensation.objects.filter(participant=participant, task=item, transaction_type='TASK_COMPLETION').exists():
                return
        
        Compensation.objects.create(
            participant=participant,
            study=study,
            visit=instance if trigger_type == 'VISIT' else None,
            task=instance.task if trigger_type == 'TASK' else None,
            transaction_type=trans_type,
            description=desc,
            amount=amount,
            status='PENDING',
            payment_method='CASH' if study.reward_type == 'CASH' else 'COUPON' if study.reward_type == 'COUPONS' else 'CASH'
        )
