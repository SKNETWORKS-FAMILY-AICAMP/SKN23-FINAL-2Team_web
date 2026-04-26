"""
File    : backend/routers/devices.py
Author  : 김민정
Create  : 2026-04-23
Description : 사용자 기기 관리(Device) 관련 API 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 더미데이터 삭제 후 DB 연동
"""
from fastapi import APIRouter, Depends
from datetime import datetime
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/devices",
    tags=["devices"],
)

from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

@router.get("/")
def get_user_devices(
    current_user: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자의 실제 등록 기기 목록 조회
    """
    # Organization -> License -> Device 관계를 통해 조회
    devices = (
        db.query(models.Device)
        .join(models.License)
        .filter(models.License.org_id == current_user.id)
        .all()
    )
    
    return [
        {
            "id": str(d.id),
            "hostname": d.display_name or "Unknown Device",
            "os_user": d.machine_id.split('@')[0] if d.machine_id and '@' in d.machine_id else "N/A",
            "is_active": d.is_active,
            "last_seen": d.last_seen.isoformat() if d.last_seen else None,
            "api_key_snippet": "sk-****"
        } for d in devices
    ]
