"""
File    : devtools/seed_usage.py
Author  : 김민정
Create  : 2026-04-22
Description : 통계 그래프 전시를 위한 사용량(Usage) 샘플 데이터 생성 스크립트
"""
import sys
from datetime import date, timedelta
import random
import uuid

# PYTHONPATH 설정 (backend 패키지 임포트 가능하도록)
sys.path.append(".")

from backend.database import SessionLocal
from backend.models import Organization, License, APIUsageLog

def seed_usage():
    db = SessionLocal()
    try:
        org_email = "test@skn.com"
        org = db.query(Organization).filter(Organization.admin_email == org_email).first()
        
        if not org:
            org = db.query(Organization).filter(Organization.verification_status == "verified").first()
            if not org:
                print("No verified organization found.")
                return

        lic = db.query(License).filter(License.org_id == org.id).first()
        if not lic:
            lic = License(org_id=org.id, api_key=f"sk-{uuid.uuid4()}", status="active")
            db.add(lic)
            db.commit()
            db.refresh(lic)

        today = date.today()
        logs_to_add = []
        
        for i in range(30, -1, -1):
            current_date = today - timedelta(days=i)
            existing_log = db.query(APIUsageLog).filter(
                APIUsageLog.org_id == org.id,
                APIUsageLog.date_dt == current_date
            ).first()

            if not existing_log:
                if current_date.weekday() >= 5: # Weekend
                    calls = random.randint(1, 15)
                    tokens = calls * random.randint(300, 800)
                else: # Weekday
                    calls = random.randint(20, 80)
                    tokens = calls * random.randint(500, 1500)
                
                # 10% chance of no usage
                if random.random() < 0.1:
                    calls = 0
                    tokens = 0

                if calls > 0:
                    new_log = APIUsageLog(
                        org_id=org.id,
                        license_id=lic.id,
                        date_dt=current_date,
                        total_requests=calls,
                        total_tokens_used=tokens
                    )
                    logs_to_add.append(new_log)

        if logs_to_add:
            db.add_all(logs_to_add)
            db.commit()
            print(f"Successfully seeded {len(logs_to_add)} days of usage data for {org.admin_email}")
        else:
            print(f"Usage data already exists for {org.admin_email}")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_usage()
