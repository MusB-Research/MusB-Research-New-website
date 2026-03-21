from authentication.models import User
from api.models import Participant
try:
    u = User.objects.get(email='b.k.lpuinsta@gmail.com')
    p = Participant.objects.filter(user=u).first()
    if p:
        print(f"User: {u.first_name} {u.last_name}")
        print(f"Full: {u.full_name}")
        print(f"Decrypted: {u.decrypted_name}")
        print(f"Participant ID: {p.id}")
        print(f"Study ID: {p.study_id}")
    else:
        print("User has NO Participant model record")
except Exception as e:
    print(f"Error: {e}")
