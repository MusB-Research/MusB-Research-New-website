import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv()

uri = os.getenv('MONGO_URI')
print(f"Testing URI: {uri[:20]}... (hidden for safety)")

try:
    client = MongoClient(uri, tlsCAFile=certifi.where())
    # The list_database_names() call requires high privileges
    # server_info() just checks if the connection is alive
    info = client.server_info()
    print("✅ Connection Successful!")
    print(f"Server Version: {info.get('version')}")
    
    db = client.get_database() # Gets db from URI (musb_research)
    print(f"Attempting to list collections in: {db.name}")
    cols = db.list_collection_names()
    print(f"✅ Authorization Successful! Found collections: {cols}")

except Exception as e:
    print(f"❌ Error: {e}")
