# 26.08.04 백엔드 구축 KPI 카드 및 차트용 API 엔드포인트

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정
# 26.08.06 이슈수정 테스트 코드
# 26.08.06 예측 탭: 재고 원본(dbo.INVENTORY) 연동, 기준일 2025-12-31 고정

# 기존 (ProductInventoryResponse 누락)
# from app.schemas.dashboard import SalesTrendResponse

from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, literal_column
from typing import List, Optional

from app.core.database import get_db
from app.models.sales import Order
from app.models.product import Product, ProductSku
from app.models.inventory import Inventory
from app.models.inventory_raw import InventoryRaw
from app.models.forecast import DemandForecastResult
from app.models.purchase_order import PurchaseOrder
from app.schemas.dashboard import (
    SalesTrendResponse,
    ProductInventoryResponse,
    ForecastResponse,
    ForecastChartPoint,
    FilterOptionsResponse,
    ProductOption,
    CategorySalesResponse,
    HubCardData, #HUBS 탭에 사용
    HubInventoryResponse, #HUBS 탭에 사용
    ProductHubCell, #HUBS 탭에 사용
    ProductHubRow, #HUBS 탭에 사용
    HubMatrixResponse, #HUBS 탭에 사용
)

router = APIRouter()

# 원본 데이터가 2025-12-31까지만 있어서, "오늘"을 이 날짜로 고정
REFERENCE_DATE = date(2025, 12, 31)


@router.get("/sales-trend", response_model=List[SalesTrendResponse])
def get_sales_trend(
    category: Optional[str] = Query("전체"),
    db: Session = Depends(get_db)
):
    """
    Azure DB dbo.ORDERS 테이블 연동: 월별 순매출 조회
    """
    month_col = literal_column("FORMAT(dbo.ORDERS.order_datetime, 'MM')")

    query = (
        db.query(
            month_col.label("month"),
            func.sum(Order.total_sales).label("sales")
        )
        .group_by(month_col)
        .order_by(month_col)
    )

    results = query.all()

    return [{"month": str(r[0]), "sales": float(r[1] or 0)} for r in results]


@router.get("/risk-products", response_model=List[ProductInventoryResponse])
def get_risk_products(
    category: Optional[str] = Query("전체"),
    hub: Optional[str] = Query("전체"),
    db: Session = Depends(get_db)
):
    """
    위험 SKU 상품 목록 및 재고 조회
    """
    query = db.query(Product, Inventory).join(
        Inventory, Product.sku == Inventory.sku
    )

    if category and category not in ["전체", "ALL"]:
        query = query.filter(Product.category == category)
    if hub and hub not in ["전체", "ALL"]:
        query = query.filter(Inventory.hub_name == hub)

    results = query.all()

    response = []
    for prod, inv in results:
        response.append(
            ProductInventoryResponse(
                id=prod.id,
                sku=prod.sku,
                product_name=prod.product_name,
                category=prod.category,
                current_stock=inv.current_stock,
                safety_stock=inv.safety_stock,
                wos=inv.wos,
                sell_through_rate=inv.sell_through_rate,
                claim_rate=inv.claim_rate,
                inbound_plan=inv.inbound_plan,
                risk_status=inv.risk_status,
            )
        )
    return response


