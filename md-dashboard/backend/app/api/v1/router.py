# 26.08.04 백엔드 구축 v1 라우터들을 통합하여 main.py에 전달하는 파일

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정

# app/api/v1/router.py

from fastapi import APIRouter
from app.api.v1 import dashboard

api_router = APIRouter()

# /api/v1/dashboard/... 경로로 연결
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])