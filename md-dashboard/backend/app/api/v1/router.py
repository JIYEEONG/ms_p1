# 26.08.04 백엔드 구축 v1 라우터들을 통합하여 main.py에 전달하는 파일

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정

# app/api/v1/router.py

# 26.08.07 AI 챗봇 서비스 구축에 따른 코드 추가

from fastapi import APIRouter
from app.api.v1 import dashboard
from app.api.v1 import reports  # reports 모듈 불러오기

api_router = APIRouter()

# /api/v1/dashboard/... 경로로 연결
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])