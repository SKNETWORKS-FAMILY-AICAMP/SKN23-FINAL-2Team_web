"""
File    : backend/routers/admin.py
Author  : Antigravity
Create  : 2026-04-23
Description : 시스템 관리자 전용 API 라우터 (회원 승인 및 관리)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import jwt, JWTError

from .. import models, schemas, auth_utils
from ..database import get_db
from ..dependencies import security

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# 관리자 권한 확인 의존성 (system_admins 테이블 조회)
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # system_admins 테이블에서 관리자 확인
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
    
    # 프론트엔드에서 접근하기 쉽도록 필드 매핑 강화
    results = []
    for org in pending_orgs:
        results.append({
            "id": str(org.id),
            "company_name": org.company_name,
            "admin_email": org.admin_email,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "business_reg_s3_url": org.business_reg_s3_url, # 실제 S3 주소
            "verification_status": org.verification_status
        })
    return results

@router.get("/organizations")
def get_all_organizations(db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """전체 회원(기업) 목록 조회"""
    return db.query(models.Organization).order_by(models.Organization.created_at.desc()).all()

@router.post("/approve/{org_id}")
def approve_organization(org_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 가입 승인 처리"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.verification_status = "verified"
    org.verified_by = current_admin.id
    import datetime
    org.verified_at = datetime.datetime.now()
    
    db.commit()
    return {"success": True, "message": f"{org.company_name} 승인 완료"}

@router.post("/reject/{org_id}")
def reject_organization(org_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 가입 거절 처리"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.verification_status = "rejected"
    db.commit()
    return {"success": True, "message": f"{org.company_name} 승인 거절"}

@router.get("/dashboard-stats")
def get_total_usage_stats(db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """시스템 전체 통계 (대시보드 상단 카드용)"""
    from sqlalchemy import func
    total_calls = db.query(func.sum(models.APIUsageLog.total_requests)).scalar() or 0
    total_tokens = db.query(func.sum(models.APIUsageLog.total_tokens_used)).scalar() or 0
    total_orgs = db.query(func.count(models.Organization.id)).scalar() or 0
    total_keys = db.query(func.count(models.License.id)).scalar() or 0
    
    return {
        "total_calls": total_calls,
        "total_tokens": total_tokens,
        "total_orgs": total_orgs,
        "total_keys": total_keys
    }

@router.get("/devices")
def get_all_devices(db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """전체 활성 기기 목록 조회 (Machine ID 모니터링용)"""
    # models.py에 명시된 필드 기반 조회
    devices = db.query(models.Device).all()
    
    result = []
    for dev in devices:
        # 라이선스와 조직 정보를 가져오기 위해 수동 매핑 (Relationship이 없을 경우 대비)
        license = db.query(models.License).filter(models.License.id == dev.license_id).first()
        org_name = "N/A"
        if license:
            org = db.query(models.Organization).filter(models.Organization.id == license.org_id).first()
            if org:
                org_name = org.company_name

        result.append({
            "id": str(dev.id),
            "machine_id": dev.machine_id,
            "hostname": getattr(dev, "hostname", "CAD-PC"), # hostname 필드가 없을 경우 대비
            "is_active": dev.is_active,
            "company_name": org_name,
            "last_seen": dev.last_seen.isoformat() if dev.last_seen else None
        })
    return result

@router.delete("/devices/{device_id}")
def block_device(device_id: str, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기기 차단 (비정상 접속 차단)"""
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"success": True, "message": "기기가 성공적으로 차단되었습니다."}

@router.post("/organizations/{org_id}/plan")
def update_org_plan(org_id: str, plan_data: dict, db: Session = Depends(get_db), current_admin: models.SystemAdmin = Depends(get_current_admin)):
    """기업 요금제 수동 변경"""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    new_plan = plan_data.get("plan")
    if new_plan not in ["basic", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan name")
    
    org.plan = new_plan
    db.commit()
    return {"success": True, "message": f"{org.company_name} 플랜이 {new_plan}으로 변경되었습니다."}

@router.get("/usage-stats")
def get_admin_usage_stats(
    start_date: str,
    end_date: str,
    org_id: str = None, # 특정 기업 필터링 (없으면 전체)
    db: Session = Depends(get_db),
    current_admin: models.SystemAdmin = Depends(get_current_admin)
):
    """시스템 전체 또는 기업별 일별 사용량 통계 (그래프용)"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    query = db.query(
        models.APIUsageLog.date_dt,
        func.sum(models.APIUsageLog.total_requests).label("total_calls"),
        func.sum(models.APIUsageLog.total_tokens_used).label("total_tokens")
    ).filter(
        models.APIUsageLog.date_dt >= start_dt,
        models.APIUsageLog.date_dt <= end_dt
    )
    
    if org_id and org_id != "all":
        query = query.filter(models.APIUsageLog.org_id == org_id)
        
    logs = query.group_by(models.APIUsageLog.date_dt).all()
    
    log_map = {str(log.date_dt): {"calls": log.total_calls or 0, "tokens": log.total_tokens or 0} for log in logs}
    
    daily_stats = []
    current_dt = start_dt
    total_calls = 0
    total_tokens = 0
    
    while current_dt <= end_dt:
        date_str = current_dt.strftime("%Y-%m-%d")
        if date_str in log_map:
            daily_stats.append({
                "date": date_str,
                "calls": log_map[date_str]["calls"],
                "tokens": log_map[date_str]["tokens"]
            })
            total_calls += log_map[date_str]["calls"]
            total_tokens += log_map[date_str]["tokens"]
        else:
            daily_stats.append({"date": date_str, "calls": 0, "tokens": 0})
        current_dt += timedelta(days=1)
        
    return {
        "success": True,
        "daily_stats": daily_stats,
        "total_calls": total_calls,
        "total_tokens": total_tokens
    }
