"""
File    : devtools/seed_user.py
Author  : 김민정
Create  : 2026-04-21
Description : 테스트용 기본 사용자 계정(test@skn) 생성 및 초기화 스크립트
"""
import sys
import os
import uuid
# Add current directory to path so we can import from backend
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend import models, auth

def seed():
    db = SessionLocal()
    email = "test@skn"
    password = "Password123!"
    
    print(f"[*] Checking for user: {email}")
    existing_user = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
    
    if existing_user:
        print(f"[*] User {email} already exists. Updating password...")
        existing_user.password_hash = auth.get_password_hash(password)
        existing_user.verification_status = "pending" # Keep as pending for testing UI
        db.commit()
    else:
        print(f"[*] Creating user {email}...")
        new_user = models.Organization(
            id=uuid.uuid4(),
            admin_email=email,
            password_hash=auth.get_password_hash(password),
            company_name="SKN Test",
            plan="Pro",
            verification_status="pending", # Default to pending
            is_active=True
        )
        db.add(new_user)
        db.commit()
    
    print("[+] Seeding successful! test@skn / Password123! is ready.")
    db.close()

if __name__ == "__main__":
    seed()
