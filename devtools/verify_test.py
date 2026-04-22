"""
File    : devtools/verify_test.py
Author  : 김민정
Create  : 2026-04-22
Description : 결제 후 승인 로직 및 DB 연동 최종 검증용 스크립트
"""
import sys
import os
sys.path.append(os.getcwd())

from backend import database, models, auth
from sqlalchemy import text
import uuid

def seed_test_data():
    db = next(database.get_db())
    
    email = "test@naver.com"
    pwd = "Password123!"
    
    # Check if user exists
    user = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
    if not user:
        print(f"Creating test user: {email}")
        user = models.Organization(
            admin_email=email,
            password_hash=auth.get_password_hash(pwd),
            company_name="테스트 주식회사",
            plan="Pro",
            verification_status="pending", # Start as pending to test enforcement
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        print(f"User {email} already exists. Setting to 'pending' for testing.")
        user.verification_status = "pending"
        user.password_hash = auth.get_password_hash(pwd)
        db.commit()

    # Ensure at least one license
    license = db.query(models.License).filter(models.License.org_id == user.id).first()
    if not license:
        license = models.License(
            org_id=user.id,
            api_key=f"sk-test-{uuid.uuid4().hex[:12]}",
            status="active"
        )
        db.add(license)
        db.commit()
        db.refresh(license)

    # Ensure at least one device
    device = db.query(models.Device).filter(models.Device.license_id == license.id).first()
    if not device:
        print("Creating mock device...")
        device = models.Device(
            license_id=license.id,
            machine_id="MAC-ADDR-TEST-001",
            hostname="TEST-WORKSTATION",
            os_user="engineer_test",
            display_name="메인 설계 PC",
            is_active=True
        )
        db.add(device)
        db.commit()
    
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed_test_data()
