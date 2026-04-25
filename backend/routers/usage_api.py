"""
File    : backend/routers/usage_api.py
Author  : 김민정
Create  : 2026-04-23
Description : 사용량(Usage) 통계 조회 API 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : qna 파일명 변경
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from .. import models
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])

@router.get("/stats")
def get_usage_stats(
    start_date: str,
    end_date: str,
    current_org: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    logs = db.query(
        models.ApiUsageLog.date_dt,
        func.sum(models.ApiUsageLog.total_requests).label("total_calls"),
        func.sum(models.ApiUsageLog.total_tokens_used).label("total_tokens")
    ).filter(
        models.ApiUsageLog.org_id == current_org.id,
        models.ApiUsageLog.date_dt >= start_dt,
        models.ApiUsageLog.date_dt <= end_dt
    ).group_by(models.ApiUsageLog.date_dt).all()
    
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
        
    plan = current_org.plan or "none"
    limit_map = {"basic": 100, "pro": 10000, "enterprise": 1000000}
    limit = limit_map.get(plan.lower(), 5)
    
    return {
        "success": True,
        "daily_stats": daily_stats,
        "total_calls": total_calls,
        "total_tokens": total_tokens,
        "limit": limit
    }
