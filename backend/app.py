"""
File    : backend/main.py
Author  : 김민정
Create  : 2026-04-21
Description : FastAPI 메인 엔드포인트 및 라우터 통합 관리

Modification History:
    - 2026-04-21 (김민정) : 초기 생성 및 기본 CRUD/인증 라우팅
    - 2026-04-22 (김민정) : 토스 결제 검증, 자동 API 키 발급, 토큰 리프레시 로직 보강
    - 2026-04-23 (김민정) : 로직 모듈화 (routers/ 분리)
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import server
from .routers import auth_router, payments_router, keys_router, usage_router, devices_router, inquiries_router, admin_router, plugin_router

app = FastAPI(title="Cadence AI Backend")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    if not configured.strip():
        return DEFAULT_CORS_ORIGINS
    return [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router.router)
app.include_router(payments_router.router)
app.include_router(keys_router.router)
app.include_router(usage_router.router)
app.include_router(devices_router.router)
app.include_router(inquiries_router.router)
app.include_router(admin_router.router)
app.include_router(plugin_router.router)

@app.get("/")
def read_root():
    return {"message": "Cadence AI API Server is running"}

@app.on_event("shutdown")
def shutdown_event():
    if server:
        server.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8001, reload=True)
