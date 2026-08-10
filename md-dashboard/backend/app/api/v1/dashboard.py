# 26.08.04 백엔드 구축 KPI 카드 및 차트용 API 엔드포인트

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정
# 26.08.06 이슈수정 테스트 코드
# 26.08.06 예측 탭: 재고 원본(dbo.INVENTORY) 연동, 기준일 2025-12-31 고정

# 기존 (ProductInventoryResponse 누락)
# from app.schemas.dashboard import SalesTrendResponse

from datetime import date, timedelta
import calendar
import math
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Date, func, literal_column
from typing import List, Optional
from app.models.goal_settings import GoalSettings

from app.core.database import get_db
from app.models.sales import Order
from app.models.product import Product, ProductSku
from app.models.inventory import Inventory
from app.models.inventory_raw import InventoryRaw
from app.models.forecast import DemandForecastResult
from app.models.purchase_order import PurchaseOrder
from app.models.claims import Claim
from app.schemas.dashboard import (
    SalesTrendResponse,
    SalesTrendPoint,
    ProductInventoryResponse,
    ForecastResponse,
    ForecastChartPoint,
    FilterOptionsResponse,
    OverviewFilterOptionsResponse,
    OverviewKpiResponse,
    ProductOption,
    CategorySalesResponse,
    HubCardData, #HUBS 탭에 사용
    HubInventoryResponse, #HUBS 탭에 사용
    ProductHubCell, #HUBS 탭에 사용
    ProductHubRow, #HUBS 탭에 사용
    HubMatrixResponse, #HUBS 탭에 사용
    ProductSkuRow, #상품별 재고 탭에 사용
    ProductInventoryListResponse, #상품별 재고 탭에 사용
    SkuOption, #상품별 재고 탭에 사용
    ProductFilterOptionsResponse, #상품별 재고 탭에 사용
    TransferRecommendation, #HUBS 탭 이동 권장에 사용
    TransferRecommendationResponse, #HUBS 탭 이동 권장에 사용
    GoalSettingsResponse, #목표값 설정
    GoalSettingsUpdate, #목표값 설정
)

router = APIRouter()

# 원본 데이터가 2025-12-31까지만 있어서, "오늘"을 이 날짜로 고정
REFERENCE_DATE = date(2025, 12, 31)


def _previous_year(value: date) -> date:
    day = min(value.day, calendar.monthrange(value.year - 1, value.month)[1])
    return value.replace(year=value.year - 1, day=day)


def _apply_overview_filters(
    query,
    start_date: date,
    end_date: date,
    category_large: Optional[str],
    category_middle: Optional[str],
    season: Optional[str],
    hub: Optional[str],
    db: Session,
):
    query = query.filter(Order.order_datetime >= start_date)
    query = query.filter(Order.order_datetime < end_date + timedelta(days=1))

    if category_large or category_middle:
        query = query.join(ProductSku, Order.sku_id == ProductSku.sku_id)
        if category_large:
            query = query.filter(ProductSku.category_large == category_large)
        if category_middle:
            query = query.filter(ProductSku.category_middle == category_middle)

    season_months = {
        "봄(2월1일-4월30일)": [2, 3, 4],
        "여름(5월1일-8월31일)": [5, 6, 7, 8],
        "가을(9월1일-10월31일)": [9, 10],
        "겨울(11월1일-1월31일)": [11, 12, 1],
    }
    if season in season_months:
        query = query.filter(func.month(Order.order_datetime).in_(season_months[season]))

    if hub:
        hub_ids = [
            hub_id
            for (hub_id,) in (
                db.query(InventoryRaw.hub_id)
                .filter(InventoryRaw.hub_name == hub)
                .distinct()
                .all()
            )
        ]
        query = query.filter(Order.hub_id.in_(hub_ids))

    return query


