import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv()

uri = os.getenv('MONGO_URI')

try:
    client = MongoClient(uri, tlsCAFile=certifi.where())
    print(f"Connected to Cluster.")
    
    # Try listing databases
    print("Listing databases you have access to:")
    dbs = client.list_database_names()
    print(f"Databases: {dbs}")
    
    # Try a simple command on the specific database
    db = client.get_database("musb_research")
    print(f"Connected to '{db.name}'. Trying a command...")
    res = db.command('dbStats')
    print(f"Stats: {res.get('ok')}")

except Exception as e:
    print(f"❌ Detail Error: {e}")
