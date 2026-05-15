"""
File    : backend/routers/auth_router.py
Author  : 김민정
Create  : 2026-04-23
Description : 인증(Login/Register/Verify/Reset) 관련 API 라우터 (Redis 기반)

Modification History:
    - 2026-04-23 (김민정) : 모듈화 및 Redis 기반 이메일 인증 시스템 구현
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경
    - 2026-05-15 (김지우) : 이메일 인증 기반 프로필 정보 변경 API 추가
    - 2026-05-15 (김지우) : 담당자 정보 관리 및 담당자 이메일 우선 인증 발송 처리
"""
import traceback
import re
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from jose import jwt

from ..models import models, schemas
from ..core import auth_utils as auth
from ..core import database
from ..core.plan_utils import get_effective_max_seats
from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..core.notification_utils import create_user_notification
from ..core.schema_utils import ensure_organization_contact_columns
from ..services.email_service import EmailService
from ..services.s3_service import S3Service
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def get_profile_verification_email(org: models.Organization) -> str:
    return (org.contact_email or org.admin_email or "").strip()

def build_user_payload(db: Session, org: models.Organization) -> dict:
    return {
        "email": org.admin_email,
        "companyName": org.company_name,
        "contactName": org.contact_name,
        "contactEmail": org.contact_email,
        "role": "user",
        "orgId": str(org.id),
        "verification_status": org.verification_status,
        "plan": org.plan,
        "max_seats": get_effective_max_seats(db, org),
        "business_reg_s3_url": org.business_reg_s3_url,
    }

