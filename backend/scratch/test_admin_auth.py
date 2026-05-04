import requests
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api/v1/admin"
ADMIN_PIN = os.getenv("ADMIN_PIN", "1234")

def test_admin_auth():
    print(f"Testing PIN login with PIN: {ADMIN_PIN}")
    try:
        # 1. Login
        res = requests.post(f"{BASE_URL}/pin-login", json={"pin": ADMIN_PIN})
        print(f"Login Status: {res.status_code}")
        data = res.json()
        print(f"Login Response: {data}")
        
        if not data.get("success"):
            print("Login failed")
            return
            
        token = data.get("token")
        
        # 2. Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/pending-approvals", headers=headers)
        print(f"Pending Approvals Status: {res.status_code}")
        if res.status_code == 200:
            print("Successfully accessed protected endpoint!")
        else:
            print(f"Failed to access protected endpoint: {res.text}")
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_admin_auth()
