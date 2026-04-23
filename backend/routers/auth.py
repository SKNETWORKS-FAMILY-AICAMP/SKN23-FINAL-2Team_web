"""
File    : backend/routers/auth.py
Author  : 김민정
Create  : 2026-04-23
Description : 인증(Login/Register/Refresh) 관련 API 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-23 (김민정) : 관리자 계정 권한 부여
"""
import os
import boto3
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from jose import jwt
import traceback

from .. import models, schemas, auth_utils as auth
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

# AWS S3 초기화
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-northeast-2")
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME", "skn23-final-2team")

@router.post("/register", response_model=schemas.LoginResponse)
async def register(
    company_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        db_org = db.query(models.Organization).filter(models.Organization.admin_email == email).first()
        if db_org:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 1. S3 업로드 처리
        file_ext = certificate.filename.split(".")[-1]
        s3_key = f"business_regs/{email}_{int(datetime.now().timestamp())}.{file_ext}"
        
        try:
            s3_client.upload_fileobj(
                certificate.file,
                BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": certificate.content_type}
            )
            s3_url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION', 'ap-northeast-2')}.amazonaws.com/{s3_key}"
        except Exception as s3_err:
            print(f"[S3 Upload Error] {str(s3_err)}")
            raise HTTPException(status_code=500, detail="사업자등록증 업로드 중 오류가 발생했습니다.")

        # 2. DB 저장
        hashed_pwd = auth.get_password_hash(password)
        new_org = models.Organization(
            admin_email=email,
            password_hash=hashed_pwd,
            company_name=company_name,
            plan="none",
            verification_status="pending",
            business_reg_s3_url=s3_url,
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
                "role": "user",
                "orgId": str(new_org.id),
                "verification_status": new_org.verification_status,
                "plan": new_org.plan
            }
        }
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"회원 등록 실패: {str(e)}")

@router.post("/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.OrgLogin, db: Session = Depends(get_db)):
    try:
        # 1. 시스템 관리자 테이블 먼저 확인
        admin = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == login_data.email).first()
        if admin and auth.verify_password(login_data.password, admin.password_hash):
            token = auth.create_access_token(data={"sub": admin.email})
            refresh_token = auth.create_refresh_token(data={"sub": admin.email})
            return {
                "success": True,
                "token": token,
                "refresh_token": refresh_token,
                "user": {
                    "email": admin.email,
                    "companyName": "System Administrator",
                    "role": "admin",
                    "orgId": "admin",
                    "verification_status": "verified",
                    "plan": "enterprise"
                }
            }

        # 2. 일반 기업 사용자 확인
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
                "role": "user",
                "orgId": str(org.id),
                "verification_status": org.verification_status,
                "plan": org.plan
            }
        }
    except HTTPException: raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
