"""
File    : backend/routers/auth.py
Author  : 김민정
Create  : 2026-04-23
Description : 관리자 계정 생성

Modification History:
    - 2026-04-23 (김민정) : 관리자 계정 생성
"""
import os
import sys

# 프로젝트 루트 경로를 PATH에 추가하여 backend 모듈 임포트 가능하게 함
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base, SessionLocal
from backend.models import SystemAdmin
from backend.auth import get_password_hash

# 1. SystemAdmin 테이블이 없으면 생성 (있으면 무시됨)
print("Creating system_admins table if not exists...")
Base.metadata.create_all(bind=engine, tables=[SystemAdmin.__table__])

# 2. 관리자 계정 생성
db = SessionLocal()
try:
    email = "admin@skn.com"
    password_hash = "Password123!"
    
    existing = db.query(SystemAdmin).filter(SystemAdmin.email == email).first()
    if existing:
        print(f"Admin account {email} already exists!")
    else:
        new_admin = SystemAdmin(
            email=email,
            password_hash=get_password_hash(password_hash)
        )
        db.add(new_admin)
        db.commit()
        print(f"Successfully created admin account: {email} / {password_hash}")

except Exception as e:
    print("Error:", e)
finally:
    db.close()
