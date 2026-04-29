import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import StaffMember

def seed_staff():
    staff_list = [
        {"name": "Vaishnavi S", "role": "Business & Administration Manager", "dept": "Operations", "display_order": 1},
        {"name": "Indushekar Manjunatha", "role": "Clinical Coordinator", "dept": "Clinical Research", "display_order": 2},
        {"name": "Falguni Kanani", "role": "Community Outreach Liaison", "dept": "Public Relations", "display_order": 3},
        {"name": "Alain Ramirez", "role": "Laboratory Technician", "dept": "Lab Services", "display_order": 4},
        {"name": "Andreas Mbah", "role": "Medical Laboratory Director", "dept": "Diagnostics", "display_order": 5},
        {"name": "Jason Chandler", "role": "IT Professional", "dept": "Technology", "display_order": 6},
        {"name": "Shray Paliwal", "role": "Research Intern", "dept": "Scientific Support", "display_order": 7},
        {"name": "Osula Ebiuwa", "role": "Research Intern", "dept": "Scientific Support", "display_order": 8},
        {"name": "Barenya Prasad Mishra", "role": "Digital Health Platform Developer", "dept": "Product Engineering", "display_order": 9},
        {"name": "Brijesh Kumar", "role": "Junior Software Engineer", "dept": "Software Development", "display_order": 10}
    ]

    # Clear existing dummy staff
    StaffMember.objects.all().delete()

    for s in staff_list:
        StaffMember.objects.create(
            name=s['name'],
            role=s['role'],
            dept=s['dept'],
            category='staff',
            display_order=s['display_order']
        )
        print(f"Created staff member: {s['name']}")

    print("Staff seeding complete.")

if __name__ == "__main__":
    seed_staff()
