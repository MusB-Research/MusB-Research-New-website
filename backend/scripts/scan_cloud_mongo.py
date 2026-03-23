from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def scan_real_db():
    uri = os.getenv('MONGO_URI')
    if not uri:
        print("No MONGO_URI found in .env")
        return
        
    print(f"Connecting to Cloud DB...")
    client = MongoClient(uri)
    db = client.get_database() # This will get 'musb_research' from the URI path
    
    print(f"Connected to DB: {db.name}")
    colls = db.list_collection_names()
    print(f"Collections: {colls}")
    
    for coll_name in colls:
        count = db[coll_name].count_documents({})
        if count > 0:
            print(f"\n--- {coll_name} ({count} docs) ---")
            for doc in db[coll_name].find().limit(3):
                doc.pop('password', None)
                print(f"  {doc}")

if __name__ == "__main__":
    scan_real_db()
