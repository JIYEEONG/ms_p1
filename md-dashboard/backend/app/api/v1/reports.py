# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_service import generate_sales_report

router = APIRouter()

class ReportRequest(BaseModel):
    prompt: str

@router.post("/generate")
def create_sales_report(request: ReportRequest):
    report_content = generate_sales_report(request.prompt)
    return {"status": "success", "report": report_content}