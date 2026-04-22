"""
File    : devtools/create_user.py
Author  : 김민정
Create  : 2026-04-21
Description : 초기 기업 관리자 계정 생성용 스크립트
"""
import os
from dotenv import load_dotenv
from sqlalchemy import text
from backend.database import engine, server
from backend import auth

def create_test_user(email, password, company_name):
    try:
        # Create hash using CURRENT logic
        hashed_pw = auth.get_password_hash(password)
        
        with engine.connect() as conn:
            # Check if exists
            res = conn.execute(text("SELECT id FROM organizations WHERE admin_email = :email"), {"email": email}).fetchone()
            
            if res:
                # Update existing user's password to be sure it matches current logic
                conn.execute(
                    text("UPDATE organizations SET password_hash = :pw, plan = 'none' WHERE admin_email = :email"),
                    {"pw": hashed_pw, "email": email}
                )
                print(f"Updated existing user: {email}")
            else:
                # Create new
                conn.execute(
                    text("""
                        INSERT INTO organizations (id, admin_email, password_hash, company_name, plan, is_active)
                        VALUES (gen_random_uuid(), :email, :pw, :name, 'none', true)
                    """),
                    {"email": email, "pw": hashed_pw, "name": company_name}
                )
                print(f"Created new user: {email}")
            
            conn.commit()
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if server:
            server.stop()

if __name__ == "__main__":
    create_test_user("test@skn", "Password123!", "SKN Test Company")
