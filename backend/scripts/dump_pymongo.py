import os
import django
import json
from bson import ObjectId

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from pymongo import MongoClient

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

host = settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017')
client = MongoClient(host)
db = client[settings.DATABASES['default']['NAME']]

docs = list(db.api_facilitymodule.find())
indexes = list(db.api_facilitymodule.list_indexes())

out = {
    'count': len(docs),
    'docs': docs,
    'indexes': [idx.to_dict() for idx in indexes]
}

with open('mongo_dump.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, cls=JSONEncoder, indent=2)

print("Dumped mongo_dump.json")
