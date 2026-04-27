"""
File    : backend/routers/admin_router.py
Author  : Antigravity
Create  : 2026-04-23
Description : 시스템 관리자 전용 API 라우터 (회원 승인 및 관리 고도화)

Modification History:
    - 2026-04-26 (김민정) : 기업 목록 조회 시 결제 상세 정보 포함 로직 추가 및 S3 삭제 로직 정비
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import jwt, JWTError
import datetime
import uuid
import os

from ..models import models, schemas
from ..core import auth_utils
from ..core.database import get_db
from ..services.email_service import EmailService
from ..core.dependencies import security
from ..services.s3_service import S3Service

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# ── PIN 로그인 ─────────────────────────────────────────────
@router.post("/pin-login")
def pin_login(payload: dict = Body(...)):
    """관리자 PIN 번호로 로그인 — JWT 토큰 발급"""
    pin = str(payload.get("pin", "")).strip()
    admin_pin = str(os.getenv("ADMIN_PIN", "")).strip()

    if not admin_pin:
        raise HTTPException(status_code=500, detail="서버에 ADMIN_PIN이 설정되지 않았습니다.")
    if pin != admin_pin:
        raise HTTPException(status_code=401, detail="PIN이 올바르지 않습니다.")

    token = auth_utils.create_access_token(
        data={"sub": "system_admin", "auth_type": "pin"}
    )
    return {"success": True, "token": token}

# ── 관리자 권한 확인 의존성 ────────────────────────────────
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        auth_type: str = payload.get("auth_type")

        # PIN 로그인으로 발급된 토큰
        if auth_type == "pin" and payload.get("sub") == "system_admin":
            return models.SystemAdmin(id="00000000-0000-0000-0000-000000000000", email="system_admin")

        # 기존 DB 기반 토큰
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        admin = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == email).first()
        if not admin:
            raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/pending-approvals")
def get_pending_approvals(db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """가입 승인 대기 중인 모든 기업 목록 조회"""
    pending_orgs = db.query(models.Organization).filter(
        models.Organization.verification_status == "pending"
    ).order_by(models.Organization.created_at.desc()).all()
    
    results = []
    for org in pending_orgs:
        results.append({
            "id": str(org.id),
            "company_name": org.company_name,
            "admin_email": org.admin_email,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "business_reg_s3_url": S3Service.get_presigned_url(org.business_reg_s3_url),
            "verification_status": org.verification_status
        })
    return results

@router.post("/approve/{org_id}")
def approve_organization(org_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 가입 승인 처리"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.verification_status = "verified"
    org.verified_by = current_admin.id
    org.verified_at = datetime.datetime.now()
    db.commit()
    
    try:
        EmailService.send_approval_notification(org.admin_email, org.company_name, is_approved=True)
    except: pass
    
    return {"success": True, "message": f"{org.company_name} 승인 완료"}

@router.post("/reject/{org_id}")
def reject_organization(org_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 가입 거절 처리"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    reason = payload.get("reason", "서류 미비")
    org.verification_status = "rejected"
    db.commit()
    
    try:
        EmailService.send_approval_notification(org.admin_email, org.company_name, is_approved=False, reason=reason)
    except: pass
    
    return {"success": True, "message": f"{org.company_name} 승인 거절 완료"}

@router.get("/organizations")
def get_all_organizations(
    company_name: Optional[str] = None,    
    plan: Optional[str] = None,    
    db: Session = Depends(get_db),    
    current_admin: models.SystemAdmin = Depends(get_current_admin)
    ):    
    """전체 회원(기업) 목록 조회 - 검색 및 필터링 지원"""    
    query = db.query(models.Organization)
    if company_name:
        query =query.filter(models.Organization.company_name.ilike(f"%{company_name}%"))
    if plan:
        query = query.filter(models.Organization.plan == plan)

    orgs = query.order_by(models.Organization.created_at.desc()).all()
    results = []
    for org in orgs:
        last_payment = db.query(models.Payment).filter(
            models.Payment.org_id == org.id,
            models.Payment.status == "completed"
        ).order_by(models.Payment.created_at.desc()).first()
        used_seats_count = db.query(models.Device).join(models.License).filter(
            models.License.org_id == org.id,
            models.Device.is_active == True
        ).count()
        results.append({
            "id": str(org.id),
            "company_name": org.company_name,
            "admin_email": org.admin_email,
            "plan": org.plan,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "used_seats": used_seats_count,
            "payment_info": {
                "added_seats": last_payment.added_seats if last_payment else 0,
                "last_payment_date": last_payment.completed_at.isoformat() if last_payment and last_payment.completed_at else None,
                "billing_period_end": last_payment.billing_period_end.isoformat()if last_payment and last_payment.billing_period_end else None,
                "payment_method": last_payment.payment_method if last_payment else "N/A",
                "pg_provider": last_payment.pg_provider if last_payment else"N/A",
                "pg_transaction_id": last_payment.pg_transaction_id if last_payment else "N/A",
                "total_seats": org.max_seats or 0
            }
        })
    return results

@router.get("/plan-history/{org_id}")
def get_org_plan_history(org_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """특정 기업의 요금제 변경/결제 내역 조회"""
    payments = db.query(models.Payment).filter(
        models.Payment.org_id == org_id,
        models.Payment.status == "completed"
    ).order_by(models.Payment.created_at.desc()).all()
    
    return payments

@router.get("/dashboard-stats")
def get_total_usage_stats(db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """시스템 전체 통계"""
    from sqlalchemy import func
    total_calls = db.query(func.sum(models.ApiUsageLog.total_requests)).scalar() or 0
    total_tokens = db.query(func.sum(models.ApiUsageLog.total_tokens_used)).scalar() or 0
    total_orgs = db.query(func.count(models.Organization.id)).scalar() or 0
    total_keys = db.query(func.count(models.License.id)).scalar() or 0
    
    return {
        "total_calls": total_calls,
        "total_tokens": total_tokens,
        "total_orgs": total_orgs,
        "total_keys": total_keys
    }

@router.get("/devices")
def get_all_devices(org_id: Optional[str] = None, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """전체 활성 기기 목록 조회 - 기업별 필터 지원"""
    devices = db.query(models.Device).all()
    result = []
    
    for dev in devices:
        license = db.query(models.License).filter(models.License.id == dev.license_id).first()
        if not license: continue
        
        if org_id and org_id != "all" and str(license.org_id) != org_id:
            continue
            
        org = db.query(models.Organization).filter(models.Organization.id == license.org_id).first()
        result.append({
            "id": str(dev.id),
            "machine_id": dev.machine_id,
            "display_name": dev.display_name,
            "is_active": dev.is_active,
            "company_name": org.company_name if org else "N/A",
            "last_seen": dev.last_seen.isoformat() if dev.last_seen else None
        })
    return result

@router.delete("/devices/{device_id}")
def block_device(device_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기기 차단"""
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"success": True, "message": "기기 차단 완료"}

