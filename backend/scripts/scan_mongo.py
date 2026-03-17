from pymongo import MongoClient

def scan_everything():
    client = MongoClient("mongodb://localhost:27017")
    dbs = client.list_database_names()
    print(f"Available Databases: {dbs}")
    
    for db_name in dbs:
        if db_name in ['admin', 'local', 'config']: continue
        db = client[db_name]
        print(f"\n--- DATABASE: {db_name} ---")
        colls = db.list_collection_names()
        print(f"Collections: {colls}")
        for coll_name in colls:
            count = db[coll_name].count_documents({})
            print(f"  Collection: {coll_name} | Count: {count}")
            # Identify user-like collections
            if 'user' in coll_name.lower() or 'member' in coll_name.lower():
                print(f"    --- Sample from {coll_name} ---")
                for doc in db[coll_name].find().limit(2):
                    # Remove password
                    doc.pop('password', None)
                    print(f"    {doc}")

if __name__ == "__main__":
    scan_everything()
