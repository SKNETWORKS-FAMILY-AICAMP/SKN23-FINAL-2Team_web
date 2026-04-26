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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import server
from .routers import auth_api, payments_api, keys_api, usage_api, devices_api, inquiries_api, admin_api

app = FastAPI(title="Cadence AI Backend")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_api.router)
app.include_router(payments_api.router)
app.include_router(keys_api.router)
app.include_router(usage_api.router)
app.include_router(devices_api.router)
app.include_router(inquiries_api.router)
app.include_router(admin_api.router)

@app.get("/")
def read_root():
    return {"message": "Cadence AI API Server is running"}

@app.on_event("shutdown")
def shutdown_event():
    if server:
        server.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