@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    product_id: str = Query(..., description="사용자가 선택한 상품 (product_id 기준)"),
    weeks: int = Query(4, ge=1, le=4, description="예측 기간(주): 1~4"),
    db: Session = Depends(get_db)
):
    sku_rows = db.query(ProductSku).filter(ProductSku.product_id == product_id).all()
    if not sku_rows:
        raise HTTPException(status_code=404, detail=f"product_id '{product_id}' 정보를 찾을 수 없습니다.")
    sku_ids = [r.sku_id for r in sku_rows]

    # 재고: 최신 스냅샷(2025-12-31) 기준, 해당 product_id의 모든 SKU × 모든 HUB 합산
    inv_rows = (
        db.query(InventoryRaw)
        .filter(InventoryRaw.sku_id.in_(sku_ids))
        .filter(InventoryRaw.snapshot_date == REFERENCE_DATE)
        .all()
    )
    current_available = sum(r.available_qty or 0 for r in inv_rows)
    incoming = sum(r.in_transit_qty or 0 for r in inv_rows)

    # 예측 데이터: 기준일 이후(week_start > 2025-12-31)를 "미래"로 취급
    rows = (
        db.query(DemandForecastResult)
        .filter(DemandForecastResult.product_id == product_id)
        .order_by(DemandForecastResult.week_start)
        .all()
    )
    past_rows = [r for r in rows if r.week_start <= REFERENCE_DATE]
    future_rows = [r for r in rows if r.week_start > REFERENCE_DATE][:weeks]

    chart = [ForecastChartPoint(week=str(r.week_start), actual=r.actual_qty) for r in past_rows[-8:]]

    # 실선과 점선이 시각적으로 이어지도록, 마지막 실제값 지점에 predicted도 같이 채움
    if chart and future_rows:
        chart[-1].predicted = chart[-1].actual

    chart += [ForecastChartPoint(week=str(r.week_start), predicted=r.predicted_qty) for r in future_rows]

    expected_sales = round(sum(r.predicted_qty for r in future_rows))
    ending_inventory = max(0, current_available + incoming - expected_sales)

    po_rows = db.query(PurchaseOrder).filter(PurchaseOrder.sku_id.in_(sku_ids)).all()
    lead_times = [r.lead_time for r in po_rows if r.lead_time]
    avg_lead_time_days = sum(lead_times) / len(lead_times) if lead_times else 14
    avg_lead_time_weeks = avg_lead_time_days / 7
    moq = max((r.moq for r in po_rows if r.moq), default=0)

    # safety_stock은 원본 데이터에 없어서, 최근 4주 평균판매량 × 2주로 근사
    recent_avg_weekly = (
        sum(r.actual_qty for r in past_rows[-4:]) / len(past_rows[-4:])
        if past_rows else 0
    )
    safety_target = recent_avg_weekly * 2

    weekly_avg_sales = expected_sales / weeks if weeks else 0
    leadtime_demand = weekly_avg_sales * avg_lead_time_weeks
    raw_order_qty = max(0, (safety_target - current_available) + leadtime_demand)
    recommended_order = int(max(raw_order_qty, moq)) if raw_order_qty > 0 else 0

    order_date = None
    if ending_inventory <= 0 and weekly_avg_sales > 0:
        weeks_to_stockout = current_available / weekly_avg_sales
        stockout_date = REFERENCE_DATE + timedelta(weeks=weeks_to_stockout)
        order_date = (stockout_date - timedelta(days=avg_lead_time_days)).isoformat()

    wos = (current_available / weekly_avg_sales) if weekly_avg_sales else 0
    excess_qty = max(0, round(current_available - weekly_avg_sales * 8)) if wos > 8 else 0

    has_forecast_data = len(future_rows) > 0

    return ForecastResponse(
        product_id=product_id,
        has_forecast_data=has_forecast_data,
        expected_sales=expected_sales,
        ending_inventory=ending_inventory,
        recommended_order=recommended_order,
        order_date=order_date,
        current_available=current_available,
        incoming=incoming,
        excess_qty=excess_qty,
        chart=chart,
    )