@router.get("/sales-trend", response_model=SalesTrendResponse)
def get_sales_trend(
    start_date: date = Query(...),
    end_date: date = Query(...),
    unit: str = Query("month", pattern="^(week|month|year)$"),
    category_large: Optional[str] = Query(None),
    category_middle: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    hub: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """선택 기간의 주·월·연 단위 순매출을 전년·재작년과 비교한다."""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="시작일은 종료일보다 늦을 수 없습니다.")

    bucket_sql = {
        "week": "DATEADD(day, -(DATEDIFF(day, 0, dbo.ORDERS.order_datetime) % 7), CAST(dbo.ORDERS.order_datetime AS date))",
        "month": "DATEFROMPARTS(YEAR(dbo.ORDERS.order_datetime), MONTH(dbo.ORDERS.order_datetime), 1)",
        "year": "DATEFROMPARTS(YEAR(dbo.ORDERS.order_datetime), 1, 1)",
    }
    bucket = literal_column(bucket_sql[unit], type_=Date)
    claim_totals = (
        db.query(
            Claim.order_item_id.label("order_item_id"),
            func.sum(Claim.claim_qty).label("claim_qty"),
        )
        .group_by(Claim.order_item_id)
        .subquery()
    )

    def load_period(period_start: date, period_end: date):
        net_sales = func.sum(
            Order.total_sales
            - (func.coalesce(claim_totals.c.claim_qty, 0) * Order.selling_price)
        )
        query = (
            db.query(
                bucket.label("bucket_start"),
                net_sales.label("net_sales"),
                func.sum(Order.total_sales).label("gross_sales"),
            )
            .select_from(Order)
            .filter(Order.order_status == "정상")
            .outerjoin(claim_totals, claim_totals.c.order_item_id == Order.order_item_id)
        )
        query = _apply_overview_filters(
            query, period_start, period_end,
            category_large, category_middle, season, hub, db,
        )
        rows = query.group_by(bucket).order_by(bucket).all()
        return {
            row.bucket_start: (float(row.net_sales or 0), float(row.gross_sales or 0))
            for row in rows
        }

    def bucket_start_for(value: date) -> date:
        if unit == "week":
            return value - timedelta(days=value.weekday())
        if unit == "month":
            return value.replace(day=1)
        return value.replace(month=1, day=1)

    def next_bucket(value: date) -> date:
        if unit == "week":
            return value + timedelta(days=7)
        if unit == "month":
            return (value.replace(day=28) + timedelta(days=4)).replace(day=1)
        return value.replace(year=value.year + 1)

    def ordered_values(data, period_start: date, period_end: date):
        values = []
        item = bucket_start_for(period_start)
        while item <= period_end:
            values.append(data.get(item, (0.0, 0.0)))
            item = next_bucket(item)
        return values

    previous_start = _previous_year(start_date)
    previous_end = _previous_year(end_date)
    two_year_start = _previous_year(previous_start)
    two_year_end = _previous_year(previous_end)
    current = ordered_values(load_period(start_date, end_date), start_date, end_date)
    previous = ordered_values(load_period(previous_start, previous_end), previous_start, previous_end)
    two_year = ordered_values(load_period(two_year_start, two_year_end), two_year_start, two_year_end)

    points = []
    cursor = bucket_start_for(start_date)
    index = 0
    while cursor <= end_date:
        bucket_end = min(next_bucket(cursor) - timedelta(days=1), end_date)
        visible_start = max(cursor, start_date)
        current_values = current[index] if index < len(current) else (0.0, 0.0)
        previous_values = previous[index] if index < len(previous) else (0.0, 0.0)
        two_year_values = two_year[index] if index < len(two_year) else (0.0, 0.0)

        if unit == "week":
            label = cursor.strftime("%m.%d")
        elif unit == "month":
            label = cursor.strftime("%m월")
        else:
            label = cursor.strftime("%Y년")

        points.append(SalesTrendPoint(
            label=label,
            period_start=cursor.isoformat(),
            period_days=(bucket_end - visible_start).days + 1,
            current_net_sales=current_values[0],
            current_gross_sales=current_values[1],
            previous_net_sales=previous_values[0],
            previous_gross_sales=previous_values[1],
            two_year_net_sales=two_year_values[0],
            two_year_gross_sales=two_year_values[1],
        ))
        cursor = next_bucket(cursor)
        index += 1

    return SalesTrendResponse(
        current_label="해당 기간",
        previous_label="전년 동기",
        two_year_label="재작년 동기",
        points=points,
    )


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


