"""
File    : backend/services/auth_service.py
Author  : 김민정
Create  : 2026-04-23
Description : 인증(Login/Register/Verify/Reset) 관련 서비스 (Redis 기반)

Modification History:
    - 2026-04-23 (김민정) : 모듈화
"""
import json
import secrets
from ..core.database import redis_client

class AuthService:
    @staticmethod
    def generate_verification_code():
        return "".join([str(secrets.randbelow(10)) for _ in range(6)])

    @staticmethod
    def save_pending_signup(email: str, data: dict):
        # 10분(600초) 동안 유지
        redis_client.setex(f"signup:{email}", 600, json.dumps(data))

    @staticmethod
    def get_pending_signup(email: str):
        data = redis_client.get(f"signup:{email}")
        return json.loads(data) if data else None

    @staticmethod
    def delete_pending_signup(email: str):
        redis_client.delete(f"signup:{email}")

    @staticmethod
    def save_password_reset_code(email: str, code: str):
        # 5분(300초) 동안 유지
        redis_client.setex(f"reset:{email}", 300, code)

    @staticmethod
    def get_password_reset_code(email: str):
        return redis_client.get(f"reset:{email}")

    @staticmethod
    def delete_password_reset_code(email: str):
        redis_client.delete(f"reset:{email}")