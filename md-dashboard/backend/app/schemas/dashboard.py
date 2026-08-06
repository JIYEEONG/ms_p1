# 26.08.04 백엔드 구축 대시보드 API 용 Pydantic 모델

# 26.08.05 로직 추가

from pydantic import BaseModel
from typing import List, Optional

# --- 필터 및 공통 응답 ---
class FilterRequest(BaseModel):
    period: Optional[str] = "2025-12"
    category: Optional[str] = "전체"
    season: Optional[str] = "전체"
    hub: Optional[str] = "전체"

# --- 월별 순매출 추이 ---
class SalesTrendResponse(BaseModel):
    month: str
    sales: float

    class Config:
        from_attributes = True

# --- 상품/위험 SKU 목록 ---
class ProductInventoryResponse(BaseModel):
    id: int
    sku: str
    product_name: str
    category: str
    current_stock: int
    safety_stock: int
    wos: float
    sell_through_rate: float
    claim_rate: float
    inbound_plan: int
    risk_status: str

    class Config:
        from_attributes = True