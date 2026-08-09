# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_service import generate_sales_report

router = APIRouter()

class ReportRequest(BaseModel):
    prompt: str

@router.post("/generate")
def create_sales_report(request: ReportRequest):
    # generate_sales_report()에서 반환하는 dict를 그대로 전달합니다.
    report_content = generate_sales_report(request.prompt)
    
    # ⚠️ {"status": "success", "report": ...} 형태를 사용하지 않고 그대로 리턴합니다.
    return report_content