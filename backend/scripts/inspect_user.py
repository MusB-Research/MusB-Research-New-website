
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json
from bson import json_util

load_dotenv()
uri = os.getenv('MONGO_URI')
client = MongoClient(uri)
db = client.get_database()

coll = db['users']
user = coll.find_one({'email': 'sponsor@musbresearch.com'})
if user:
    print(json.dumps(user, indent=4, default=json_util.default))
else:
    print("User NOT found in 'users' collection.")
