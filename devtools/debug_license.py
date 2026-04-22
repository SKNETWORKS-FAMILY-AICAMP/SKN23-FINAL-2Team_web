"""
File    : devtools/debug_license.py
Author  : 김민정
Create  : 2026-04-22
Description : 라이선스 및 API Key 상태 디버깅용 스크립트
"""
import sys
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def check_dependencies(license_id):
    db = SessionLocal()
    try:
        license = db.query(models.License).filter(models.License.id == license_id).first()
        if not license:
            print(f"License {license_id} not found.")
            return

        devices = db.query(models.Device).filter(models.Device.license_id == license_id).all()
        logs = db.query(models.APIUsageLog).filter(models.APIUsageLog.license_id == license_id).all()
        
        print(f"License: {license.api_key} (Status: {license.status})")
        print(f"Found {len(devices)} devices referencing this license.")
        for d in devices:
            print(f" - Device ID: {d.id}, Machine ID: {d.machine_id}")
            
        print(f"Found {len(logs)} usage logs referencing this license.")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_dependencies(sys.argv[1])
    else:
        print("Usage: python debug_license.py <license_id>")
