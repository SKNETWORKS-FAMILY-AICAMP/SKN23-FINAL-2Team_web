"""
File    : backend/routers/qna_api.py
Author  : 김민정
Create  : 2026-04-23
Description : 고객 지원(QnA) 및 파일 업로드 라우터

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
"""
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from .. import models
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/v1/qna", tags=["qna"])

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
                
        ticket = models.SupportTicket(
            org_id=current_user.id,
            ticket_type=type,
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

@router.get("/tickets")
async def get_support_tickets(db: Session = Depends(get_db)):
    tickets_query = db.query(models.SupportTicket, models.Organization.company_name) \
        .outerjoin(models.Organization, models.SupportTicket.org_id == models.Organization.id) \
        .order_by(models.SupportTicket.created_at.desc()).all()
    
    result = []
    for t_obj, c_name in tickets_query:
        masked_name = "익명"
        if c_name:
            if len(c_name) > 3: masked_name = c_name[:3] + "*" * 3
            elif len(c_name) > 1: masked_name = c_name[0] + "*" * 2
            else: masked_name = c_name
                
        result.append({
            "id": t_obj.id,
            "type": t_obj.ticket_type,
            "title": t_obj.title,
            "status": t_obj.status,
            "created_at": t_obj.created_at.isoformat(),
            "has_attachment": bool(t_obj.file_path),
            "author": masked_name
        })
    return {"success": True, "tickets": result}

@router.get("/tickets/me")
async def get_my_support_tickets(
    current_user: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.org_id == current_user.id).order_by(models.SupportTicket.created_at.desc()).all()
    return {
        "success": True,
        "tickets": [
            {
                "id": t.id,
                "type": t.ticket_type,
                "title": t.title,
                "content": t.content,
                "status": t.status,
                "created_at": t.created_at.isoformat(),
                "has_attachment": bool(t.file_path)
            } for t in tickets
        ]
    }
