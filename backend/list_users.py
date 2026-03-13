from authentication.models import User
print([(u.email, u.role) for u in User.objects.all()])
