"""
File    : backend/routers/devices.py
Author  : 김민정
Create  : 2026-04-23
Description : 사용자 기기 관리(Device) 관련 API 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
"""
from fastapi import APIRouter, Depends
from datetime import datetime
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/devices",
    tags=["devices"],
)

@router.get("/")
def get_user_devices(current_user: dict = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 기기 목록 조회 (더미 데이터 예시)
    """
    return [
        {
            "id": 1,
            "hostname": "MacBook-Pro",
            "os_user": "admin",
            "is_active": True,
            "last_seen": datetime.now().isoformat(),
            "api_key_snippet": "sk-1234..."
        }
    ]
