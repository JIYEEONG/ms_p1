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

# --- 예측 (SKU별 조회, product_id 단위 예측) ---
class ForecastChartPoint(BaseModel):
    week: str
    actual: Optional[float] = None
    predicted: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

    class Config:
        from_attributes = True


class ForecastResponse(BaseModel):
    product_id: str
    forecast_scope: str = "product"
    has_forecast_data: bool = True   # 미래 예측치 존재 여부 — 팀원 파이프라인 완료 전엔 False
    expected_sales: int
    out_of_stock_prob: Optional[float] = None
    ending_inventory: int
    recommended_order: int
    order_date: Optional[str] = None
    current_available: int
    incoming: int
    excess_qty: int
    chart: List[ForecastChartPoint]

    class Config:
        from_attributes = True

# --- 예측 탭 필터 옵션 (대분류/중분류/상품 드롭다운용) ---
class ProductOption(BaseModel):
    product_id: str
    product_name: str

    class Config:
        from_attributes = True


class FilterOptionsResponse(BaseModel):
    category_large: List[str]
    category_middle: List[str]
    products: List[ProductOption]