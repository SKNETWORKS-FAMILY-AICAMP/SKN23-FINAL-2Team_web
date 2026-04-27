from pydantic import BaseModel

class EmailCheckRequest(BaseModel):
    email: str

@router.post("/check-email", response_model=schemas.CommonResponse)
async def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    if db.query(models.Organization).filter(models.Organization.admin_email == data.email).first():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    return {"success": True, "message": "사용 가능한 이메일입니다."}

@router.post("/send-code", response_model=schemas.CommonResponse)
async def send_code(data: EmailCheckRequest, db: Session = Depends(get_db)):
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
