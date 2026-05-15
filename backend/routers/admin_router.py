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
from typing import Any, List, Optional
from jose import jwt, JWTError
import datetime
import uuid
import os
import re

from ..models import models, schemas
from ..core import auth_utils
from ..core.database import get_db
from ..core.plan_utils import get_effective_max_seats
from ..services.email_service import EmailService
from ..core.notification_utils import create_user_notification
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
        
        # access 토큰 타입 검증 추가
        if payload.get("type") != "access":
            print(f"[Admin Auth] Invalid token type: {payload.get('type')}")
            raise HTTPException(status_code=401, detail="Invalid token type")

        auth_type: str = payload.get("auth_type")
        sub: str = payload.get("sub")

        # PIN 로그인으로 발급된 토큰 (시스템 관리자)
        if auth_type == "pin" and sub == "system_admin":
            return models.SystemAdmin(id="00000000-0000-0000-0000-000000000000", email="system_admin")

        # 기존 DB 기반 토큰 (DB 관리자)
        if sub is None:
            print("[Admin Auth] Token payload missing 'sub'")
            raise HTTPException(status_code=401, detail="Invalid token: missing subject")
            
        admin = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == sub).first()
        if not admin:
            print(f"[Admin Auth] Admin not found in DB: {sub}")
            raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
        return admin

    except jwt.ExpiredSignatureError:
        print("[Admin Auth] Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTClaimsError:
        print("[Admin Auth] Token claims are invalid")
        raise HTTPException(status_code=401, detail="Invalid token claims")
    except JWTError as e:
        print(f"[Admin Auth] JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"[Admin Auth] Unexpected Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

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
    org.verified_by = current_admin.id if current_admin.id != "00000000-0000-0000-0000-000000000000" else None
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
                "total_seats": get_effective_max_seats(db, org)
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
    if ticket.org_id:
        create_user_notification(
            db,
            org_id=str(ticket.org_id),
            type_="support_answered",
            title="문의 답변이 등록되었습니다",
            message="남기신 문의에 대해서 답변이 달렸습니다.",
            action_url="/inquiries",
            resource_type="support_inquiry",
            resource_id=str(ticket.id),
            dedupe_resource=True,
        )
    db.commit()
    
    try:
        org = db.query(models.Organization).filter(models.Organization.id == ticket.org_id).first()
        if org:
            EmailService.send_qna_answer_notification(org.admin_email, ticket.title)
    except: pass
    
    return {"success": True, "message": "답변 등록 완료"}

# 관리자 문서 업로드는 공통 표준 레이어 S3 구조를 기준으로 저장한다.
DOCUMENT_DOMAINS = {
    "arch": {"label": "건축", "legacy_prefix": "arch_"},
    "elec": {"label": "전기", "legacy_prefix": "elec_"},
    "fire": {"label": "소방", "legacy_prefix": "fire_"},
    "pipe": {"label": "배관", "legacy_prefix": "pipe_"},
}

DOCUMENT_TYPES = {
    "spec": {"label": "시방서", "folder": "spec", "category": "spec", "runpod_doc_type": "specification"},
    "standard": {"label": "법령/기술지침", "folder": "standard", "category": "standard", "runpod_doc_type": "regulation"},
}

# 카테고리별 파일명 접두어 정의
CATEGORY_PREFIXES = {
    "소방": "fire_",
    "건축": "arch_",
    "배관": "pipe_",
    "전기": "elec_"
}

LEGACY_CATEGORY_TO_DOMAIN = {
    value["label"]: domain for domain, value in DOCUMENT_DOMAINS.items()
}

RUNPOD_GLOBAL_ORG_ID = os.getenv("RUNPOD_GLOBAL_ORG_ID", "00000000-0000-0000-0000-000000000000")


def resolve_document_domain(domain: Optional[str], category: Optional[str] = None) -> str:
    value = (domain or "").strip()
    if value in DOCUMENT_DOMAINS:
        return value
    if value in LEGACY_CATEGORY_TO_DOMAIN:
        return LEGACY_CATEGORY_TO_DOMAIN[value]

    legacy = (category or "").strip()
    if legacy in LEGACY_CATEGORY_TO_DOMAIN:
        return LEGACY_CATEGORY_TO_DOMAIN[legacy]

    raise HTTPException(status_code=400, detail="지원하지 않는 문서 분야입니다.")


def resolve_document_type(doc_type: Optional[str]) -> str:
    value = (doc_type or "spec").strip()
    if value in DOCUMENT_TYPES:
        return value
    if value == "specification":
        return "spec"
    if value == "regulation":
        return "standard"

    raise HTTPException(status_code=400, detail="지원하지 않는 문서 종류입니다.")


def standard_document_prefix(domain: str, doc_type: str) -> str:
    return f"standards/{domain}/{DOCUMENT_TYPES[doc_type]['folder']}/"


def sanitize_document_stem(filename: str) -> str:
    stem = os.path.splitext(filename or "document")[0] or "document"
    safe = re.sub(r"[^a-zA-Z0-9가-힣._-]+", "_", stem).strip("._-")
    return safe[:120] or "document"


def build_standard_document_s3_key(document_id: str, filename: str, domain: str, doc_type: str) -> tuple[str, str]:
    normalized_domain = resolve_document_domain(domain)
    normalized_doc_type = resolve_document_type(doc_type)
    stem = f"{document_id}_{sanitize_document_stem(filename)}"
    return f"{standard_document_prefix(normalized_domain, normalized_doc_type)}{stem}.pdf", stem


def infer_domain_from_document(doc: models.DocumentS3) -> Optional[str]:
    s3_url = doc.s3_url or ""
    for domain in DOCUMENT_DOMAINS:
        if f"/standards/{domain}/" in s3_url or s3_url.startswith(f"standards/{domain}/"):
            return domain
    for domain, meta in DOCUMENT_DOMAINS.items():
        if (doc.file_name or "").startswith(meta["legacy_prefix"]):
            return domain
    return None


def infer_doc_type_from_document(doc: models.DocumentS3) -> Optional[str]:
    s3_url = doc.s3_url or ""
    if "/spec/" in s3_url or s3_url.startswith("standards/") and "/spec/" in s3_url:
        return "spec"
    if "/standard/" in s3_url or s3_url.startswith("standards/") and "/standard/" in s3_url:
        return "standard"
    return None


def document_response(doc: models.DocumentS3) -> dict[str, Any]:
    domain = infer_domain_from_document(doc)
    doc_type = infer_doc_type_from_document(doc)
    return {
        "id": str(doc.id),
        "file_name": doc.file_name,
        "s3_url": S3Service.get_presigned_url(doc.s3_url) if doc.s3_url else None,
        "raw_s3_url": doc.s3_url,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "domain": domain,
        "domain_label": DOCUMENT_DOMAINS.get(domain, {}).get("label") if domain else None,
        "doc_type": doc_type,
        "doc_type_label": DOCUMENT_TYPES.get(doc_type, {}).get("label") if doc_type else None,
    }


def build_runpod_document_input(
    file_url: str,
    doc_type: str,
    document_id: str,
    doc_name: str,
    domain: str,
    effective_date: Optional[str] = None,
) -> dict[str, Any]:
    normalized_doc_type = resolve_document_type(doc_type)
    normalized_domain = resolve_document_domain(domain)
    return {
        "file_url": file_url,
        "doc_type": DOCUMENT_TYPES[normalized_doc_type]["runpod_doc_type"],
        "document_id": document_id,
        "parent_document_id": document_id,
        "doc_name": doc_name,
        "domain": normalized_domain,
        "category": DOCUMENT_TYPES[normalized_doc_type]["category"],
        "org_id": RUNPOD_GLOBAL_ORG_ID,
        "effective_date": effective_date,
    }


async def request_runpod_document_processing(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("RUNPOD_API_KEY", "").strip()
    endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID", "").strip()
    if not api_key or not endpoint_id:
        raise HTTPException(status_code=500, detail="RUNPOD_API_KEY 또는 RUNPOD_ENDPOINT_ID가 설정되지 않았습니다.")

    try:
        import httpx
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="RunPod 호출에 필요한 httpx 패키지가 설치되지 않았습니다.") from exc

    wait_ms = int(os.getenv("RUNPOD_SYNC_WAIT_MS", "300000"))
    timeout_sec = max(60.0, wait_ms / 1000 + 30)
    url = f"https://api.runpod.ai/v2/{endpoint_id}/runsync?wait={wait_ms}"

    try:
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"input": payload},
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="RunPod 문서 처리 시간이 초과되었습니다.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"RunPod 요청 중 오류가 발생했습니다: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"RunPod 요청 실패: {response.text[:500]}")

    data = response.json()
    runpod_status = data.get("status")
    output = data.get("output")
    if output is None and data.get("status") == "success":
        output = data

    if runpod_status and runpod_status != "COMPLETED":
        raise HTTPException(status_code=504, detail=f"RunPod 작업이 완료되지 않았습니다: {runpod_status}")
    if not isinstance(output, dict):
        raise HTTPException(status_code=502, detail="RunPod 응답에 output이 없습니다.")
    if output.get("status") != "success":
        raise HTTPException(status_code=502, detail=output.get("message") or "RunPod 문서 처리에 실패했습니다.")

    return output


