from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def check_mongo():
    uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/musb_research')
    client = MongoClient(uri)
    db = client.musb_research
    collection = db.api_aboutpagesettings
    
    print(f"Total documents in api_aboutpagesettings: {collection.count_documents({})}")
    for doc in collection.find():
        print(f"ID: {doc.get('_id')}")
        print(f"Partner Title: {doc.get('partner_title')}")
        print(f"Partner Content: {doc.get('partner_content')}")
        print("-" * 20)

if __name__ == "__main__":
    check_mongo()
