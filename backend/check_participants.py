from authentication.models import User
from api.models import Participant

users = User.objects.all()
for u in users:
    count = Participant.objects.filter(user=u).count()
    if count > 0:
        print(f"User: {u.decrypted_name} ({u.email}) | Count: {count}")
        for p in Participant.objects.filter(user=u):
            print(f"  - {p.study.title} ({p.status})")