def cleanup_failed_document_upload(db: Session, doc_id: Optional[str], s3_url: Optional[str]) -> None:
    try:
        if s3_url:
            S3Service.delete_file(s3_url)
        if doc_id:
            doc = db.query(models.DocumentS3).filter(models.DocumentS3.id == doc_id).first()
            if doc:
                db.delete(doc)
                db.commit()
    except Exception as cleanup_error:
        db.rollback()
        print(f"[Admin Documents] Cleanup failed: {cleanup_error}")

@router.get("/documents")
def get_documents(
    category: Optional[str] = None,
    domain: Optional[str] = None,
    doc_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: models.SystemAdmin = Depends(get_current_admin),
):
    """공통 표준 문서 목록 조회"""
    selected_domain = resolve_document_domain(domain, category) if domain or category else None
    selected_doc_type = resolve_document_type(doc_type) if doc_type else None

    docs = db.query(models.DocumentS3).order_by(models.DocumentS3.created_at.desc()).all()
    if selected_domain:
        docs = [doc for doc in docs if infer_domain_from_document(doc) == selected_domain]
    if selected_doc_type:
        docs = [doc for doc in docs if infer_doc_type_from_document(doc) == selected_doc_type]

    return [document_response(doc) for doc in docs]

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...), 
    category: Optional[str] = Form(None),
    domain: Optional[str] = Form(None),
    doc_type: Optional[str] = Form("spec"),
    effective_date: Optional[str] = Form(None),
    db: Session = Depends(get_db), 
    current_admin: models.SystemAdmin = Depends(get_current_admin)
):
    """PDF를 S3에 저장하고 RunPod로 파싱/임베딩을 동기 처리"""
    original_filename = file.filename or "document.pdf"
    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드할 수 있습니다.")

    selected_domain = resolve_document_domain(domain, category)
    selected_doc_type = resolve_document_type(doc_type)
    document_id = str(uuid.uuid4())
    s3_key, doc_stem = build_standard_document_s3_key(
        document_id=document_id,
        filename=original_filename,
        domain=selected_domain,
        doc_type=selected_doc_type,
    )

    s3_url = None
    try:
        s3_url = await S3Service.upload_file_to_key(file, s3_key)
        if not s3_url:
            raise HTTPException(status_code=500, detail="S3 업로드 실패")

        doc = models.DocumentS3(
            id=document_id,
            file_name=original_filename,
            s3_url=s3_url,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        file_url = S3Service.get_presigned_url(s3_url, expires_in=3600) or s3_url
        runpod_payload = build_runpod_document_input(
            file_url=file_url,
            doc_type=selected_doc_type,
            document_id=document_id,
            doc_name=doc_stem,
            domain=selected_domain,
            effective_date=effective_date,
        )
        runpod_output = await request_runpod_document_processing(runpod_payload)

        return {
            "success": True,
            "message": f"[{DOCUMENT_DOMAINS[selected_domain]['label']} / {DOCUMENT_TYPES[selected_doc_type]['label']}] {original_filename} 처리 완료",
            "document": document_response(doc),
            "runpod": {
                "processed_chunks": runpod_output.get("processed_chunks", 0),
                "db_inserted_chunks": runpod_output.get("db_inserted_chunks", 0),
                "s3_md_path": runpod_output.get("s3_md_path"),
                "s3_json_path": runpod_output.get("s3_json_path"),
                "table_markdown_stats": runpod_output.get("table_markdown_stats"),
            },
        }
    except HTTPException:
        cleanup_failed_document_upload(db, document_id, s3_url)
        raise
    except Exception as exc:
        cleanup_failed_document_upload(db, document_id, s3_url)
        raise HTTPException(status_code=500, detail=f"문서 처리 중 오류가 발생했습니다: {exc}") from exc

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """S3 문서 삭제"""
    doc = db.query(models.DocumentS3).filter(models.DocumentS3.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    S3Service.delete_file(doc.s3_url)
    
    db.delete(doc)
    db.commit()
    
    return {"success": True, "message": "문서 삭제 완료"}

@router.post("/verify-business")
async def verify_business(
    payload: dict = Body(...),
    current_admin: models.SystemAdmin = Depends(get_current_admin)
):
    """국세청 사업자등록 진위확인 및 상태조회 프록시"""
    import httpx
    import urllib.parse
    import logging

    logger = logging.getLogger("uvicorn.error")

    nts_api_key = os.getenv("NTS_API_KEY", "")
    if not nts_api_key or nts_api_key == "YOUR_NTS_SERVICE_KEY_HERE":
        raise HTTPException(status_code=500, detail="국세청 API 키가 .env 파일에 설정되지 않았습니다.")

    b_no = payload.get("b_no", "").replace("-", "").strip()
    if not b_no or len(b_no) != 10:
        raise HTTPException(status_code=400, detail="올바른 사업자등록번호(10자리)를 입력해주세요.")

    # 공공데이터포털의 키는 이미 인코딩된 경우가 많으므로 중복 인코딩 방지 로직
    # 이미 %가 포함되어 있다면 인코딩된 것으로 간주
    if "%" in nts_api_key:
        decoded_key = urllib.parse.unquote(nts_api_key)
        encoded_key = nts_api_key # 그대로 유지
    else:
        encoded_key = urllib.parse.quote(nts_api_key)

    # 상태조회 (status) - 사업자번호만으로 상태 확인
    status_url = f"https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey={encoded_key}"
    status_body = {"b_no": [b_no]}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            logger.info(f"NTS API Request: {b_no}")
            status_res = await client.post(
                status_url,
                json=status_body,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            
            # HTTP 상태 코드 확인
            if status_res.status_code != 200:
                logger.error(f"NTS API Error Output: {status_res.text}")
                return {
                    "success": False,
                    "detail": f"국세청 API 오류 (HTTP {status_res.status_code})",
                    "raw": status_res.text
                }

            status_data = status_res.json()
            logger.info(f"NTS API Response: {status_data}")

        # 데이터 존재 여부 확인
        data_list = status_data.get("data", [])
        if not data_list:
            return {
                "success": False,
                "detail": "사업자 정보를 찾을 수 없습니다. (데이터 없음)"
            }

        result_status = data_list[0]
        # b_stt_cd: 01(계속), 02(휴업), 03(폐업)
        
        return {
            "success": True,
            "b_no": b_no,
            "status": result_status,
            "status_code": status_data.get("status_code", "")
        }
    except httpx.TimeoutException:
        logger.error("NTS API Timeout")
        raise HTTPException(status_code=504, detail="국세청 API 응답 시간이 초과되었습니다.")
    except Exception as e:
        logger.error(f"NTS API Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"조회 중 오류 발생: {str(e)}")
