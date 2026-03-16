from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def scan_users():
    uri = os.getenv('MONGO_URI')
    client = MongoClient(uri)
    db = client.get_database()
    
    user_coll = db['authentication_user']
    print(f"\n--- ALL USERS IN {db.name}.authentication_user ---")
    users = list(user_coll.find())
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"EMAIL: {u.get('email')} | NAME: {u.get('full_name')} | ROLE: {u.get('role')}")

if __name__ == "__main__":
    scan_users()
