"""
Modification History:
    - 2026-05-15 (김지우) : 사용자 시방서(temp_documents) 조회 및 이메일 인증 기반 삭제 API 구현
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..models import models
from ..core.database import get_db, redis_client
from ..core.dependencies import get_current_user
from ..services.email_service import EmailService
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

REDIS_TTL = 300  # 5분


def _get_verify_email(org: models.Organization) -> str:
    return (org.contact_email or org.admin_email or "").strip()


# ── 목록 조회 ──────────────────────────────────────────────────────────────────
@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.Organization = Depends(get_current_user),
):
    docs = (
        db.query(models.TempDocument)
        .filter(models.TempDocument.org_id == current_user.id)
        .order_by(models.TempDocument.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(doc.id),
            "file_name": doc.file_name,
            "comment": doc.comment,
            "status": doc.status,
            "domain": doc.domain,
            "expires_at": doc.expires_at.isoformat() if doc.expires_at else None,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in docs
    ]


# ── 삭제용 이메일 인증 코드 발송 ────────────────────────────────────────────────
@router.post("/{doc_id}/delete-request")
def request_doc_delete(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.Organization = Depends(get_current_user),
):
    doc = (
        db.query(models.TempDocument)
        .filter(
            models.TempDocument.id == doc_id,
            models.TempDocument.org_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    target_email = _get_verify_email(current_user)
    if not target_email:
        raise HTTPException(status_code=400, detail="인증에 사용할 이메일이 등록되어 있지 않습니다.")

    code = AuthService.generate_verification_code()
    redis_key = f"doc_delete:{current_user.id}:{doc_id}"
    redis_client.setex(redis_key, REDIS_TTL, code)

    try:
        EmailService.send_verification_email(target_email, code)
    except Exception:
        pass

    masked = target_email[:2] + "***@" + target_email.split("@")[-1] if "@" in target_email else target_email
    return {"success": True, "email": masked}


# ── 인증 코드 확인 후 삭제 ───────────────────────────────────────────────────────
class DeleteConfirmRequest(BaseModel):
    code: str


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    body: DeleteConfirmRequest,
    db: Session = Depends(get_db),
    current_user: models.Organization = Depends(get_current_user),
):
    redis_key = f"doc_delete:{current_user.id}:{doc_id}"
    saved = redis_client.get(redis_key)

    if not saved or saved != body.code:
        raise HTTPException(status_code=400, detail="인증 코드가 올바르지 않거나 만료되었습니다.")

    doc = (
        db.query(models.TempDocument)
        .filter(
            models.TempDocument.id == doc_id,
            models.TempDocument.org_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    db.delete(doc)
    db.commit()
    redis_client.delete(redis_key)

    return {"success": True}
