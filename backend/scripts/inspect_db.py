from django.conf import settings
import os
import django
from pymongo import MongoClient

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

def inspect_db():
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/musb_research')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    
    print(f"Database Name: {db.name}")
    print(f"Collections: {db.list_collection_names()}")
    
    if 'authentication_user' in db.list_collection_names():
        print("\n--- Users (authentication_user) ---")
        for user in db.authentication_user.find():
            # Hide sensitive fields like password
            user_display = {k: v for k, v in user.items() if k != 'password'}
            print(user_display)
    else:
        print("\n'authentication_user' collection not found.")

if __name__ == "__main__":
    inspect_db()
