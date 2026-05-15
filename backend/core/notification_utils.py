"""
File    : backend/core/notification_utils.py
Author  : 김지우
Create  : 2026-05-15
Description : 사용자 알림 생성 공용 유틸리티

Modification History:
    - 2026-05-15 (김지우) : 알림 생성 및 중복 리소스 알림 방지 유틸리티 추가
"""
from typing import Optional

from sqlalchemy.orm import Session

from ..models import models


def create_user_notification(
    db: Session,
    *,
    org_id: str,
    type_: str,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    dedupe_resource: bool = False,
) -> Optional[models.UserNotification]:
    if dedupe_resource and resource_type and resource_id:
        existing = db.query(models.UserNotification).filter(
            models.UserNotification.org_id == org_id,
            models.UserNotification.resource_type == resource_type,
            models.UserNotification.resource_id == str(resource_id),
        ).first()
        if existing:
            return None

    notification = models.UserNotification(
        org_id=org_id,
        type=type_,
        title=title,
        message=message,
        action_url=action_url,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
    )
    db.add(notification)
    return notification
