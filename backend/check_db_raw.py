from pymongo import MongoClient
import os

def check():
    uri = "mongodb://localhost:27017/musb_research"
    client = MongoClient(uri)
    db = client.musb_research
    print("Collections in DB:", db.list_collection_names())
    
    users = db.authentication_user
    print("\n--- ALL USERS IN DB ---")
    for u in users.find():
        print(f"EMAIL: {u.get('email')} | ROLE: {u.get('role')} | ID: {u.get('_id')}")

if __name__ == "__main__":
    check()
