import os
import django
from pymongo import MongoClient
from dotenv import load_dotenv

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.security import encrypt_data, decrypt_data
from cryptography.fernet import Fernet

def migrate_existing_data():
    load_dotenv()
    uri = os.getenv('MONGO_URI')
    client = MongoClient(uri)
    db = client.get_database()
    
    users_coll = db['authentication_user']
    users = list(users_coll.find())
    print(f"Checking {len(users)} users for encryption...")
    
    for user in users:
        email = user.get('email')
        full_name = user.get('full_name')
        phone = user.get('phone_number')
        
        updates = {}
        
        # Check if full_name is already encrypted (Fernet tokens start with gAAAA)
        if full_name and not full_name.startswith('gAAAA'):
            print(f"Encrypting name for {email}")
            updates['full_name'] = encrypt_data(full_name)
            
        if phone and not phone.startswith('gAAAA'):
            print(f"Encrypting phone for {email}")
            updates['phone_number'] = encrypt_data(phone)
            
        if updates:
            users_coll.update_one({'_id': user['_id']}, {'$set': updates})
            print(f"Updated {email}")

    print("Migration complete.")

if __name__ == "__main__":
    migrate_existing_data()
