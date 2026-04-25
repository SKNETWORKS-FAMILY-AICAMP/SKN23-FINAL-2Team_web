"""
File    : backend/auth_utils.py
Author  : 김민정
Create  : 2026-04-21
Description : JWT 인증 유틸리티 (Access/Refresh Token 및 암호화)

Modification History:
    - 2026-04-21 (김민정) : 초기 생성 및 JWT 설정
    - 2026-04-22 (김민정) : Refresh Token 생성 및 토션 검증 로직 고도화
    - 2026-04-26 (김민정) : qna 파일명 변경
"""
import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt

# Secrets should be in .env
SECRET_KEY = os.getenv("SECRET_KEY", "cadence_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

def get_password_hash(password: str):
    # bcrypt has a 72-byte limit.
    pw_bytes = password.encode('utf-8')
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    try:
        pw_bytes = plain_password.encode('utf-8')
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
        
        return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Bcrypt verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"iat": datetime.utcnow(), "exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"iat": datetime.utcnow(), "exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
