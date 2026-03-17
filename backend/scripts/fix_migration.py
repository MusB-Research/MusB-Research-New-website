import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')

from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri, tlsInsecure=True)
db = client['musb_research']

result = db['django_migrations'].delete_many({'app': 'authentication'})
print(f"Deleted {result.deleted_count} authentication migration record(s) from DB")
client.close()
