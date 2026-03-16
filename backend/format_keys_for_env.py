import os

def format_keys():
    try:
        with open('private_key.pem', 'r') as f:
            priv = f.read().replace('\n', '\\n')
        with open('public_key.pem', 'r') as f:
            pub = f.read().replace('\n', '\\n')
        
        print("\n=== COPY THESE TO YOUR DEPLOYMENT ENVIRONMENT VARIABLES ===\n")
        print(f"JWT_PRIVATE_KEY=\"{priv}\"")
        print("\n")
        print(f"JWT_PUBLIC_KEY=\"{pub}\"")
        print("\n==========================================================\n")
    except FileNotFoundError:
        print("Keys not found. Make sure you are in the backend directory.")

if __name__ == "__main__":
    format_keys()