@router.get("/filter-options", response_model=FilterOptionsResponse)
def get_filter_options(
    category_large: Optional[str] = Query(None),
    category_middle: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # 대분류 목록 (전체 고정 — 항상 모든 대분류를 보여줌)
    large_options = [r[0] for r in db.query(ProductSku.category_large).distinct().all()]

    # 중분류 목록 (대분류 선택 시 그 안에서만 필터링)
    middle_query = db.query(ProductSku.category_middle).distinct()
    if category_large:
        middle_query = middle_query.filter(ProductSku.category_large == category_large)
    middle_options = [r[0] for r in middle_query.all()]

    # 상품 목록 (product_id + product_name, 대/중분류로 필터링, 색상·사이즈 무관하게 중복 제거)
    product_query = db.query(ProductSku.product_id, ProductSku.product_name).distinct()
    if category_large:
        product_query = product_query.filter(ProductSku.category_large == category_large)
    if category_middle:
        product_query = product_query.filter(ProductSku.category_middle == category_middle)

    products = [
        ProductOption(product_id=r[0], product_name=r[1]) for r in product_query.all()
    ]

    return FilterOptionsResponse(
        category_large=large_options,
        category_middle=middle_options,
        products=products,
    )

@router.get("/category-sales", response_model=List[CategorySalesResponse])
def get_category_sales(
    db: Session = Depends(get_db)
):
    """
    Azure DB dbo.ORDERS × dbo.PRODUCT_SKU 연동: 카테고리(대분류)별 순매출 조회
    """
    query = (
        db.query(
            ProductSku.category_large.label("category"),
            func.sum(Order.total_sales).label("sales")
        )
        .join(ProductSku, Order.sku_id == ProductSku.sku_id)
        .group_by(ProductSku.category_large)
        .order_by(func.sum(Order.total_sales).desc())
    )

    results = query.all()

    if not results:
        return []

    max_sales = max(float(r.sales or 0) for r in results)

    return [
        CategorySalesResponse(
            name=r.category,
            value=float(r.sales or 0),
            percentage=round((float(r.sales or 0) / max_sales) * 100, 1) if max_sales > 0 else 0,
        )
        for r in results
    ]

@router.get("/hub-inventory", response_model=HubInventoryResponse)
def get_hub_inventory(db: Session = Depends(get_db)):
    """
    HUB별 재고 관리 탭: dbo.INVENTORY(원본) 기준, REFERENCE_DATE 스냅샷 사용
    """
    # 1. 재고: REFERENCE_DATE 스냅샷의 전체 행 조회
    inv_rows = (
        db.query(InventoryRaw)
        .filter(InventoryRaw.snapshot_date == REFERENCE_DATE)
        .all()
    )

    # 2. hub_id 별로 그룹핑
    hub_map: dict[str, dict] = {}
    for r in inv_rows:
        h = hub_map.setdefault(r.hub_id, {
            "hub_id": r.hub_id,
            "hub_name": r.hub_name,
            "available": 0,
            "reserved": 0,
            "in_transit": 0,
        })
        h["available"] += r.available_qty or 0
        h["reserved"] += r.reserved_qty or 0
        h["in_transit"] += r.in_transit_qty or 0

    # 3. 입고 예정: PURCHASE_ORDERS에서 hub_id별 ordered_qty 합계
    #    (아직 도착 안 한 발주만 — actual_arrival_date IS NULL)
    po_rows = (
        db.query(PurchaseOrder.hub_id, func.sum(PurchaseOrder.ordered_qty))
        .filter(PurchaseOrder.actual_arrival_date.is_(None))
        .group_by(PurchaseOrder.hub_id)
        .all()
    )
    incoming_map = {hub_id: qty or 0 for hub_id, qty in po_rows}

    # 4. 소진 속도: 최근 28일 hub_id별 order_qty 합계 ÷ 28
    period_start = REFERENCE_DATE - timedelta(days=28)
    sales_rows = (
        db.query(Order.hub_id, func.sum(Order.order_qty))
        .filter(Order.order_datetime >= period_start)
        .filter(Order.order_datetime <= REFERENCE_DATE)
        .group_by(Order.hub_id)
        .all()
    )
    speed_map = {hub_id: (qty or 0) / 28 for hub_id, qty in sales_rows}

    # 5. 응답 조립 + WOS 계산 (예측 탭과 동일 공식: 가용재고 ÷ 주당 평균판매량)
    result = []
    for hub_id, h in hub_map.items():
        speed = speed_map.get(hub_id, 0)
        weekly_speed = speed * 7
        wos = round(h["available"] / weekly_speed, 1) if weekly_speed else 0.0

        result.append(HubCardData(
            hub_id=h["hub_id"],
            hub_name=h["hub_name"],
            available=h["available"],
            reserved=h["reserved"],
            in_transit=h["in_transit"],
            incoming=incoming_map.get(hub_id, 0),
            wos=wos,
            speed_per_day=round(speed, 1),
        ))

    result.sort(key=lambda x: x.hub_id)
    return HubInventoryResponse(hubs=result)

# 26.08.07 HUB 재고 균형 매트릭스: 고정 4개 상품 x HUB별 가용재고/WOS API (dbo.INVENTORY 원본 연동)
@router.get("/hub-inventory-matrix", response_model=HubMatrixResponse)
def get_hub_inventory_matrix(
    top_n: int = Query(4, ge=1, le=20, description="HUB간 WOS 차이 큰 순 상위 N개 상품"),
    db: Session = Depends(get_db)
):
    """
    HUB 재고 균형 매트릭스: HUB간 WOS 차이가 큰 상위 N개 상품 자동 선정
    (UI의 '[WOS 차이 큰 순]' 라벨에 맞춰 동적 선정 — 고정 상품 리스트 아님)
    """
    hub_ids = [r[0] for r in db.query(InventoryRaw.hub_id).distinct().all()]

    # sku_id -> (product_id, product_name) 매핑
    sku_map = {r.sku_id: (r.product_id, r.product_name) for r in db.query(ProductSku).all()}

    # 1. 재고: REFERENCE_DATE 스냅샷 전체, sku_id+hub_id 별 available_qty
    inv_rows = (
        db.query(InventoryRaw.sku_id, InventoryRaw.hub_id, InventoryRaw.available_qty)
        .filter(InventoryRaw.snapshot_date == REFERENCE_DATE)
        .all()
    )

    # 2. 판매량: 최근 28일, sku_id+hub_id 별 order_qty 합계
    period_start = REFERENCE_DATE - timedelta(days=28)
    sales_rows = (
        db.query(Order.sku_id, Order.hub_id, func.sum(Order.order_qty))
        .filter(Order.order_datetime >= period_start)
        .filter(Order.order_datetime <= REFERENCE_DATE)
        .group_by(Order.sku_id, Order.hub_id)
        .all()
    )
    sales_map: dict[tuple, int] = {}
    for sku_id, hub_id, qty in sales_rows:
        sales_map[(sku_id, hub_id)] = qty or 0

    # 3. sku 단위 데이터를 product_id 단위로 합산 (hub별)
    product_hub_available: dict[str, dict[str, int]] = {}
    product_names: dict[str, str] = {}

    for sku_id, hub_id, available_qty in inv_rows:
        mapping = sku_map.get(sku_id)
        if not mapping:
            continue
        product_id, product_name = mapping
        product_names[product_id] = product_name
        product_hub_available.setdefault(product_id, {}).setdefault(hub_id, 0)
        product_hub_available[product_id][hub_id] += available_qty or 0

    product_hub_sales: dict[str, dict[str, int]] = {}
    for (sku_id, hub_id), qty in sales_map.items():
        mapping = sku_map.get(sku_id)
        if not mapping:
            continue
        product_id, _ = mapping
        product_hub_sales.setdefault(product_id, {}).setdefault(hub_id, 0)
        product_hub_sales[product_id][hub_id] += qty

    # 4. product별 hub별 WOS 계산 + HUB간 WOS 차이(diff) 산출
    candidates = []
    for product_id, hub_avail in product_hub_available.items():
        cells = []
        wos_list = []
        for hub_id in hub_ids:
            available = hub_avail.get(hub_id, 0)
            sales_qty = product_hub_sales.get(product_id, {}).get(hub_id, 0)
            weekly_speed = (sales_qty / 28) * 7
            wos = round(available / weekly_speed, 1) if weekly_speed else 0.0
            wos_list.append(wos)
            cells.append(ProductHubCell(hub_id=hub_id, available=available, wos=wos))

        diff = max(wos_list) - min(wos_list) if wos_list else 0
        candidates.append((diff, product_names.get(product_id, product_id), cells))

    # 5. WOS 차이 큰 순 정렬 → 상위 N개만 선정
    candidates.sort(key=lambda x: x[0], reverse=True)
    top = candidates[:top_n]

    rows = [ProductHubRow(product_name=name, cells=cells) for _, name, cells in top]
    return HubMatrixResponse(rows=rows)