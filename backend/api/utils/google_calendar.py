import requests
from django.conf import settings
from django.utils import timezone
import datetime

def refresh_google_token(user):
    """Refreshes the Google OAuth2 access token if needed."""
    if not user.google_refresh_token:
        return None
    
    # If token is still valid (with 5 min buffer), return current
    if user.google_access_token and user.google_token_expiry:
        if user.google_token_expiry > timezone.now() + datetime.timedelta(minutes=5):
            return user.google_access_token

    try:
        response = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'refresh_token': user.google_refresh_token,
            'grant_type': 'refresh_token',
        })
        
        if response.ok:
            data = response.json()
            user.google_access_token = data['access_token']
            expires_in = data.get('expires_in', 3600)
            user.google_token_expiry = timezone.now() + datetime.timedelta(seconds=expires_in)
            user.save(update_fields=['google_access_token', 'google_token_expiry'])
            return user.google_access_token
    except Exception as e:
        print(f"Failed to refresh Google token for {user.email}: {e}")
    
    return None

def create_google_calendar_event(user, visit):
    """Creates a Google Calendar event for a scheduled visit."""
    access_token = refresh_google_token(user)
    if not access_token:
        return None

    # Construct the event details
    start_time = visit.scheduled_date
    # Assume 1 hour duration if not specified
    end_time = start_time + datetime.timedelta(hours=1)
    
    participant_email = visit.participant.user.email if visit.participant.user else None
    
    event_data = {
        'summary': f"MusB Research: {visit.visit_type}",
        'location': visit.location_address or visit.location or 'Clinical Site',
        'description': f"Clinical Study Visit for {visit.participant.participant_sid}.\nProtocol: {visit.participant.study.protocol_id}",
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'UTC',
        },
        'attendees': [],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},
                {'method': 'popup', 'minutes': 30},
            ],
        }
    }

    if participant_email:
        event_data['attendees'].append({'email': participant_email})
    
    # Also invite the coordinator who scheduled it
    event_data['attendees'].append({'email': user.email})

    try:
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
        response = requests.post(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
            json=event_data,
            headers=headers
        )
        
        if response.ok:
            return response.json().get('id')
        else:
            print(f"Google Calendar API Error: {response.text}")
    except Exception as e:
        print(f"Failed to create Google Calendar event: {e}")
    
    return None
