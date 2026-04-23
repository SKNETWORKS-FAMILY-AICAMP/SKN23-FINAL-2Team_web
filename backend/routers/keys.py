"""
File    : backend/routers/keys.py
Author  : 김민정
Create  : 2026-04-23
Description : API Key 생성 및 관리 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user, ensure_subscribed

router = APIRouter(prefix="/api/v1/keys", tags=["keys"])

@router.post("/generate")
def generate_api_key(current_org: models.Organization = Depends(ensure_subscribed), db: Session = Depends(get_db)):
    new_key = f"sk-{uuid.uuid4()}"
    license = models.License(org_id=current_org.id, api_key=new_key, status="active")
    db.add(license)
    db.commit()
    return {"success": True, "key": new_key}

@router.get("")
def get_api_keys(current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(models.License).filter(models.License.org_id == current_org.id).order_by(models.License.created_at.desc()).all()
    
    result = []
    for k in keys:
        # Convert SQLAlchemy model to dict
        key_dict = {c.name: getattr(k, c.name) for c in k.__table__.columns}
        
        # Mask the api_key if it's long enough
        if key_dict.get("api_key") and len(key_dict["api_key"]) > 8:
            prefix = key_dict["api_key"][:3] # 'sk-'
            suffix = key_dict["api_key"][-4:]
            hidden_len = len(key_dict["api_key"]) - 7
            key_dict["api_key"] = f"{prefix}{'*' * 24}{suffix}"
            
        result.append(key_dict)
        
    return result

@router.delete("/{key_id}")
def delete_api_key(key_id: str, current_org: models.Organization = Depends(ensure_subscribed), db: Session = Depends(get_db)):
    key_to_delete = db.query(models.License).filter(
        models.License.id == key_id, 
        models.License.org_id == current_org.id
    ).first()
    
    if not key_to_delete:
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없거나 권한이 없습니다.")
        
    # Hard Delete associated data
    db.query(models.Device).filter(models.Device.license_id == key_id).delete()
    db.query(models.APIUsageLog).filter(models.APIUsageLog.license_id == key_id).delete()
    db.query(models.Payment).filter(models.Payment.generated_license_id == key_id).update({"generated_license_id": None})
    
    db.delete(key_to_delete)
    db.commit()
    return {"success": True, "message": "API 키가 성공적으로 삭제되었습니다."}
