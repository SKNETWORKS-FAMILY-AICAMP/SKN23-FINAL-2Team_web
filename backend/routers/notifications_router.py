"""
File    : backend/routers/notifications_router.py
Author  : 김지우
Create  : 2026-05-15
Description : 사용자 알림 조회 및 읽음 처리 라우터

Modification History:
    - 2026-05-15 (김지우) : 마이페이지 알림 조회/읽음 처리 API 추가
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..core.schema_utils import ensure_user_notifications_table
from ..models import models

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


def serialize_notification(notification: models.UserNotification) -> dict:
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "action_url": notification.action_url,
        "resource_type": notification.resource_type,
        "resource_id": notification.resource_id,
        "is_read": notification.is_read,
        "read_at": notification.read_at.isoformat() if notification.read_at else None,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


@router.get("")
def get_notifications(
    limit: int = 20,
    current_org: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_user_notifications_table(db)
    safe_limit = min(max(limit, 1), 50)

    notifications = (
        db.query(models.UserNotification)
        .filter(models.UserNotification.org_id == current_org.id)
        .order_by(models.UserNotification.created_at.desc())
        .limit(safe_limit)
        .all()
    )
    unread_count = (
        db.query(models.UserNotification)
        .filter(
            models.UserNotification.org_id == current_org.id,
            models.UserNotification.is_read == False,
        )
        .count()
    )

    return {
        "success": True,
        "unread_count": unread_count,
        "notifications": [serialize_notification(item) for item in notifications],
    }


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_org: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_user_notifications_table(db)
    notification = (
        db.query(models.UserNotification)
        .filter(
            models.UserNotification.id == notification_id,
            models.UserNotification.org_id == current_org.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()

    return {"success": True}


@router.patch("/read-all")
def mark_all_notifications_read(
    current_org: models.Organization = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_user_notifications_table(db)
    now = datetime.now(timezone.utc)
    db.query(models.UserNotification).filter(
        models.UserNotification.org_id == current_org.id,
        models.UserNotification.is_read == False,
    ).update({"is_read": True, "read_at": now})
    db.commit()

    return {"success": True}
