import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from pymongo import MongoClient
import pprint

print("DATABASES setting keys:", settings.DATABASES['default'].keys())
if 'CLIENT' in settings.DATABASES['default']:
    host = settings.DATABASES['default']['CLIENT']['host']
else:
    host = 'mongodb://localhost:27017'

client = MongoClient(host)
db = client[settings.DATABASES['default']['NAME']]

print("Total documents in collection:", db.api_facilitymodule.count_documents({}))
docs = list(db.api_facilitymodule.find())
for doc in docs:
    print("---")
    pprint.pprint(doc)

print("Indexes:")
pprint.pprint(list(db.api_facilitymodule.index_information().items()))
