"""
File    : backend/routers/inquiries_router.py
Author  : 김민정
Create  : 2026-04-23
Description : 고객 지원(Inquiries) 및 파일 업로드 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경, 문의 내용과 답변 내용 추가
"""
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from ..models import models
from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/v1/support", tags=["support"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/tickets")
async def create_support_ticket(
    type: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    file: UploadFile = File(None),
    current_user: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_path = None
        if file and file.filename:
            file_ext = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
        ticket = models.SupportInquiry(
            org_id=current_user.id,
            inquiry_type=type,
            title=title,
            content=content,
            file_path=file_path,
            status="pending"
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return {"success": True, "ticket_id": ticket.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="문의 접수 중 오류가 발생했습니다.")

@router.post("/tickets/anonymous")
async def create_anonymous_support_ticket(
    type: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    password: str = Form(...), # 4 digit PIN
    device_uuid: str = Form(None), # client generated uuid
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        file_path = None
        if file and file.filename:
            file_ext = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
        ticket = models.SupportInquiry(
            is_anonymous=True,
            anonymous_password=password,
            device_uuid=device_uuid,
            org_id=None,
            inquiry_type=type,
            title=title,
            content=content,
            file_path=file_path,
            status="pending"
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return {"success": True, "ticket_id": ticket.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="익명 문의 접수 중 오류가 발생했습니다.")

@router.get("/tickets")
async def get_support_tickets(
    device_uuid: str = None,
    page: int = 1,
    limit: int = 10,
    current_user: models.Organization = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(models.SupportInquiry, models.Organization.company_name) \
        .outerjoin(models.Organization, models.SupportInquiry.org_id == models.Organization.id)
    
    # 최신순 정렬
    query = query.order_by(models.SupportInquiry.created_at.desc())

    total_count = query.count()
    tickets_query = query.offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for t_obj, c_name in tickets_query:
        # 로그인 사용자는 본인 실명 확인 가능, 타인/익명은 마스킹
        masked_name = "익명"
        if c_name:
            if current_user and t_obj.org_id == current_user.id:
                masked_name = c_name
            else:
                if len(c_name) > 3: masked_name = c_name[:3] + "*" * 3
                elif len(c_name) > 1: masked_name = c_name[0] + "*" * 2
                else: masked_name = c_name

        is_mine = False
        # 1. 로그인 사용자인 경우 org_id 일치 여부 확인
        if current_user and t_obj.org_id == current_user.id:
            is_mine = True
        # 2. 비로그인/익명 사용자인 경우 device_uuid 확인
        elif not current_user and device_uuid and t_obj.device_uuid == device_uuid:
            is_mine = True
                
        # 내 글이거나 관리자 답변이 있는 경우 등 본인의 경우만 원문 노출 (익명 처리 로직)
        ret_content = "비밀글입니다."
        ret_answer = "비밀글입니다."
        
        if is_mine or not t_obj.is_anonymous:
            ret_content = t_obj.content
            ret_answer = t_obj.answer_content

        result.append({
            "id": t_obj.id,
            "type": t_obj.inquiry_type,
            "title": t_obj.title,
            "content": ret_content,
            "answer": ret_answer,
            "status": t_obj.status,
            "created_at": t_obj.created_at.isoformat(),
            "has_attachment": bool(t_obj.file_path),
            "author": masked_name,
            "is_anonymous": t_obj.is_anonymous,
            "is_mine": is_mine
        })
    return {"success": True, "tickets": result, "total_count": total_count}

@router.post("/tickets/{ticket_id}/verify")
async def verify_support_ticket(
    ticket_id: int,
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    ticket = db.query(models.SupportInquiry).filter(models.SupportInquiry.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="티켓을 찾을 수 없습니다.")
    if not ticket.is_anonymous:
        raise HTTPException(status_code=400, detail="익명 티켓이 아닙니다.")
    
    if ticket.anonymous_password != password:
        return {"success": False, "message": "비밀번호가 일치하지 않습니다."}
        
    return {
        "success": True, 
        "content": ticket.content, 
        "answer": ticket.answer_content
    }

@router.get("/tickets/me")
async def get_my_support_tickets(
    current_user: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = db.query(models.SupportInquiry).filter(models.SupportInquiry.org_id == current_user.id).order_by(models.SupportInquiry.created_at.desc()).all()
    return {
        "success": True,
        "tickets": [
            {
                "id": t.id,
                "type": t.inquiry_type,
                "title": t.title,
                "content": t.content,
                "status": t.status,
                "answer": t.answer_content,
                "created_at": t.created_at.isoformat(),
                "has_attachment": bool(t.file_path)
            } for t in tickets
        ]
    }
