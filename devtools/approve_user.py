"""
File    : devtools/approve_user.py
Author  : 김민정
Create  : 2026-04-22
Description : 사용자 승인 상태(Pending -> Active) 디버깅용 스크립트
"""
import sys
from dotenv import load_dotenv
from sqlalchemy import text
from backend.database import engine, server

def approve_organization(email: str):
    try:
        with engine.connect() as conn:
            # 1. Update verification_status to 'verified'
            result = conn.execute(
                text("UPDATE organizations SET verification_status = 'verified' WHERE admin_email = :email"),
                {"email": email}
            )
            conn.commit()
            
            if result.rowcount > 0:
                print(f"--- [Success] ---")
                print(f"User '{email}' has been verified successfully.")
                print(f"You can now access all services including payments.")
            else:
                print(f"--- [Error] ---")
                print(f"User '{email}' was not found in the database.")
                
    except Exception as e:
        print(f"An error occurred during approval: {e}")
    finally:
        if server:
            server.stop()

if __name__ == "__main__":
    # Change the email below to the user you want to approve
    target_email = "test@skn.com" # Or the one you used for registration
    approve_organization(target_email)
