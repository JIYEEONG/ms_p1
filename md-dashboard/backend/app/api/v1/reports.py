# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가
# 26.08.10 app/api/v1/reports.py 에 추가할 엔드포인트 추가

from fastapi import APIRouter, HTTPException          # <- HTTPException 추가
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any, Dict

from app.services.excel_report_builder import build_excel_report_data
from app.services.excel_export import generate_excel_report
from app.services.rag_service import generate_sales_report

router = APIRouter()

class ExportExcelRequest(BaseModel):
    period_meta: Dict[str, Any]
class ReportRequest(BaseModel):
    prompt: str

@router.post("/generate")
def create_sales_report(request: ReportRequest):
    report_content = generate_sales_report(request.prompt)
    return report_content

@router.post("/export-excel")                         
def export_excel(req: ExportExcelRequest):
    """
    /generate로 이미 리포트를 만든 뒤, 그때 받은 period_meta를 그대로 이 엔드포인트에 보내면
    기간을 다시 파싱하지 않고(파싱 결과가 달라질 위험 없이) 바로 상세 엑셀을 생성합니다.
    """
    try:
        data = build_excel_report_data(req.period_meta)
        filepath = generate_excel_report(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"엑셀 생성 실패: {str(e)}")

    filename = filepath.split("/")[-1].split("\\")[-1]
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )