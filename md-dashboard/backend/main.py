# 26.08.04 백엔드 구축 FastAPI 서버 실행 진입점 (Uvicorn 서버)

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router

# Azure SQL DB에 정의된 모든 모델 테이블 자동 생성 (없을 경우)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS 설정 (Next.js 연동용)
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# API v1 라우터 등록 (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Fashion MD Dashboard API Server is running!"}