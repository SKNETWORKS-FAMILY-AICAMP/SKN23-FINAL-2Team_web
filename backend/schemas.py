"""
File    : backend/schemas.py
Author  : 김민정
Create  : 2026-04-21
Description : Pydantic 스키마 정의 (요청/응답 모델)

Modification History:
    - 2026-04-21 (김민정) : 초기 생성 및 기본 스키마 정의
    - 2026-04-22 (김민정) : LoginResponse 내 refresh_token 추가 및 필드 바인딩 최적화
    
"""
from pydantic import BaseModel, Field, AliasChoices
from typing import Optional
from uuid import UUID

class OrgBase(BaseModel):
    # EmailStr 대신 str을 사용하여 test@skn 같은 형식 허용
    admin_email: str = Field(..., validation_alias=AliasChoices("admin_email", "email"))
    company_name: Optional[str] = Field(None, validation_alias=AliasChoices("company_name", "companyName"))

class OrgCreate(OrgBase):
    password: str

class OrgLogin(BaseModel):
    email: str
    password: str

class OrgResponse(BaseModel):
    email: str
    companyName: Optional[str] = None
    role: str = "admin"
    orgId: Optional[str] = None
    verification_status: Optional[str] = "pending"
    plan: Optional[str] = "none"

    class Config:
        from_attributes = True
        populate_by_name = True

class EmailVerification(BaseModel):
    email: str
    code: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    code: str
    new_password: str

class CommonResponse(BaseModel):
    success: bool
    message: str

class LoginResponse(BaseModel):
    success: bool
    token: str
    refresh_token: str
    user: OrgResponse

class LicenseBase(BaseModel):
    api_key: str
    status: str
    starts_at: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: Optional[str] = None

class LicenseRead(LicenseBase):
    id: UUID
    org_id: UUID

    class Config:
        from_attributes = True
