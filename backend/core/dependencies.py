"""
File    : backend/core/dependencies.py
Author  : 김민정
Create  : 2026-04-23
Description : FastAPI 의존성 주입 및 공용 보안 함수 (get_current_user 등)

Modification History:
    - 2026-04-23 (김민정) : 순환 참조 방지를 위한 모듈 분리 생성
    - 2026-05-15 (김지우) : 조직 담당자 컬럼 보강 후 사용자 조회
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from ..models import models
from .database import get_db
from .schema_utils import ensure_organization_contact_columns
from ..core import auth_utils

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="인증 토큰이 유효하지 않습니다.")
    except JWTError:
        raise HTTPException(status_code=401, detail="인증 토큰이 유효하지 않습니다.")
    
    ensure_organization_contact_columns(db)
    org = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
    if org is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return org

def ensure_verified(current_org: models.Organization = Depends(get_current_user)):
    if current_org.verification_status != "verified":
        raise HTTPException(status_code=403, detail="사업자 등록 승인이 완료된 후 이용 가능합니다.")
    return current_org

def ensure_subscribed(current_org: models.Organization = Depends(ensure_verified)):
    if current_org.plan == "none":
        raise HTTPException(status_code=403, detail="요금제 구독 후 이용 가능합니다.")
    return current_org
def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)), db: Session = Depends(get_db)):
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        if payload.get("type") != "access":
            return None
        email: str = payload.get("sub")
        if email is None:
            return None
        
        ensure_organization_contact_columns(db)
        org = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
        return org
    except JWTError:
        return None
