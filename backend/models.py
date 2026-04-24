"""
File    : backend/models.py
Author  : 김민정
Create  : 2026-04-21
Description : 데이터베이스 테이블 정의

Modification History:
    - 2026-04-21 (김민정) : 초기 모델링 및 License 테이블 추가
    - 2026-04-22 (Antigravity) : 최신 DB 스키마 이미지에 맞춰 모든 테이블 동기화 및 Payment 테이블 추가
    - 2026-04-23 (김민정) : SystemAdmin 테이블 추가
"""
from sqlalchemy import Column, String, Boolean, Integer, TIMESTAMP, Numeric, Text, Date
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(200), nullable=False)
    admin_email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    plan = Column(String(20), default="basic")
    max_seats = Column(Integer, default=10)
    business_reg_number = Column(String(50), nullable=True)
    business_reg_s3_url = Column(Text, nullable=True)
    verification_status = Column(String(20), default="pending")
    verified_by = Column(UUID(as_uuid=True), nullable=True)
    verified_at = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)
    daily_token_limit = Column(Integer, nullable=True)
    remaining_daily_tokens = Column(Integer, nullable=True)

class License(Base):
    __tablename__ = "licenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    api_key = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(20), default="active", nullable=False)
    starts_at = Column(TIMESTAMP, server_default="now()", nullable=False)
    expires_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)

class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    license_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    machine_id = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    first_seen = Column(TIMESTAMP, server_default="now()", nullable=False)
    last_seen = Column(TIMESTAMP, server_default="now()", nullable=False)
    hostname = Column(Text, nullable=True)
    os_user = Column(Text, nullable=True)
    display_name = Column(Text, nullable=True)

class APIUsageLog(Base):
    __tablename__ = "api_usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    license_id = Column(UUID(as_uuid=True), nullable=False)
    date_dt = Column(Date, server_default="now()", nullable=False)
    total_requests = Column(Integer, default=0)
    total_tokens_used = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)
    updated_at = Column(TIMESTAMP, server_default="now()", nullable=False)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    plan_name = Column(String(20), nullable=False)
    seats = Column(Integer, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), nullable=True)
    pg_provider = Column(String(50), nullable=True)
    pg_transaction_id = Column(String(100), nullable=True)
    status = Column(String(20), default="pending", nullable=False)
    generated_license_id = Column(UUID(as_uuid=True), nullable=True)
    billing_period_start = Column(TIMESTAMP, nullable=True)
    billing_period_end = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)
    completed_at = Column(TIMESTAMP, nullable=True)
    payment_type = Column(String(20), default="subscription", nullable=False)
    added_seats = Column(Integer, nullable=True)
    proration_days = Column(Integer, nullable=True)

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    ticket_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(20), default="pending", nullable=False) # pending, answered
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)

class SystemAdmin(Base):
    __tablename__ = "system_admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)

class DocumentsS3(Base):
    __tablename__ = "documents_s3"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String(255), nullable=False)
    s3_url = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default="now()", nullable=False)
