"""
File    : backend/routers/keys_router.py
Author  : 김민정
Create  : 2026-04-23
Description : API Key 생성 및 관리 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-05-14 (김지우) : 64자 API Key 생성 및 뒷부분 마스킹 응답 적용
    - 2026-05-14 (김지우) : API Key 이름 저장 요청 처리
    - 2026-05-14 (김지우) : API Key 메타데이터를 이름만 저장하도록 단순화
    - 2026-05-14 (김지우) : 마스킹된 API Key의 실제 키 복사 조회 엔드포인트 추가
    - 2026-05-15 (김지우) : API Key 생성/삭제 알림 생성
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
import secrets
import string

from ..models import models, schemas
from ..core.database import get_db
from ..core.dependencies import get_current_user, ensure_subscribed
from ..core.notification_utils import create_user_notification

router = APIRouter(prefix="/api/v1/keys", tags=["keys"])

API_KEY_ALPHABET = string.ascii_letters + string.digits

class GenerateKeyRequest(BaseModel):
    name: Optional[str] = None

def _generate_api_key() -> str:
    return "sk-" + "".join(secrets.choice(API_KEY_ALPHABET) for _ in range(61))

def _mask_api_key(api_key: str) -> str:
    visible_len = 18
    if len(api_key) <= visible_len:
        return api_key
    return api_key[:visible_len] + ("*" * (len(api_key) - visible_len))

def _clean_text(value: Optional[str], max_len: int) -> Optional[str]:
    if not value:
        return None
    cleaned = value.strip()
    return cleaned[:max_len] if cleaned else None

def _ensure_license_metadata_columns(db: Session) -> None:
    db.execute(text("ALTER TABLE licenses ADD COLUMN IF NOT EXISTS name VARCHAR(120)"))
    db.commit()

@router.post("/generate")
def generate_api_key(
    payload: Optional[GenerateKeyRequest] = None,
    current_org: models.Organization = Depends(ensure_subscribed),
    db: Session = Depends(get_db),
):
    _ensure_license_metadata_columns(db)

    new_key = _generate_api_key()
    key_name = _clean_text(payload.name if payload else None, 120)

    license = models.License(
        org_id=current_org.id,
        api_key=new_key,
        name=key_name,
        status="active",
    )
    db.add(license)
    db.flush()
    create_user_notification(
        db,
        org_id=str(current_org.id),
        type_="api_key_created",
        title="새 API Key가 생성되었습니다",
        message=f"{key_name or '이름 없는 API Key'} 키가 발급되었습니다.",
        action_url="/profile?tab=api",
        resource_type="license",
        resource_id=str(license.id),
    )
    db.commit()
    return {"success": True, "key": new_key, "name": key_name}

@router.get("")
def get_api_keys(current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_license_metadata_columns(db)

    keys = db.query(models.License).filter(models.License.org_id == current_org.id).order_by(models.License.created_at.desc()).all()
    
    result = []
    for k in keys:
        # Convert SQLAlchemy model to dict
        key_dict = {c.name: getattr(k, c.name) for c in k.__table__.columns}
        
        if key_dict.get("api_key"):
            key_dict["api_key"] = _mask_api_key(key_dict["api_key"])
            
        result.append(key_dict)
        
    return result

@router.get("/{key_id}/secret")
def get_api_key_secret(key_id: str, current_org: models.Organization = Depends(ensure_subscribed), db: Session = Depends(get_db)):
    key = db.query(models.License).filter(
        models.License.id == key_id,
        models.License.org_id == current_org.id
    ).first()

    if not key:
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없거나 권한이 없습니다.")

    return {"success": True, "key": key.api_key}

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
    db.query(models.ApiUsageLog).filter(models.ApiUsageLog.license_id == key_id).delete()
    db.query(models.Payment).filter(models.Payment.generated_license_id == key_id).update({"generated_license_id": None})
    
    key_name = key_to_delete.name or "API Key"
    db.delete(key_to_delete)
    create_user_notification(
        db,
        org_id=str(current_org.id),
        type_="api_key_deleted",
        title="API Key가 삭제되었습니다",
        message=f"{key_name} 키가 삭제되었습니다.",
        action_url="/profile?tab=api",
    )
    db.commit()
    return {"success": True, "message": "API 키가 성공적으로 삭제되었습니다."}
