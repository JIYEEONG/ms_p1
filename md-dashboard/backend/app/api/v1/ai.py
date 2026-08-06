# 26.08.04 백엔드 구축 AI 리오더 추천 & Agent 챗봇 API 엔드포인트

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.services.reorder_ai import calculate_reorder_recommendation

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.get("/reorder-recommendation")
def get_ai_reorder_recommendation(db: Session = Depends(get_db)):
    """AI 기반 리오더(재발주) 추천 수량 반환"""
    recommendations = calculate_reorder_recommendation(db)
    return {
        "status": "success",
        "data": recommendations
    }

@router.post("/chat")
def ai_agent_chat(req: ChatRequest):
    """MD 대시보드 AI Agent 챗봇 응답"""
    # 임시 규칙 기반 응답 (추후 OpenAI/Azure OpenAI 연동 가능)
    user_msg = req.message
    reply = f"MD Agent: '{user_msg}'에 대해 분석 중입니다. 현재 기온 상승 추세에 따라 반팔 티셔츠의 리오더를 권장합니다."
    return {"reply": reply}