@router.post("/organizations/{org_id}/plan")
def update_org_plan(org_id: str, plan_data: dict, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 요금제 수동 변경"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    new_plan = plan_data.get("plan")
    org.plan = new_plan
    db.commit()
    return {"success": True, "message": f"{org.company_name} 플랜 변경 완료"}

@router.get("/usage-stats")
def get_admin_usage_stats(
    start_date: str,
    end_date: str,
    org_id: str = None, 
    db: Session = Depends(get_db),
    current_admin: models.SystemAdmin = Depends(get_current_admin)
):
    """시스템 전체 또는 기업별 일별 사용량 통계"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")
    
    query = db.query(
        models.ApiUsageLog.date_dt,
        func.sum(models.ApiUsageLog.total_requests).label("total_calls"),
        func.sum(models.ApiUsageLog.total_tokens_used).label("total_tokens")
    ).filter(
        models.ApiUsageLog.date_dt >= start_dt,
        models.ApiUsageLog.date_dt <= end_dt
    )
    
    if org_id and org_id != "all":
        query = query.filter(models.ApiUsageLog.org_id == org_id)
        
    logs = query.group_by(models.ApiUsageLog.date_dt).all()
    log_map = {str(log.date_dt): {"calls": log.total_calls or 0, "tokens": log.total_tokens or 0} for log in logs}
    
    daily_stats = []
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.strftime("%Y-%m-%d")
        stats = log_map.get(d_str, {"calls": 0, "tokens": 0})
        daily_stats.append({
            "date": d_str,
            "total_requests": stats["calls"],
            "total_tokens_used": stats["tokens"]
        })
        curr += timedelta(days=1)
        
    return {"success": True, "daily_stats": daily_stats}

@router.get("/tickets")
def get_support_tickets(status: Optional[str] = None, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """모든 Q&A 티켓 조회"""
    query = db.query(models.SupportInquiry)
    if status:
        query = query.filter(models.SupportInquiry.status == status)
    
    tickets = query.order_by(models.SupportInquiry.created_at.desc()).all()
    results = []
    for t in tickets:
        org = db.query(models.Organization).filter(models.Organization.id == t.org_id).first()
        results.append({
            "id": t.id,
            "company_name": org.company_name if org else "Unknown",
            "inquiry_type": t.inquiry_type,
            "title": t.title,
            "content": t.content,
            "status": t.status,
            "answer": t.answer_content,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return results

@router.post("/tickets/{ticket_id}/answer")
def answer_support_ticket(ticket_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """Q&A 답변 등록 및 알림 메일 발송"""
    ticket = db.query(models.SupportInquiry).filter(models.SupportInquiry.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    answer = payload.get("answer")
    ticket.answer_content = answer
    ticket.status = "answered"
    ticket.answered_at = datetime.datetime.now()
    db.commit()
    
    try:
        org = db.query(models.Organization).filter(models.Organization.id == ticket.org_id).first()
        if org:
            EmailService.send_qna_answer_notification(org.admin_email, ticket.title)
    except: pass
    
    return {"success": True, "message": "답변 등록 완료"}

# 카테고리별 파일명 접두어 정의
CATEGORY_PREFIXES = {
    "소방": "fire_",
    "건축": "arch_",
    "배관": "pipe_",
    "전기": "elec_"
}

@router.get("/documents")
def get_documents(category: Optional[str] = None, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """파일명 접두어 기반 문서 목록 조회"""
    query = db.query(models.DocumentsS3)
    
    if category and category in CATEGORY_PREFIXES:
        prefix = CATEGORY_PREFIXES[category]
        query = query.filter(models.DocumentsS3.file_name.like(f"{prefix}%"))
        
    docs = query.order_by(models.DocumentsS3.created_at.desc()).all()
    results = []
    for doc in docs:
        results.append({
            "id": str(doc.id),
            "file_name": doc.file_name,
            "s3_url": S3Service.get_presigned_url(doc.s3_url) if doc.s3_url else None,
            "raw_s3_url": doc.s3_url,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        })
    return results

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...), 
    category: str = Form(...),
    db: Session = Depends(get_db), 
    current_admin: models.SystemAdmin = Depends(get_current_admin)
):
    """선택한 카테고리 접두어를 파일명에 붙여 업로드"""
    prefix = CATEGORY_PREFIXES.get(category, "")
    original_filename = file.filename
    new_filename = original_filename if original_filename.startswith(prefix) else f"{prefix}{original_filename}"
    
    file.filename = new_filename
    
    s3_url = await S3Service.upload_file(file, folder="documents")
    if not s3_url:
        raise HTTPException(status_code=500, detail="S3 업로드 실패")
    
    doc = models.DocumentsS3(
        file_name=new_filename,
        s3_url=s3_url
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {
        "success": True, 
        "message": f"[{category}] {new_filename} 업로드 완료",
        "document": {
            "id": str(doc.id),
            "file_name": doc.file_name,
            "s3_url": S3Service.get_presigned_url(doc.s3_url)
        }
    }

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """S3 문서 삭제"""
    doc = db.query(models.DocumentsS3).filter(models.DocumentsS3.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    S3Service.delete_file(doc.s3_url)
    
    db.delete(doc)
    db.commit()
    
    return {"success": True, "message": "문서 삭제 완료"}
