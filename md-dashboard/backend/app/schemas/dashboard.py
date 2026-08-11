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
class SalesTrendPoint(BaseModel):
    label: str
    period_start: str
    period_days: int
    current_net_sales: float
    current_gross_sales: float
    previous_net_sales: float
    previous_gross_sales: float
    two_year_net_sales: float
    two_year_gross_sales: float


class SalesTrendResponse(BaseModel):
    current_label: str
    previous_label: str
    two_year_label: str
    points: List[SalesTrendPoint]

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


class OverviewFilterOptionsResponse(BaseModel):
    min_date: str
    max_date: str
    category_large: List[str]
    category_middle: List[str]
    seasons: List[str]
    hubs: List[str]


class OverviewKpiResponse(BaseModel):
    total_sales: float
    achievement_base_sales: float
    order_count: int
    total_units: int
    sales_change_rate: Optional[float] = None
    average_daily_orders: float
    return_rate: float

class CategorySalesResponse(BaseModel):
    name: str
    value: float
    percentage: float

# --- HUB별 재고 탭 ---
class HubCardData(BaseModel):
    hub_id: str          # HUB 고유 ID (예: HUB01)
    hub_name: str        # HUB 이름 (예: 수도권 통합 허브)
    available: int       # 가용재고 (EA)
    reserved: int        # 예약 수량 (EA)
    in_transit: int      # 이동 중 수량 (EA)
    incoming: int        # 입고 예정 수량 (미도착 발주 합계, EA)
    wos: float           # 재고소진 주수 = 가용재고 ÷ 주당 평균판매량
    speed_per_day: float # 일 평균 소진 속도 (최근 28일 판매량 ÷ 28)


class HubInventoryResponse(BaseModel):
    hubs: List[HubCardData]

# --- HUB 재고 균형 매트릭스 (상품 x HUB 가용재고/WOS) ---
class ProductHubCell(BaseModel):
    hub_id: str      # HUB 고유 ID
    available: int   # 해당 상품의 해당 HUB 가용재고 (EA)
    wos: float        # 해당 상품의 해당 HUB WOS


class ProductHubRow(BaseModel):
    product_name: str          # 상품명 (예: 니트가디건)
    cells: List[ProductHubCell]  # HUB별 가용재고/WOS


class HubMatrixResponse(BaseModel):
    rows: List[ProductHubRow]

# --- 상품별 재고 탭 ---
class ProductSkuRow(BaseModel):
    sku_id: str
    product_id: str
    product_name: str
    category_large: str
    category_middle: str
    season_type: str
    color_name: str
    size_code: str
    available: int          # 가용재고
    safety_stock: int       # 안전재고 (서비스수준/가중치 반영 계산값)
    sales_90d: int           # 최근 90일 판매량
    daily_avg: float         # 일평균 판매량
    sell_through: float      # 판매율(%)
    wos: float                # 재고소진 주수
    claim_rate: float        # 클레임율(%)
    risk_status: str         # 품절 임박 / 과잉재고 / 장기재고 / 정상
    lead_time: int           # 평균 리드타임(일)
    moq: int                  # 최소발주수량
    incoming: int             # 입고 예정량 (미도착 발주)


class ProductInventoryListResponse(BaseModel):
    products: List[ProductSkuRow]


# --- 필터 드롭다운용 (SKU까지 포함한 계단식) ---
class SkuOption(BaseModel):
    sku_id: str
    color_name: Optional[str] = None
    size_code: Optional[str] = None


class ProductFilterOptionsResponse(BaseModel):
    category_large: List[str]
    category_middle: List[str]
    products: List[ProductOption]     # 이미 있는 ProductOption 재사용 (product_id, product_name)
    skus: List[SkuOption]

# --- HUB 간 권장 이동 및 진행 상태 ---
class TransferRecommendation(BaseModel):
    product_name: str
    from_hub: str        # 출발 HUB명 (WOS 높은 = 과잉)
    to_hub: str           # 도착 HUB명 (WOS 낮은 = 부족)
    qty: int               # 권장 이동 수량
    before_from: float    # 출발 HUB 이동 전 WOS
    after_from: float     # 출발 HUB 이동 후 예상 WOS
    before_to: float      # 도착 HUB 이동 전 WOS
    after_to: float       # 도착 HUB 이동 후 예상 WOS
    status: str = "이동"  # 실제 승인 워크플로우 아님, 고정 텍스트


class TransferRecommendationResponse(BaseModel):
    transfers: List[TransferRecommendation]

# --- 목표 매출 설정 (GoalModal에서 조회/저장) ---
class GoalSettingsResponse(BaseModel):
    day_amount: int
    week_amount: int
    month_amount: int
    year_amount: int

    class Config:
        from_attributes = True


class GoalSettingsUpdate(BaseModel):
    day_amount: int
    week_amount: int
    month_amount: int
    year_amount: int

# --- 역할별 접근 인증 ---
class AuthRequest(BaseModel):
    password: str


class AuthResponse(BaseModel):
    role: str  # "ceo" | "md" | "stock" | ""
    success: bool