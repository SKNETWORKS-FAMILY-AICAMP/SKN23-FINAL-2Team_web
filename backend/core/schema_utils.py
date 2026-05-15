"""
File    : backend/core/schema_utils.py
Author  : 김지우
Create  : 2026-05-15
Description : 경량 DB 스키마 보강 유틸리티

Modification History:
    - 2026-05-15 (김지우) : 조직 담당자 컬럼 자동 보강 유틸리티 추가
    - 2026-05-15 (김지우) : 사용자 알림 테이블 자동 보강 유틸리티 추가
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_organization_contact_columns(db: Session) -> None:
    db.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name VARCHAR(120)"))
    db.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)"))
    db.commit()


def ensure_user_notifications_table(db: Session) -> None:
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS user_notifications (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            action_url VARCHAR(300),
            resource_type VARCHAR(50),
            resource_id VARCHAR(100),
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            read_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """))
    db.execute(text("CREATE INDEX IF NOT EXISTS idx_user_notifications_org_created ON user_notifications(org_id, created_at DESC)"))
    db.execute(text("CREATE INDEX IF NOT EXISTS idx_user_notifications_org_unread ON user_notifications(org_id, is_read)"))
    db.execute(text("CREATE INDEX IF NOT EXISTS idx_user_notifications_resource ON user_notifications(org_id, resource_type, resource_id)"))
    db.commit()
