"""
File    : backend/routers/payments_router.py
Author  : 김민정
Create  : 2026-04-23
Description : 결제(Payment) 및 구독 관련 API 라우터 (토스 페이먼츠 연동)

Modification History:
    - 2026-04-26 (김민정) : 결제 승인 시 상세 필드 계산 및 구독 종료일DB 저장 로직 추가, 구독 해지
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone 
import os
import uuid
import requests
import base64
from ..models import models
from ..core.database import get_db
from ..core.dependencies import get_current_user, ensure_verified
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

@router.get("/current")
def get_current_payment(current_org: models.Organization =Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_org.plan or current_org.plan == "none":
        return {"success": False, "message": "구독 중인 요금제가 없습니다.","noPlan": True}
    # 결제 데이터의 status를 통한 해지 예약 확인
    last_payment = db.query(models.Payment).filter(
        models.Payment.org_id == current_org.id,
        models.Payment.status.in_(["completed", "cancelling"])
    ).order_by(models.Payment.created_at.desc()).first()
    
    is_cancelling = last_payment.status == "cancelling" if last_payment else False

    remaining_days = 0
    payment_method = last_payment.payment_method if last_payment else "등록된 수단 없음"
    
    if last_payment and last_payment.billing_period_end:
        end_date = last_payment.billing_period_end
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        delta = end_date - datetime.now(timezone.utc)
        remaining_days = max(0, delta.days)

    amount = last_payment.amount if last_payment else (300000 if current_org.plan == "Basic" else 100000)
    pg_provider = last_payment.pg_provider if last_payment else "TossPayments"
    
    return {
        "success": True,
        "plan_name": current_org.plan,
        "amount": amount,
        "payment_method": payment_method,
        "pg_provider": pg_provider,
        "last_payment_date": last_payment.completed_at.isoformat() if last_payment and last_payment.completed_at else None,
        "next_payment_date": last_payment.billing_period_end.isoformat() if last_payment and last_payment.billing_period_end else None,
        "remaining_days": remaining_days,
        "is_cancelling": is_cancelling
    }

@router.post("/cancel")
def cancel_subscription(current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    # 가장 최근의 성공한 결제 건을 찾아 상태를 cancelling으로 변경
    last_payment = db.query(models.Payment).filter(
        models.Payment.org_id == current_org.id,
        models.Payment.status == "completed"
    ).order_by(models.Payment.created_at.desc()).first()
    
    if not last_payment:
        raise HTTPException(status_code=404, detail="해지할 활성 구독 결제 내역이 없습니다.")
        
    last_payment.status = "cancelling"
    db.commit()
    return {"success": True, "message": "해지가 예약되었습니다."}

@router.post("/resume")
def resume_subscription(current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    # 해지 예약된 결제 건을 다시 completed로 변경
    last_payment = db.query(models.Payment).filter(
        models.Payment.org_id == current_org.id,
        models.Payment.status == "cancelling"
    ).order_by(models.Payment.created_at.desc()).first()
    
    if not last_payment:
        raise HTTPException(status_code=404, detail="해지 예약된 구독 결제 내역이 없습니다.")
        
    last_payment.status = "completed"
    db.commit()
    return {"success": True, "message": "구독 유지가 확정되었습니다."}

@router.post("/toss-confirm")
def toss_confirm(payload: dict, current_org: models.Organization =Depends(get_current_user), db: Session = Depends(get_db)):
    payment_key = payload.get("paymentKey")
    order_id = payload.get("orderId")
    amount = payload.get("amount")
    plan_name = payload.get("plan_name")
    added_seats = payload.get("added_seats", 0)
    if not payment_key or not order_id or not amount:
        raise HTTPException(status_code=400, detail="필수 결제 정보가누락되었습니다.")
    secret_key = os.getenv("TOSS_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="결제 설정을 찾을 수없습니다.")
    auth_str = f"{secret_key}:"
    encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/json"
    }
    toss_url = "https://api.tosspayments.com/v1/payments/confirm"
    toss_payload = {"paymentKey": payment_key, "orderId": order_id, "amount":amount}
    try:
        response = requests.post(toss_url, json=toss_payload, headers=headers)
        res_data = response.json()
        if response.status_code == 200:
            current_org.plan = plan_name
            # 시작일 및 종료일 계산
            now = datetime.now(timezone.utc)
            billing_start = now
            billing_end = None
            if plan_name.lower() == "pro":
                billing_end = now + timedelta(days=30)
            # API 키 자동 발급 체크
            existing_key = db.query(models.License).filter(
                models.License.org_id == current_org.id,
                models.License.status == "active"
            ).first()
            auto_key = None
            if not existing_key:
                auto_key = f"sk-{uuid.uuid4()}"
                new_license = models.License(org_id=current_org.id,api_key=auto_key, status="active")
                db.add(new_license)
               # 결제 정보 저장
            new_payment = models.Payment(
                org_id=current_org.id,
                plan_name=plan_name,
                amount=amount,
                payment_method=res_data.get("method"),
                pg_provider="TossPayments",
                pg_transaction_id=payment_key,
                status="completed",
                completed_at=now,
                payment_type="subscription",
                added_seats=added_seats,
                billing_period_start=billing_start,
                billing_period_end=billing_end
            )
            db.add(new_payment)
            db.commit()
               # 영수증 메일 발송
            try:
                EmailService.send_receipt_email(
                    current_org.admin_email,
                    current_org.company_name,
                    amount,
                    plan_name
                )
            except Exception as e:
                print(f"[Email Error] Receipt failed: {e}")
                return {
                    "success": True,
                    "message": "결제 승인 성공" + (" 및 첫 API 키가 발급되었습니다."if auto_key else ""),
                    "data": res_data,
                    "auto_key": auto_key
                }
        else:
            return {"success": False, "message": res_data.get("message", "결제승인 실패"), "error": res_data}
    except Exception as e:
        print(f"Toss Confirm Error: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가발생했습니다.")