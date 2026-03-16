
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv('MONGO_URI')
client = MongoClient(uri)
db = client.get_database() # This often takes from the URI part itself if defined

print(f"Database: {db.name}")
collections = db.list_collection_names()
print(f"Collections: {collections}")

for coll_name in collections:
    if 'user' in coll_name.lower() or 'auth' in coll_name.lower():
        print(f"\nScanning collection: {coll_name}")
        coll = db[coll_name]
        items = list(coll.find({}))
        for item in items:
            if 'email' in item:
                print(f"  - Email: {item['email']}")
