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
from ..core.plan_utils import apply_plan_seats, calculate_plan_amount, get_effective_max_seats, get_plan_base_seats, get_plan_definition, list_plan_definitions
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

@router.get("/plans")
def get_payment_plans(db: Session = Depends(get_db)):
    return {
        "success": True,
        "plans": [
            {
                "plan_code": plan["plan_code"],
                "plan_name": plan["plan_name"],
                "base_seats": plan["base_seats"],
                "base_price": int(plan["base_price"]),
                "addon_price_per_seat": int(plan["addon_price_per_seat"]),
                "daily_token_limit": plan.get("daily_token_limit"),
                "per_seat_token_bonus": plan.get("per_seat_token_bonus", 0),
            }
            for plan in list_plan_definitions(db)
        ],
    }

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

    added_seats = int(last_payment.added_seats or 0) if last_payment else 0
    amount = last_payment.amount if last_payment else calculate_plan_amount(db, current_org.plan, added_seats)
    pg_provider = last_payment.pg_provider if last_payment else "TossPayments"
    
    return {
        "success": True,
        "plan_name": current_org.plan,
        "max_seats": get_effective_max_seats(db, current_org),
        "seats": last_payment.seats if last_payment else current_org.max_seats,
        "added_seats": added_seats,
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

@router.post("/activate")
def activate_subscription(payload: dict, current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    """토스 없이 직접 구독 활성화 (테스트/데모용)"""
    plan_name = payload.get("plan_name")
    if not plan_name or plan_name not in ("Basic", "Pro", "Enterprise"):
        raise HTTPException(status_code=400, detail="유효하지 않은 플랜입니다.")

    added_seats = max(0, int(payload.get("added_seats", 0) or 0))
    amount = calculate_plan_amount(db, plan_name, added_seats)
    total_seats = get_plan_base_seats(db, plan_name) + added_seats

    now = datetime.now(timezone.utc)
    billing_end = now + timedelta(days=365)

    existing_key = db.query(models.License).filter(
        models.License.org_id == current_org.id,
        models.License.status == "active"
    ).first()
    auto_key = None
    if not existing_key:
        auto_key = f"sk-{uuid.uuid4()}"
        db.add(models.License(org_id=current_org.id, api_key=auto_key, status="active"))

    current_org.plan = plan_name
    db.add(models.Payment(
        org_id=current_org.id,
        plan_name=plan_name,
        seats=total_seats,
        amount=amount,
        payment_method="무료 활성화",
        pg_provider="Direct",
        status="completed",
        completed_at=now,
        payment_type="subscription",
        added_seats=added_seats,
        billing_period_start=now,
        billing_period_end=billing_end
    ))
    apply_plan_seats(db, current_org)
    db.commit()

    try:
        EmailService.send_receipt_email(current_org.admin_email, current_org.company_name, 0, plan_name)
    except Exception as e:
        print(f"[Email Error] Receipt failed: {e}")

    return {"success": True, "auto_key": auto_key, "message": "구독이 활성화되었습니다."}


@router.post("/toss-confirm")
def toss_confirm(payload: dict, current_org: models.Organization =Depends(get_current_user), db: Session = Depends(get_db)):
    payment_key = payload.get("paymentKey")
    order_id = payload.get("orderId")
    amount = payload.get("amount")
    plan_name = payload.get("plan_name")
    payment_type = payload.get("payment_type", "subscription")
    added_seats = max(0, int(payload.get("added_seats", 0) or 0))
    incremental_added_seats = max(0, int(payload.get("incremental_added_seats", added_seats) or 0))
    if not payment_key or not order_id or not amount:
        raise HTTPException(status_code=400, detail="필수 결제 정보가누락되었습니다.")
    if payment_type == "seat_addon":
        plan = get_plan_definition(db, plan_name or current_org.plan)
        if not plan or incremental_added_seats <= 0:
            raise HTTPException(status_code=400, detail="추가 시트 결제 정보가 올바르지 않습니다.")
        expected_amount = int(plan["addon_price_per_seat"]) * incremental_added_seats
    else:
        expected_amount = int(calculate_plan_amount(db, plan_name, added_seats))
    total_seats = get_plan_base_seats(db, plan_name) + added_seats
    if int(amount) != expected_amount:
        raise HTTPException(status_code=400, detail="결제 금액이 선택한 요금제와 일치하지 않습니다.")
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
            billing_end = now + timedelta(days=365)
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
                seats=total_seats,
                amount=amount,
                payment_method=res_data.get("method"),
                pg_provider="TossPayments",
                pg_transaction_id=payment_key,
                status="completed",
                completed_at=now,
                payment_type=payment_type,
                added_seats=added_seats,
                billing_period_start=billing_start,
                billing_period_end=billing_end
            )
            db.add(new_payment)
            apply_plan_seats(db, current_org)
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
                "message": "결제 승인 성공" + (" 및 첫 API 키가 발급되었습니다." if auto_key else ""),
                "data": res_data,
                "auto_key": auto_key
            }
        else:
            return {"success": False, "message": res_data.get("message", "결제승인 실패"), "error": res_data}
    except Exception as e:
        print(f"Toss Confirm Error: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가발생했습니다.")
