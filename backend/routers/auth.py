"""
File    : backend/routers/auth.py
Author  : 김민정
Create  : 2026-04-23
Description : 인증(Login/Register/Refresh) 관련 API 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from jose import jwt
import traceback

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/refresh")
def refresh_token(payload: dict = Body(...), db: Session = Depends(get_db)):
    rt = payload.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    try:
        decoded = jwt.decode(rt, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        email = decoded.get("sub")
        org = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
        if not org:
            raise HTTPException(status_code=401, detail="User no longer exists")
            
        new_at = auth.create_access_token(data={"sub": email})
        return {"success": True, "token": new_at}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/register", response_model=schemas.LoginResponse)
def register(org_data: schemas.OrgCreate, db: Session = Depends(get_db)):
    try:
        db_org = db.query(models.Organization).filter(models.Organization.admin_email == org_data.admin_email).first()
        if db_org:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        hashed_pwd = auth.get_password_hash(org_data.password)
        new_org = models.Organization(
            admin_email=org_data.admin_email,
            password_hash=hashed_pwd,
            company_name=org_data.company_name or "Unknown",
            plan="none",
            verification_status="pending",
            is_active=True
        )
        db.add(new_org)
        db.commit()
        db.refresh(new_org)
        
        token = auth.create_access_token(data={"sub": new_org.admin_email})
        refresh_token = auth.create_refresh_token(data={"sub": new_org.admin_email})
        return {
            "success": True,
            "token": token,
            "refresh_token": refresh_token,
            "user": {
                "email": new_org.admin_email,
                "companyName": new_org.company_name,
                "role": "admin",
                "orgId": str(new_org.id),
                "verification_status": new_org.verification_status,
                "plan": new_org.plan
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[Register Error] {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"회원 등록 실패: {str(e)}")

@router.post("/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.OrgLogin, db: Session = Depends(get_db)):
    try:
        org = db.query(models.Organization).filter(models.Organization.admin_email == login_data.email).first()
        if not org or not auth.verify_password(login_data.password, org.password_hash):
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        
        token = auth.create_access_token(data={"sub": org.admin_email})
        refresh_token = auth.create_refresh_token(data={"sub": org.admin_email})
        return {
            "success": True,
            "token": token,
            "refresh_token": refresh_token,
            "user": {
                "email": org.admin_email,
                "companyName": org.company_name,
                "role": "admin",
                "orgId": str(org.id),
                "verification_status": org.verification_status,
                "plan": org.plan
            }
        }
    except HTTPException: raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