@router.get("/overview-filter-options", response_model=OverviewFilterOptionsResponse)
def get_overview_filter_options(db: Session = Depends(get_db)):
    """현황 탭 분석 조건에 사용하는 SQL Server 기반 필터 목록."""
    min_date, max_date = db.query(
        func.min(Order.order_datetime),
        func.max(Order.order_datetime),
    ).one()

    if min_date is None or max_date is None:
        raise HTTPException(status_code=404, detail="ORDERS 테이블에 기간 데이터가 없습니다.")

    category_large = [
        value
        for (value,) in (
            db.query(ProductSku.category_large)
            .filter(ProductSku.category_large.isnot(None))
            .distinct()
            .order_by(ProductSku.category_large)
            .all()
        )
    ]
    category_middle = [
        value
        for (value,) in (
            db.query(ProductSku.category_middle)
            .filter(ProductSku.category_middle.isnot(None))
            .distinct()
            .order_by(ProductSku.category_middle)
            .all()
        )
    ]
    hubs = [
        value
        for (value,) in (
            db.query(InventoryRaw.hub_name)
            .filter(InventoryRaw.hub_name.isnot(None))
            .distinct()
            .order_by(InventoryRaw.hub_name)
            .all()
        )
    ]

    return OverviewFilterOptionsResponse(
        min_date=min_date.date().isoformat(),
        max_date=max_date.date().isoformat(),
        category_large=category_large,
        category_middle=category_middle,
        seasons=[
            "봄(2월1일-4월30일)",
            "여름(5월1일-8월31일)",
            "가을(9월1일-10월31일)",
            "겨울(11월1일-1월31일)",
        ],
        hubs=hubs,
    )


