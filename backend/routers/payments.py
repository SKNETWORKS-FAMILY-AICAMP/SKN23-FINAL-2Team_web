"""
File    : backend/routers/payments.py
Author  : 김민정
Create  : 2026-04-23
Description : 결제(Payment) 및 구독 관련 API 라우터 (토스 페이먼츠 연동)

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
import requests
import base64

from .. import models
from ..database import get_db
from ..dependencies import get_current_user, ensure_verified

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

@router.get("/current")
def get_current_payment(current_org: models.Organization = Depends(get_current_user)):
    if not current_org.plan or current_org.plan == "none":
        return {"success": False, "message": "구독 중인 요금제가 없습니다."}
    
    # Pricing: Basic (₩300,000 Lifetime), Pro (₩100,000 Monthly)
    amount = 300000 if current_org.plan == "Basic" else 100000
    return {
        "success": True,
        "plan_name": current_org.plan,
        "amount": amount,
        "pg_provider": "TossPayments"
    }

@router.post("/toss-confirm")
def toss_confirm(payload: dict, current_org: models.Organization = Depends(get_current_user), db: Session = Depends(get_db)):
    payment_key = payload.get("paymentKey")
    order_id = payload.get("orderId")
    amount = payload.get("amount")
    plan_name = payload.get("plan_name")

    if not payment_key or not order_id or not amount:
        raise HTTPException(status_code=400, detail="필수 결제 정보가 누락되었습니다.")

    secret_key = os.getenv("TOSS_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="결제 설정을 찾을 수 없습니다.")

    auth_str = f"{secret_key}:"
    encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/json"
    }

    toss_url = "https://api.tosspayments.com/v1/payments/confirm"
    toss_payload = {"paymentKey": payment_key, "orderId": order_id, "amount": amount}

    try:
        response = requests.post(toss_url, json=toss_payload, headers=headers)
        res_data = response.json()

        if response.status_code == 200:
            current_org.plan = plan_name
            
            # API Key Auto-generation for first payment
            existing_key = db.query(models.License).filter(
                models.License.org_id == current_org.id,
                models.License.status == "active"
            ).first()
            
            auto_key = None
            if not existing_key:
                auto_key = f"sk-{uuid.uuid4()}"
                new_license = models.License(org_id=current_org.id, api_key=auto_key, status="active")
                db.add(new_license)

            new_payment = models.Payment(
                org_id=current_org.id,
                plan_name=plan_name,
                amount=amount,
                payment_method=res_data.get("method"),
                pg_provider="TossPayments",
                pg_transaction_id=payment_key,
                status="completed",
                completed_at=datetime.now(),
                payment_type="subscription"
            )
            db.add(new_payment)
            db.commit()
            
            return {
                "success": True, 
                "message": "결제 승인 성공" + (" 및 첫 API 키가 발급되었습니다." if auto_key else ""), 
                "data": res_data,
                "auto_key": auto_key
            }
        else:
            return {"success": False, "message": res_data.get("message", "결제 승인 실패"), "error": res_data}
    except Exception as e:
        print(f"Toss Confirm Error: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")
