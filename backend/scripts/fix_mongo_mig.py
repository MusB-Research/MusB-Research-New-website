import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv
import datetime

load_dotenv(override=True)

def fix_mongo():
    uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/musb_research')
    client = MongoClient(uri, tlsCAFile=certifi.where())
    
    # Parse the db name from URI or just default to 'test' depending on typical pymongo setup
    db_name = uri.split('/')[-1].split('?')[0]
    if not db_name:
        db_name = 'musb_research'
    db = client.get_database(db_name)
    migrations = db.django_migrations
    
    has_auth = migrations.find_one({'app': 'authentication', 'name': '0001_initial'})
    if not has_auth:
        max_id = 0
        latest = migrations.find_one(sort=[('id', -1)])
        if latest and 'id' in latest:
            max_id = latest['id']
            
        migrations.insert_one({
            'app': 'authentication',
            'name': '0001_initial',
            'applied': datetime.datetime.now(),
            'id': max_id + 1
        })
        print("Inserted authentication.0001_initial")
    else:
        print("Already exists")

if __name__ == '__main__':
    fix_mongo()