@router.get("/overview-kpis", response_model=OverviewKpiResponse)
def get_overview_kpis(
    start_date: date = Query(...),
    end_date: date = Query(...),
    category_large: Optional[str] = Query(None),
    category_middle: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    hub: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """현황 탭 분석 조건을 적용한 매출·주문·판매수량 KPI."""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="시작일은 종료일보다 늦을 수 없습니다.")

    totals_query = db.query(
        func.sum(Order.total_sales),
        func.count(func.distinct(Order.order_item_id)),
        func.sum(Order.order_qty),
    ).select_from(Order).filter(Order.order_status == "정상")
    totals_query = _apply_overview_filters(
        totals_query, start_date, end_date,
        category_large, category_middle, season, hub, db,
    )
    total_sales, order_count, total_units = totals_query.one()
    total_sales = float(total_sales or 0)
    order_count = int(order_count or 0)
    total_units = int(total_units or 0)

    previous_query = db.query(func.sum(Order.total_sales)).select_from(Order).filter(Order.order_status == "정상")
    previous_query = _apply_overview_filters(
        previous_query, _previous_year(start_date), _previous_year(end_date),
        category_large, category_middle, season, hub, db,
    )
    previous_sales = float(previous_query.scalar() or 0)
    sales_change_rate = (
        round(((total_sales - previous_sales) / previous_sales) * 100, 1)
        if previous_sales > 0 else None
    )

    claims_query = (
        db.query(func.sum(Claim.claim_qty))
        .select_from(Order)
        .join(Claim, Claim.order_item_id == Order.order_item_id)
    )
    claims_query = _apply_overview_filters(
        claims_query, start_date, end_date,
        category_large, category_middle, season, hub, db,
    )
    claimed_units = int(claims_query.scalar() or 0)
    period_days = (end_date - start_date).days + 1

    return OverviewKpiResponse(
        total_sales=total_sales,
        achievement_base_sales=total_sales,
        order_count=order_count,
        total_units=total_units,
        sales_change_rate=sales_change_rate,
        average_daily_orders=round(order_count / period_days, 1),
        return_rate=round((claimed_units / total_units) * 100, 1) if total_units else 0,
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

@router.get("/product-filter-options", response_model=ProductFilterOptionsResponse)
def get_product_filter_options(
    category_large: Optional[str] = Query(None),
    category_middle: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    상품별 재고 탭 필터 옵션: 대분류 → 중분류 → 상품(Product ID) → SKU 계단식
    """
    large_options = [r[0] for r in db.query(ProductSku.category_large).distinct().all()]

    middle_query = db.query(ProductSku.category_middle).distinct()
    if category_large:
        middle_query = middle_query.filter(ProductSku.category_large == category_large)
    middle_options = [r[0] for r in middle_query.all()]

    product_query = db.query(ProductSku.product_id, ProductSku.product_name).distinct()
    if category_large:
        product_query = product_query.filter(ProductSku.category_large == category_large)
    if category_middle:
        product_query = product_query.filter(ProductSku.category_middle == category_middle)
    products = [ProductOption(product_id=r[0], product_name=r[1]) for r in product_query.all()]

    sku_query = db.query(ProductSku.sku_id, ProductSku.color_name, ProductSku.size_code)
    if product_id:
        sku_query = sku_query.filter(ProductSku.product_id == product_id)
    elif category_large or category_middle:
        # product_id 선택 전이면, 대/중분류만으로 SKU 후보를 좁혀서 보여줌
        if category_large:
            sku_query = sku_query.filter(ProductSku.category_large == category_large)
        if category_middle:
            sku_query = sku_query.filter(ProductSku.category_middle == category_middle)
    skus = [SkuOption(sku_id=r[0], color_name=r[1], size_code=r[2]) for r in sku_query.all()]

    return ProductFilterOptionsResponse(
        category_large=large_options,
        category_middle=middle_options,
        products=products,
        skus=skus,
    )


@router.get("/product-inventory", response_model=ProductInventoryListResponse)
def get_product_inventory(
    category_large: Optional[str] = Query(None),
    category_middle: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    sku_id: Optional[str] = Query(None),
    risk_status: Optional[str] = Query(None, description="품절 임박 / 과잉재고 / 장기재고 / 정상"),
    service_level: int = Query(90, description="목표 서비스 수준(%): 90/95/99"),
    leadtime_factor: float = Query(1.5, description="리드타임 변동 가중치"),
    db: Session = Depends(get_db)
):
    """
    상품별 재고 탭: SKU 단위 상세 재고/판매/위험상태 목록
    성능 최적화: SKU마다 개별 쿼리하지 않고, 필요한 데이터를 벌크로 가져와 dict 매핑 후 계산
    """
    Z_TABLE = {90: 1.28, 95: 1.65, 99: 2.33}
    z_value = Z_TABLE.get(service_level, 1.28)

    sku_query = db.query(ProductSku)
    if category_large:
        sku_query = sku_query.filter(ProductSku.category_large == category_large)
    if category_middle:
        sku_query = sku_query.filter(ProductSku.category_middle == category_middle)
    if product_id:
        sku_query = sku_query.filter(ProductSku.product_id == product_id)
    if sku_id:
        sku_query = sku_query.filter(ProductSku.sku_id == sku_id)
    sku_rows = sku_query.all()
    sku_ids = [s.sku_id for s in sku_rows]

    if not sku_ids:
        return ProductInventoryListResponse(products=[])

    period_90_start = REFERENCE_DATE - timedelta(days=90)

    # 1. 가용재고: sku_id별 합계 (REFERENCE_DATE 스냅샷)
    inv_rows = (
        db.query(InventoryRaw.sku_id, func.sum(InventoryRaw.available_qty))
        .filter(InventoryRaw.sku_id.in_(sku_ids))
        .filter(InventoryRaw.snapshot_date == REFERENCE_DATE)
        .group_by(InventoryRaw.sku_id)
        .all()
    )
    available_map = {sid: qty or 0 for sid, qty in inv_rows}

    # 2. 최근 90일 판매량: sku_id별 합계
    sales_rows = (
        db.query(Order.sku_id, func.sum(Order.order_qty))
        .filter(Order.sku_id.in_(sku_ids))
        .filter(Order.order_datetime >= period_90_start)
        .filter(Order.order_datetime <= REFERENCE_DATE)
        .group_by(Order.sku_id)
        .all()
    )
    sales_map = {sid: qty or 0 for sid, qty in sales_rows}

    # 마지막 판매일: sku_id별 최신 order_datetime (전체 기간 대상, 90일 제한 없음)
    last_sale_rows = (
        db.query(Order.sku_id, func.max(Order.order_datetime))
        .filter(Order.sku_id.in_(sku_ids))
        .filter(Order.order_datetime <= REFERENCE_DATE)
        .group_by(Order.sku_id)
        .all()
    )
    last_sale_map = {sid: dt for sid, dt in last_sale_rows}

    # 3. 리드타임/MOQ/입고예정: PURCHASE_ORDERS 전체 행 (sku_id별로 파이썬에서 집계)
    po_rows = db.query(PurchaseOrder).filter(PurchaseOrder.sku_id.in_(sku_ids)).all()
    po_map: dict[str, list] = {}
    for r in po_rows:
        po_map.setdefault(r.sku_id, []).append(r)

    # 4. 클레임: ORDERS × CLAIMS 조인, 최근 90일, sku_id별 합계
    claim_rows = (
        db.query(Order.sku_id, func.sum(Claim.claim_qty))
        .join(Claim, Claim.order_item_id == Order.order_item_id)
        .filter(Order.sku_id.in_(sku_ids))
        .filter(Order.order_datetime >= period_90_start)
        .filter(Order.order_datetime <= REFERENCE_DATE)
        .filter(Claim.claim_datetime >= period_90_start)
        .filter(Claim.claim_datetime <= REFERENCE_DATE)
        .group_by(Order.sku_id)
        .all()
    )
    claim_map = {sid: qty or 0 for sid, qty in claim_rows}

    # 5. sku별 계산 (DB 쿼리 없이 dict lookup만 사용)
    results = []
    for sku in sku_rows:
        available = available_map.get(sku.sku_id, 0)
        sales_90d = sales_map.get(sku.sku_id, 0)
        daily_avg = sales_90d / 90
        weekly_avg = daily_avg * 7

        po_list = po_map.get(sku.sku_id, [])
        lead_times = [r.lead_time for r in po_list if r.lead_time]
        avg_lead_time = sum(lead_times) / len(lead_times) if lead_times else 14
        moq = max((r.moq for r in po_list if r.moq), default=0)
        incoming = sum(r.ordered_qty or 0 for r in po_list if r.actual_arrival_date is None)

        safety_stock = round(z_value * leadtime_factor * daily_avg * math.sqrt(avg_lead_time))

        denom = sales_90d + available
        sell_through = round((sales_90d / denom) * 100, 1) if denom > 0 else 0.0

        wos = round(available / weekly_avg, 1) if weekly_avg else 0.0

        claim_qty = claim_map.get(sku.sku_id, 0)
        claim_rate = round((claim_qty / sales_90d) * 100, 1) if sales_90d > 0 else 0.0

        # 무판매 일수: 마지막 판매일로부터 REFERENCE_DATE까지 며칠 지났는지
        last_sale_dt = last_sale_map.get(sku.sku_id)
        if last_sale_dt:
            days_no_sale = (REFERENCE_DATE - last_sale_dt.date()).days
        else:
            days_no_sale = 9999  # 판매 이력 자체가 없으면 무판매로 간주

        # 위험상태 판정 (공식 기준: 과잉재고=WOS 12주 이상, 장기재고=무판매 60일 이상)
        if available < safety_stock:
            status = "품절 임박"
        elif wos >= 12:
            status = "과잉재고"
        elif days_no_sale >= 60:
            status = "장기재고"
        else:
            status = "정상"

        if risk_status and risk_status not in ["전체", "ALL"] and status != risk_status:
            continue

        results.append(ProductSkuRow(
            sku_id=sku.sku_id,
            product_id=sku.product_id,
            product_name=sku.product_name,
            category_large=sku.category_large or "",
            category_middle=sku.category_middle or "",
            season_type=sku.season_type or "",
            color_name=sku.color_name or "",
            size_code=sku.size_code or "",
            available=available,
            safety_stock=safety_stock,
            sales_90d=sales_90d,
            daily_avg=round(daily_avg, 2),
            sell_through=sell_through,
            wos=wos,
            claim_rate=claim_rate,
            risk_status=status,
            lead_time=round(avg_lead_time),
            moq=moq,
            incoming=incoming,
        ))

    return ProductInventoryListResponse(products=results)

@router.get("/hub-transfer-recommendation", response_model=TransferRecommendationResponse)
def get_hub_transfer_recommendation(
    top_n: int = Query(20, ge=1, le=38, description="WOS 차이 큰 순 상위 N개 상품 (후보 풀, 결과는 이보다 적을 수 있음)"),
    result_limit: int = Query(4, ge=1, le=20, description="최종 화면에 보여줄 이동 추천 개수"),
    db: Session = Depends(get_db)
):
    """
    HUB 간 권장 이동: 매트릭스와 동일한 방식으로 WOS 차이 큰 상위 N개 상품 선정,
    과잉(WOS 높은) HUB → 부족(WOS 낮은) HUB로 이동 수량 자동 계산
    상태는 실제 승인 워크플로우가 없어 항상 "이동" 고정 (진행상태 관리 기능은 추후 구현 예정)
    """
    hub_ids = [r[0] for r in db.query(InventoryRaw.hub_id).distinct().all()]
    hub_names = {r.hub_id: r.hub_name for r in db.query(InventoryRaw).filter(InventoryRaw.snapshot_date == REFERENCE_DATE).all()}

    sku_map = {r.sku_id: (r.product_id, r.product_name) for r in db.query(ProductSku).all()}

    inv_rows = (
        db.query(InventoryRaw.sku_id, InventoryRaw.hub_id, InventoryRaw.available_qty)
        .filter(InventoryRaw.snapshot_date == REFERENCE_DATE)
        .all()
    )

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

    candidates = []
    for product_id, hub_avail in product_hub_available.items():
        hub_wos = {}
        hub_speed = {}
        for hub_id in hub_ids:
            available = hub_avail.get(hub_id, 0)
            sales_qty = product_hub_sales.get(product_id, {}).get(hub_id, 0)
            weekly_speed = (sales_qty / 28) * 7
            wos = round(available / weekly_speed, 1) if weekly_speed else 0.0
            hub_wos[hub_id] = wos
            hub_speed[hub_id] = weekly_speed

        wos_values = list(hub_wos.values())
        diff = max(wos_values) - min(wos_values) if wos_values else 0
        candidates.append((diff, product_id, hub_avail, hub_wos, hub_speed))

    candidates.sort(key=lambda x: x[0], reverse=True)
    top = candidates[:top_n]

    transfers = []
    for diff, product_id, hub_avail, hub_wos, hub_speed in top:
        from_hub = max(hub_wos, key=hub_wos.get)  # WOS 가장 높음 = 과잉

        # 도착지 후보: 판매속도가 0(최근 28일 무판매)인 HUB는 제외
        # + WOS 8주 미만(진짜 부족한 수준)인 HUB만 후보로 인정
        to_candidates = {
            h: w for h, w in hub_wos.items()
            if hub_speed.get(h, 0) > 0 and w < 8
        }
        if not to_candidates:
            continue  # 진짜로 부족한 HUB가 없으면 이 상품은 이동 추천 스킵
        to_hub = min(to_candidates, key=to_candidates.get)  # 후보 중 WOS 가장 낮음 = 가장 부족

        if from_hub == to_hub:
            continue

        avail_from = hub_avail.get(from_hub, 0)
        avail_to = hub_avail.get(to_hub, 0)

        # 권장 수량: 두 HUB 가용재고 차이의 절반 (균형점에 가깝게)
        qty = max(0, round((avail_from - avail_to) / 2))
        if qty <= 0:
            continue

        speed_from = hub_speed.get(from_hub, 0)
        speed_to = hub_speed.get(to_hub, 0)

        after_from = round((avail_from - qty) / speed_from, 1) if speed_from else 0.0
        after_to = round((avail_to + qty) / speed_to, 1) if speed_to else 0.0

        transfers.append(TransferRecommendation(
            product_name=product_names.get(product_id, product_id),
            from_hub=hub_names.get(from_hub, from_hub),
            to_hub=hub_names.get(to_hub, to_hub),
            qty=qty,
            before_from=hub_wos.get(from_hub, 0.0),
            after_from=after_from,
            before_to=hub_wos.get(to_hub, 0.0),
            after_to=after_to,
            status="이동",
        ))

    return TransferRecommendationResponse(transfers=transfers[:result_limit])

@router.get("/goal-settings", response_model=GoalSettingsResponse)
def get_goal_settings(db: Session = Depends(get_db)):
    """목표 매출 설정 조회 (항상 가장 최근 1행)."""
    goal = db.query(GoalSettings).order_by(GoalSettings.id.desc()).first()
    if not goal:
        raise HTTPException(status_code=404, detail="목표 설정이 아직 없습니다.")
    return goal

#목표값 설정
@router.put("/goal-settings", response_model=GoalSettingsResponse)
def update_goal_settings(
    payload: GoalSettingsUpdate,
    db: Session = Depends(get_db),
):
    """목표 매출 설정 저장 (기존 1행을 UPDATE, 새 행 추가 아님)."""
    goal = db.query(GoalSettings).order_by(GoalSettings.id.desc()).first()
    if not goal:
        raise HTTPException(status_code=404, detail="목표 설정이 아직 없습니다. 초기 데이터를 먼저 등록해주세요.")

    goal.day_amount = payload.day_amount
    goal.week_amount = payload.week_amount
    goal.month_amount = payload.month_amount
    goal.year_amount = payload.year_amount

    db.commit()
    db.refresh(goal)
    return goal