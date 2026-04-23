"""
File    : backend/database.py
Author  : 김민정
Create  : 2026-04-21
Description : 데이터베이스 연결 및 SSH 터널링 설정

Modification History:
    - 2026-04-21 (김민정) : 초기 DB 설정 및 SSH 터널링 IPv4 강제 바인딩 처리
"""
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed, skipping load_dotenv()")

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sshtunnel import SSHTunnelForwarder

# DB Configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "12341234")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "postgres")

# SSH Configuration
USE_SSH_TUNNEL = os.getenv("USE_SSH_TUNNEL", "False").lower() == "true"
SSH_HOST = os.getenv("SSH_HOST")
SSH_PORT = int(os.getenv("SSH_PORT", "22"))
SSH_USER = os.getenv("SSH_USER")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")

server = None
if USE_SSH_TUNNEL:
    print(f"Connecting via SSH Tunnel to {SSH_HOST}...")
    server = SSHTunnelForwarder(
        (SSH_HOST, SSH_PORT),
        ssh_username=SSH_USER,
        ssh_pkey=SSH_KEY_PATH,
        remote_bind_address=(DB_HOST, DB_PORT),
        local_bind_address=('127.0.0.1',)
    )
    server.start()
    local_port = server.local_bind_port
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@127.0.0.1:{local_port}/{DB_NAME}"
else:
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
