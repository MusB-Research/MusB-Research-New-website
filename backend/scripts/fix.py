import sqlite3

def fix_db():
    try:
        conn = sqlite3.connect('db.sqlite3')
        conn.execute("INSERT INTO django_migrations (app, name, applied) VALUES ('authentication', '0001_initial', CURRENT_TIMESTAMP);")
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_db()
