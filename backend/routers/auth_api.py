"""
File    : backend/routers/auth_api.py
Author  : 김민정
Create  : 2026-04-23
Description : 인증(Login/Register/Verify/Reset) 관련 API 라우터 (Redis 기반)

Modification History:
    - 2026-04-23 (김민정) : 모듈화 및 Redis 기반 이메일 인증 시스템 구현
"""
import traceback
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from jose import jwt

from .. import models, schemas, auth_utils as auth
from ..database import get_db
from ..email_service import EmailService
from ..services.s3_service import S3Service
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=schemas.CommonResponse)
async def register(
    company_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        if db.query(models.Organization).filter(models.Organization.admin_email == email).first():
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 1. S3 업로드 (S3Service 활용)
        s3_url = await S3Service.upload_certificate(email, certificate)

        # 2. 인증코드 생성 및 Redis 저장 (AuthService 활용)
        v_code = AuthService.generate_verification_code()
        signup_data = {
            "company_name": company_name,
            "admin_email": email,
            "password_hash": auth.get_password_hash(password),
            "business_reg_s3_url": s3_url,
            "code": v_code
        }
        AuthService.save_pending_signup(email, signup_data)

        # 3. 이메일 발송
        try:
            EmailService.send_verification_email(email, v_code)
        except Exception as e:
            print(f"[Email Error] {e}")

        return {"success": True, "message": "인증 메일이 발송되었습니다."}
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-email", response_model=schemas.LoginResponse)
async def verify_email(data: schemas.EmailVerification, db: Session = Depends(get_db)):
    pending_data = AuthService.get_pending_signup(data.email)
    if not pending_data:
        raise HTTPException(status_code=400, detail="인증 시간이 만료되었습니다.")
    
    if pending_data["code"] != data.code:
        raise HTTPException(status_code=400, detail="코드가 일치하지 않습니다.")
    
    try:
        new_org = models.Organization(
            admin_email=pending_data["admin_email"],
            password_hash=pending_data["password_hash"],
            company_name=pending_data["company_name"],
            plan="none",
            verification_status="pending",
            business_reg_s3_url=pending_data["business_reg_s3_url"],
            is_active=True
        )
        db.add(new_org)
        db.commit()
        db.refresh(new_org)
        
        AuthService.delete_pending_signup(data.email)
        
        return {
            "success": True,
            "token": auth.create_access_token(data={"sub": new_org.admin_email}),
            "refresh_token": auth.create_refresh_token(data={"sub": new_org.admin_email}),
            "user": {
                "email": new_org.admin_email,
                "companyName": new_org.company_name,
                "role": "user",
                "orgId": str(new_org.id),
                "verification_status": new_org.verification_status,
                "plan": new_org.plan
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 저장 오류: {str(e)}")

@router.post("/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.OrgLogin, db: Session = Depends(get_db)):
    # 1. 시스템 관리자 확인
    admin = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == login_data.email).first()
    if admin and auth.verify_password(login_data.password, admin.password_hash):
        return {
            "success": True,
            "token": auth.create_access_token(data={"sub": admin.email}),
            "refresh_token": auth.create_refresh_token(data={"sub": admin.email}),
            "user": {"email": admin.email, "companyName": "Admin", "role": "admin", "orgId": "admin", "verification_status": "verified", "plan": "enterprise"}
        }

    # 2. 일반 사용자 확인
    org = db.query(models.Organization).filter(models.Organization.admin_email == login_data.email).first()
    if not org or not auth.verify_password(login_data.password, org.password_hash):
        raise HTTPException(status_code=401, detail="정보가 일치하지 않습니다.")
    
    return {
        "success": True,
        "token": auth.create_access_token(data={"sub": org.admin_email}),
        "refresh_token": auth.create_refresh_token(data={"sub": org.admin_email}),
        "user": {
            "email": org.admin_email, "companyName": org.company_name, "role": "user", 
            "orgId": str(org.id), "verification_status": org.verification_status, "plan": org.plan
        }
    }

@router.post("/request-password-reset")
async def request_password_reset(data: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    if not db.query(models.Organization).filter(models.Organization.admin_email == data.email).first():
        raise HTTPException(status_code=404, detail="등록된 사용자가 아닙니다.")
    
    v_code = AuthService.generate_verification_code()
    AuthService.save_password_reset_code(data.email, v_code)
    
    try:
        EmailService.send_verification_email(data.email, v_code)
    except: pass
    return {"success": True, "message": "코드가 발송되었습니다."}

@router.post("/reset-password")
async def reset_password(data: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    saved_code = AuthService.get_password_reset_code(data.email)
    if not saved_code or saved_code != data.code:
        raise HTTPException(status_code=400, detail="코드 인증 실패")
    
    org = db.query(models.Organization).filter(models.Organization.admin_email == data.email).first()
    if not org: raise HTTPException(status_code=404, detail="사용자 없음")
    
    org.password_hash = auth.get_password_hash(data.new_password)
    db.commit()
    AuthService.delete_password_reset_code(data.email)
    return {"success": True, "message": "변경 완료"}

@router.post("/refresh")
def refresh_token(payload: dict = Body(...), db: Session = Depends(get_db)):
    rt = payload.get("refresh_token")
    try:
        decoded = jwt.decode(rt, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = decoded.get("sub")
        return {"success": True, "token": auth.create_access_token(data={"sub": email})}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")