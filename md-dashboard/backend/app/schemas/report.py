# 26.08.09 AI고도화 작업에 따른 파일 추가

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ChartData(BaseModel):
    id: str
    type: str  # 'line' | 'bar' | 'pie'
    title: str
    data: List[Dict[str, Any]]

class MdInsight(BaseModel):
    sales_analysis: str
    inventory_risk: str
    action_plans: List[Dict[str, str]]

class ReportResponse(BaseModel):
    summary_kpi: Dict[str, Any]
    charts: List[ChartData]
    md_insights: MdInsight