@router.post("/register", response_model=schemas.CommonResponse)
async def register(
    company_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        ensure_organization_contact_columns(db)
        if db.query(models.Organization).filter(models.Organization.admin_email == email).first():
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        
        # 1. Redis에서 이메일 인증 통과 여부 확인
        pending_data = AuthService.get_pending_signup(email)
        if not pending_data or not pending_data.get("verified"):
            raise HTTPException(status_code=400, detail="이메일 인증이 완료되지 않았습니다.")
        
        # 2. S3 업로드
        s3_url = await S3Service.upload_certificate(email, certificate)

        # 3. DB 바로 생성 (이메일 인증 선행됨)
        new_org = models.Organization(
            admin_email=email,
            password_hash=auth.get_password_hash(password),
            company_name=company_name,
            plan="none",
            verification_status="pending",
            business_reg_s3_url=s3_url,
            is_active=True
        )
        db.add(new_org)
        db.commit()
        
        AuthService.delete_pending_signup(email)

        return {"success": True, "message": "회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다."}
    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-email", response_model=schemas.LoginResponse)
async def verify_email(data: schemas.EmailVerification, db: Session = Depends(get_db)):
    ensure_organization_contact_columns(db)
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
            "user": build_user_payload(db, new_org)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 저장 오류: {str(e)}")

@router.post("/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.OrgLogin, db: Session = Depends(get_db)):
    """
    로그인 통합 엔드포인트:
    1. system_admins 테이블을 먼저 조회 (관리자 우선순위)
    2. 관리자가 아니면 organizations 테이블 조회 (사용자)
    """
    ensure_organization_contact_columns(db)

    # 1. 시스템 관리자(Admin) 확인
    # DB의 system_admins 테이블에 없는 role 컬럼 조회를 피하기 위해 개별 필드만 선택합니다.
    from sqlalchemy import select
    admin_stmt = select(
        models.SystemAdmin.id, 
        models.SystemAdmin.email, 
        models.SystemAdmin.password_hash
    ).where(models.SystemAdmin.email == login_data.email)
    
    admin_result = db.execute(admin_stmt).first()
    
    # 관리자 정보가 있고 비밀번호가 일치하면 관리자용 토큰 반환
    if admin_result and auth.verify_password(login_data.password, admin_result.password_hash):
        return {
            "success": True,
            "token": auth.create_access_token(data={"sub": admin_result.email}),
            "refresh_token": auth.create_refresh_token(data={"sub": admin_result.email}),
            "user": {
                "email": admin_result.email, 
                "companyName": "Admin System", 
                "role": "admin", 
                "orgId": "admin", 
                "verification_status": "verified", 
                "plan": "enterprise",
                "max_seats": 0
            }
        }

    # 2. 일반 사용자(Organization) 확인
    org = db.query(models.Organization).filter(models.Organization.admin_email == login_data.email).first()
    
    if org and auth.verify_password(login_data.password, org.password_hash):
        if not org.is_active:
            raise HTTPException(status_code=403, detail="비활성화된 계정입니다. 관리자에게 문의하세요.")
            
        return {
            "success": True,
            "token": auth.create_access_token(data={"sub": org.admin_email}),
            "refresh_token": auth.create_refresh_token(data={"sub": org.admin_email}),
            "user": build_user_payload(db, org)
        }

    # 둘 다 해당하지 않는 경우
    raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 일치하지 않습니다.")

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

from pydantic import BaseModel

class EmailCheckRequest(BaseModel):
    email: str

class CompanyCheckRequest(BaseModel):
    company_name: str

class ProfileUpdateRequest(BaseModel):
    code: str
    company_name: str | None = None
    email: str | None = None
    new_password: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None

@router.post("/check-email", response_model=schemas.CommonResponse)
async def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    ensure_organization_contact_columns(db)
    if db.query(models.Organization).filter(models.Organization.admin_email == data.email).first():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    return {"success": True, "message": "사용 가능한 이메일입니다."}

@router.post("/check-company", response_model=schemas.CommonResponse)
async def check_company(data: CompanyCheckRequest, db: Session = Depends(get_db)):
    ensure_organization_contact_columns(db)
    if db.query(models.Organization).filter(models.Organization.company_name == data.company_name).first():
        raise HTTPException(status_code=400, detail="이미 사용중인 기업명입니다.")
    return {"success": True, "message": "사용 가능한 기업명입니다."}

@router.post("/send-code", response_model=schemas.CommonResponse)
async def send_code(data: EmailCheckRequest, db: Session = Depends(get_db)):
    ensure_organization_contact_columns(db)
    if db.query(models.Organization).filter(models.Organization.admin_email == data.email).first():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    
    v_code = AuthService.generate_verification_code()
    AuthService.save_pending_signup(data.email, {"code": v_code})
    
    try:
        EmailService.send_verification_email(data.email, v_code)
    except Exception as e:
        print(f"[Email Error] {e}")
        
    return {"success": True, "message": "인증 코드가 발송되었습니다."}

@router.post("/verify-code", response_model=schemas.CommonResponse)
async def verify_code(data: schemas.EmailVerification, db: Session = Depends(get_db)):
    pending_data = AuthService.get_pending_signup(data.email)
    if not pending_data or pending_data.get("code") != data.code:
        raise HTTPException(status_code=400, detail="인증 코드가 일치하지 않거나 만료되었습니다.")
    
    # 인증 성공 시 verified 플래그를 Redis에 남김
    pending_data["verified"] = True
    AuthService.save_pending_signup(data.email, pending_data)
    return {"success": True, "message": "이메일 인증이 완료되었습니다."}

@router.post("/profile-change/request-code", response_model=schemas.CommonResponse)
async def request_profile_change_code(current_user: models.Organization = Depends(get_current_user)):
    verification_email = get_profile_verification_email(current_user)
    if not verification_email:
        raise HTTPException(status_code=400, detail="인증 코드를 받을 이메일이 없습니다.")

    v_code = AuthService.generate_verification_code()
    AuthService.save_password_reset_code(verification_email, v_code)

    try:
        EmailService.send_verification_email(verification_email, v_code)
    except Exception as e:
        print(f"[Email Error] {e}")

    return {"success": True, "message": "인증 코드가 발송되었습니다."}

@router.patch("/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.Organization = Depends(get_current_user),
):
    verification_email = get_profile_verification_email(current_user)
    saved_code = AuthService.get_password_reset_code(verification_email)
    if not saved_code or saved_code != data.code:
        raise HTTPException(status_code=400, detail="인증 코드가 일치하지 않거나 만료되었습니다.")

    next_company_name = data.company_name.strip() if data.company_name else None
    next_email = data.email.strip() if data.email else None
    next_password = data.new_password.strip() if data.new_password else None
    next_contact_name = data.contact_name.strip() if data.contact_name is not None else None
    next_contact_email = data.contact_email.strip() if data.contact_email is not None else None
    changed_labels: list[str] = []

    if not any([next_company_name, next_email, next_password, next_contact_name, next_contact_email]):
        raise HTTPException(status_code=400, detail="변경할 항목이 없습니다.")

    if next_company_name and next_company_name != current_user.company_name:
        duplicated_company = db.query(models.Organization).filter(
            models.Organization.company_name == next_company_name,
            models.Organization.id != current_user.id,
        ).first()
        if duplicated_company:
            raise HTTPException(status_code=400, detail="이미 사용 중인 기업명입니다.")
        current_user.company_name = next_company_name
        changed_labels.append("기업명")

    if next_email and next_email != current_user.admin_email:
        if not EMAIL_PATTERN.match(next_email):
            raise HTTPException(status_code=400, detail="올바른 기업 이메일을 입력해주세요.")
        duplicated_email = db.query(models.Organization).filter(
            models.Organization.admin_email == next_email,
            models.Organization.id != current_user.id,
        ).first()
        if duplicated_email:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
        current_user.admin_email = next_email
        changed_labels.append("기업 이메일")

    if next_password:
        if len(next_password) < 8:
            raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")
        current_user.password_hash = auth.get_password_hash(next_password)
        changed_labels.append("비밀번호")

    if data.contact_name is not None:
        if not next_contact_name:
            raise HTTPException(status_code=400, detail="담당자 이름을 입력해주세요.")
        current_user.contact_name = next_contact_name
        changed_labels.append("담당자 이름")

    if data.contact_email is not None:
        if not next_contact_email or not EMAIL_PATTERN.match(next_contact_email):
            raise HTTPException(status_code=400, detail="올바른 담당자 이메일을 입력해주세요.")
        current_user.contact_email = next_contact_email
        changed_labels.append("담당자 이메일")

    create_user_notification(
        db,
        org_id=str(current_user.id),
        type_="profile_updated",
        title="계정 정보가 수정되었습니다",
        message=f"{', '.join(changed_labels) if changed_labels else '계정 정보'} 항목이 변경되었습니다.",
        action_url="/profile?tab=security",
    )

    db.commit()
    db.refresh(current_user)
    AuthService.delete_password_reset_code(verification_email)

    token = auth.create_access_token(data={"sub": current_user.admin_email})
    refresh_token = auth.create_refresh_token(data={"sub": current_user.admin_email})

    return {
        "success": True,
        "message": "계정 정보가 변경되었습니다.",
        "token": token,
        "refresh_token": refresh_token,
        "user": build_user_payload(db, current_user)
    }

@router.get("/me")
async def get_me(
    db: Session = Depends(get_db),
    current_user: models.Organization = Depends(get_current_user)
):
    """현재 로그인 사용자의 최신 프로필 정보 반환"""
    return {
        "success": True,
        "user": build_user_payload(db, current_user)
    }
