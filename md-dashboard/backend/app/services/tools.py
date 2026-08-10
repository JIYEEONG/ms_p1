# app/services/tools.py
# 26.08.07 AI 챌린지 서비스 구축에 따른 파일 추가
# 26.08.XX 기간별 필터링 지원 추가 (start_date/end_date 파라미터, WHERE절 반영)
#   -> 함수 시그니처와 반환 키는 그대로 유지. 쿼리 안에 기간 조건만 추가함.
#   -> 아래 표시된 부분 외에는 원본과 동일.

import pyodbc
from typing import Dict, Any, Optional
from app.core.config import settings
from app.models.goal_settings import GoalSettings

def get_db_connection():
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={settings.DB_SERVER},{settings.DB_PORT};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD};"
        f"Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


# ============================================================
# [신규] 기간별 필터링 지원
# ============================================================
def get_kpi_and_efficiency(start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """
    1. ORDERS 테이블 전체 실적 및 부문별 ASP/ATV 추이 집계 (예외 차단 안전 쿼리)

    start_date, end_date: "YYYY-MM-DD HH:MM:SS" 형식 문자열 (period_parser의 start_datetime/end_datetime).
    둘 다 None이면 기존과 동일하게 전체 기간 집계 (하위 호환).
    """

    # [변경] 기간 조건절을 옵션으로 구성 - start_date/end_date가 없으면 조건 없이 전체 조회(기존 동작 유지)
    date_filter_sql = ""
    params = []
    if start_date and end_date:
        date_filter_sql = "WHERE order_datetime BETWEEN ? AND ?"
        params = [start_date, end_date]

    # 1. 전체 실적 쿼리 (NULL 방어 + 형변환 안전 쿼리)
    kpi_query = f"""
        SELECT 
            ISNULL(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)), 0) AS revenue,
            ISNULL(SUM(CAST(ISNULL(order_qty, 0) AS BIGINT)), 0) AS qty,
            ISNULL(COUNT(order_item_id), 0) AS item_cnt
        FROM ORDERS 
        {date_filter_sql}
    """

    # 2. [변경] 일별 추이 쿼리 - "최근 6개월 고정"에서 "요청 기간 내 일자별 추이"로 변경.
    #    기간 내 데이터만 집계해야 하므로(요청사항), 기간 파라미터가 없으면 기존처럼 최근 6개월(월별) 유지.
    if start_date and end_date:
        trend_query = """
            SELECT
                FORMAT(order_datetime, 'yyyy-MM-dd') AS bucket,
                ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(SUM(CAST(ISNULL(order_qty, 0) AS BIGINT)), 0), 0) AS asp,
                ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(COUNT(order_item_id), 0), 0) AS atv
            FROM ORDERS
            WHERE order_datetime BETWEEN ? AND ?
            GROUP BY FORMAT(order_datetime, 'yyyy-MM-dd')
            ORDER BY bucket ASC
        """
        trend_params = [start_date, end_date]
    else:
        trend_query = """
            SELECT TOP 6
                FORMAT(order_datetime, 'yyyy-MM') AS bucket,
                ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(SUM(CAST(ISNULL(order_qty, 0) AS BIGINT)), 0), 0) AS asp,
                ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(COUNT(order_item_id), 0), 0) AS atv
            FROM ORDERS
            WHERE order_datetime IS NOT NULL
            GROUP BY FORMAT(order_datetime, 'yyyy-MM')
            ORDER BY bucket DESC
        """
        trend_params = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 전체 KPI 조회
        cursor.execute(kpi_query, params) if params else cursor.execute(kpi_query)
        row = cursor.fetchone()

        revenue = float(row.revenue or 0)
        qty = int(row.qty or 0)
        item_cnt = int(row.item_cnt or 0)

        asp = round(revenue / qty, 0) if qty > 0 else 0
        atv = round(revenue / item_cnt, 0) if item_cnt > 0 else 0
        upt = round(qty / item_cnt, 2) if item_cnt > 0 else 0

        # 추이 조회
        cursor.execute(trend_query, trend_params) if trend_params else cursor.execute(trend_query)
        trend_rows = cursor.fetchall()
        conn.close()

        if start_date and end_date:
            monthly_trend = [
                {"name": str(r.bucket), "ASP": int(r.asp or 0), "ATV": int(r.atv or 0)}
                for r in trend_rows if r.bucket
            ]
        else:
            monthly_trend = [
                {"name": str(r.bucket), "ASP": int(r.asp or 0), "ATV": int(r.atv or 0)}
                for r in reversed(trend_rows) if r.bucket
            ]

        # [신규] target_rate 실계산 - GOAL_SETTINGS(연간 목표)을 기간 일수로 비례 환산해서 달성률 계산
        period_days = None
        if start_date and end_date:
            fmt = "%Y-%m-%d %H:%M:%S"
            period_days = (datetime.strptime(end_date, fmt) - datetime.strptime(start_date, fmt)).days + 1

        target_amount = get_target_amount(period_days)
        target_rate = round((revenue / target_amount) * 100, 1) if target_amount > 0 else 0.0
        target_rate_str = f"{target_rate}%"

        # 디버그 로그
        print(f"\n================ [DB QUERY SUCCESS] ================")
        print(f"기간 필터: {start_date} ~ {end_date}" if start_date else "기간 필터: 없음(전체)")
        print(f"Total Revenue : {revenue:,.0f} 원")
        print(f"Total Qty     : {qty:,} 개")
        print(f"ASP           : {asp:,.0f} 원")
        print(f"ATV           : {atv:,.0f} 원")
        print(f"Target Amount : {target_amount:,.0f} 원 (기간 {period_days}일 비례)" if period_days else f"Target Amount : {target_amount:,.0f} 원 (연간 전체)")
        print(f"Target Rate   : {target_rate_str}")
        print(f"Trend Data    : {len(monthly_trend)}건")
        print(f"===================================================\n")

        return {
            "total_sales": revenue,
            "total_qty": qty,
            "item_cnt": item_cnt,
            "asp": asp,
            "atv": atv,
            "upt": upt,
            "target_rate": target_rate_str,
            "monthly_trend": monthly_trend
        }
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_kpi_and_efficiency]: {e}\n")
        return {
            "total_sales": 0,
            "total_qty": 0,
            "item_cnt": 0,
            "asp": 0,
            "atv": 0,
            "upt": 0,
            "target_rate": "0.0%",
            "monthly_trend": []
        }


def get_inventory_risk(start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """
    2. 재고 리스크 현황 집계 (HUB별)

    [변경] 기존엔 INVENTORY 테이블의 모든 snapshot_date를 필터 없이 그대로 GROUP BY 해서
    같은 SKU가 스냅샷 날짜별로 중복 집계되는 문제가 있었음.
    -> end_date(요청 기간의 마지막 날짜) 기준 "가장 최근 스냅샷 하루"만 사용하도록 변경.
    -> start_date/end_date가 없으면 기존과 동일하게 전체(모든 스냅샷) 집계 (하위 호환).
    """
    as_of_date = end_date.split(" ")[0] if end_date else None  # "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DD"

    if as_of_date:
        query = """
            SELECT 
                hub_id,
                ISNULL(SUM(CASE WHEN stockout_yn = 1 THEN 1 ELSE 0 END), 0) AS stockout_risk_cnt,
                ISNULL(SUM(available_qty), 0) AS total_available_qty
            FROM INVENTORY
            WHERE snapshot_date = (
                SELECT MAX(snapshot_date) FROM INVENTORY WHERE snapshot_date <= ?
            )
            GROUP BY hub_id
        """
        params = [as_of_date]
    else:
        query = """
            SELECT 
                hub_id,
                ISNULL(SUM(CASE WHEN stockout_yn = 1 THEN 1 ELSE 0 END), 0) AS stockout_risk_cnt,
                ISNULL(SUM(available_qty), 0) AS total_available_qty
            FROM INVENTORY
            GROUP BY hub_id
        """
        params = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params) if params else cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()

        hub_data = []
        for r in rows:
            hub_data.append({
                "name": str(r.hub_id),
                "위험수량": int(r.stockout_risk_cnt or 0),
                "가용재고": int(r.total_available_qty or 0)
            })

        print(f"\n================ [INVENTORY SUCCESS] ================")
        print(f"기준일: {as_of_date}" if as_of_date else "기준일: 없음(전체 스냅샷 합산)")
        print(f"HUB Data Count: {len(hub_data)}")
        print(f"===================================================\n")

        return {"hub_inventory_summary": hub_data}
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_inventory_risk]: {e}\n")
        return {"hub_inventory_summary": []}


# ============================================================
# [신규] 요청 기간이 실제 DB 데이터 범위 안에 있는지 확인용
# ============================================================
def get_orders_date_range() -> Dict[str, Any]:
    """ORDERS 테이블에 실제로 존재하는 최소/최대 order_datetime 조회 (기간 유효성 검사용)"""
    query = "SELECT MIN(order_datetime) AS min_dt, MAX(order_datetime) AS max_dt FROM ORDERS"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        row = cursor.fetchone()
        conn.close()
        return {
            "min_date": row.min_dt.date().isoformat() if row.min_dt else None,
            "max_date": row.max_dt.date().isoformat() if row.max_dt else None,
        }
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_orders_date_range]: {e}\n")
        return {"min_date": None, "max_date": None}

#목표값 설정
from datetime import datetime


def get_target_amount(period_days: Optional[int] = None) -> float:
    """
    GOAL_SETTINGS(연간 목표)을 조회해 기간 일수에 비례한 목표금액으로 환산.
    OverviewTab.tsx의 '년' 단위 goalAmount 계산(연 목표 × 기간일수/365)과 동일한 로직.
    """
    query = "SELECT TOP 1 year_amount FROM GOAL_SETTINGS ORDER BY id DESC"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        row = cursor.fetchone()
        conn.close()
        year_amount = float(row.year_amount) if row and row.year_amount else 0.0
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_target_amount]: {e}\n")
        return 0.0

    if not period_days:
        return year_amount
    return year_amount * (period_days / 365)

# ============================================================
# [신규] 엑셀 상세 리포트용 함수들
# app/services/tools.py 맨 아래에 그대로 추가하세요.
# 기존 함수(get_db_connection, get_kpi_and_efficiency, get_inventory_risk,
# get_orders_date_range)는 전혀 건드리지 않습니다 - 이 블록만 파일 끝에 추가.
#
# 중요: 아래 쿼리들은 order_status 필터를 걸지 않습니다 (전체 상태 포함:
# 정상/취소/반품/교환) - "반품 교환까지 포함한 모든 판매데이터" 요구사항 반영.
# 이는 기존 get_kpi_and_efficiency도 원래 status 필터가 없었던 것과 일관됨.
# ============================================================

from typing import List


def get_category_performance(start_date: str, end_date: str, level: str = "large", top_n: int = 5) -> List[Dict[str, Any]]:
    """대분류/중분류별 판매금액 Top N (level: 'large' 또는 'middle')"""
    col = "category_large" if level == "large" else "category_middle"
    query = f"""
        SELECT TOP {top_n}
            p.{col} AS category_name,
            ISNULL(SUM(CAST(ISNULL(o.selling_price, 0) AS BIGINT) * CAST(ISNULL(o.order_qty, 0) AS BIGINT)), 0) AS sales_amount
        FROM ORDERS o
        INNER JOIN PRODUCT_SKU p ON o.sku_id = p.sku_id
        WHERE o.order_datetime BETWEEN ? AND ?
        GROUP BY p.{col}
        ORDER BY sales_amount DESC
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, [start_date, end_date])
        rows = cursor.fetchall()
        conn.close()
        return [
            {"rank": i + 1, "name": str(r.category_name), "sales_amount": int(r.sales_amount or 0)}
            for i, r in enumerate(rows)
        ]
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_category_performance]: {e}\n")
        return []


def get_best10(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """판매금액 기준 베스트10 SKU - 가용재고/판매율/클레임 포함"""
    query = """
        SELECT TOP 10
            o.sku_id,
            p.category_large, p.category_middle, p.product_name,
            SUM(CAST(ISNULL(o.selling_price, 0) AS BIGINT) * CAST(ISNULL(o.order_qty, 0) AS BIGINT)) AS sales_amount,
            SUM(o.order_qty) AS sold_qty
        FROM ORDERS o
        INNER JOIN PRODUCT_SKU p ON o.sku_id = p.sku_id
        WHERE o.order_datetime BETWEEN ? AND ?
        GROUP BY o.sku_id, p.category_large, p.category_middle, p.product_name
        ORDER BY sales_amount DESC
    """
    as_of_date = end_date.split(" ")[0]

    stock_query = """
        SELECT sku_id, SUM(available_qty) AS available_qty
        FROM INVENTORY
        WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM INVENTORY WHERE snapshot_date <= ?)
        GROUP BY sku_id
    """
    claims_query = """
        SELECT o.sku_id, COUNT(*) AS claim_cnt
        FROM CLAIMS c
        INNER JOIN ORDERS o ON c.order_item_id = o.order_item_id
        WHERE c.claim_datetime BETWEEN ? AND ?
        GROUP BY o.sku_id
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(query, [start_date, end_date])
        rows = cursor.fetchall()

        cursor.execute(stock_query, [as_of_date])
        stock_map = {r.sku_id: int(r.available_qty or 0) for r in cursor.fetchall()}

        cursor.execute(claims_query, [start_date, end_date])
        claim_map = {r.sku_id: int(r.claim_cnt or 0) for r in cursor.fetchall()}

        conn.close()

        results = []
        for i, r in enumerate(rows):
            sold_qty = int(r.sold_qty or 0)
            available = stock_map.get(r.sku_id, 0)
            denom = sold_qty + available
            sell_through = round(sold_qty / denom, 2) if denom > 0 else 0.0
            results.append({
                "rank": i + 1,
                "sku": r.sku_id,
                "category_large": str(r.category_large or ""),
                "category_mid": str(r.category_middle or ""),
                "item_name": str(r.product_name or ""),
                "available_stock": available,
                "sell_through_rate": sell_through,
                "claims": claim_map.get(r.sku_id, 0),
            })
        return results
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_best10]: {e}\n")
        return []


def get_item_level_detail(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    해당기간/비교기간 판매 상세 시트용 - 판매된 SKU 전체 (Top N 아님, 전체).
    ⚠ order_status 필터 없음 -> 정상/취소/반품/교환 모두 포함된 합산 금액.
    """
    query = """
        SELECT
            o.sku_id,
            p.category_large, p.category_middle, p.product_name,
            MAX(o.normal_price) AS regular_price,
            SUM(CAST(ISNULL(o.selling_price, 0) AS BIGINT) * CAST(ISNULL(o.order_qty, 0) AS BIGINT)) AS sales_amount,
            SUM(o.order_qty) AS sold_qty
        FROM ORDERS o
        INNER JOIN PRODUCT_SKU p ON o.sku_id = p.sku_id
        WHERE o.order_datetime BETWEEN ? AND ?
        GROUP BY o.sku_id, p.category_large, p.category_middle, p.product_name
        ORDER BY sales_amount DESC
    """
    as_of_date = end_date.split(" ")[0]

    stock_query = """
        SELECT sku_id, SUM(available_qty) AS available_qty
        FROM INVENTORY
        WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM INVENTORY WHERE snapshot_date <= ?)
        GROUP BY sku_id
    """
    claims_query = """
        SELECT o.sku_id, COUNT(*) AS claim_cnt
        FROM CLAIMS c
        INNER JOIN ORDERS o ON c.order_item_id = o.order_item_id
        WHERE c.claim_datetime BETWEEN ? AND ?
        GROUP BY o.sku_id
    """
    arrival_query = """
        SELECT sku_id, MIN(expected_arrival_date) AS next_arrival
        FROM PURCHASE_ORDERS
        WHERE actual_arrival_date IS NULL AND expected_arrival_date >= ?
        GROUP BY sku_id
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(query, [start_date, end_date])
        rows = cursor.fetchall()

        cursor.execute(stock_query, [as_of_date])
        stock_map = {r.sku_id: int(r.available_qty or 0) for r in cursor.fetchall()}

        cursor.execute(claims_query, [start_date, end_date])
        claim_map = {r.sku_id: int(r.claim_cnt or 0) for r in cursor.fetchall()}

        cursor.execute(arrival_query, [as_of_date])
        arrival_map = {r.sku_id: r.next_arrival.isoformat() if r.next_arrival else "" for r in cursor.fetchall()}

        conn.close()

        results = []
        for i, r in enumerate(rows):
            sold_qty = int(r.sold_qty or 0)
            available = stock_map.get(r.sku_id, 0)
            denom = sold_qty + available
            sell_through = round(sold_qty / denom, 2) if denom > 0 else 0.0
            results.append({
                "rank": i + 1,
                "sku": r.sku_id,
                "category_large": str(r.category_large or ""),
                "category_mid": str(r.category_middle or ""),
                "item_name": str(r.product_name or ""),
                "regular_price": int(r.regular_price or 0),
                "sales_amount": int(r.sales_amount or 0),
                "available_stock": available,
                "sell_through_rate": sell_through,
                "claims": claim_map.get(r.sku_id, 0),
                "expected_arrival_date": arrival_map.get(r.sku_id, ""),
            })
        return results
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_item_level_detail]: {e}\n")
        return []


def get_daily_trend(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """일별 총매출 추이 (엑셀 이중꺾은선 차트용 원자료 - 일 단위로만 조회하고,
    주/월 단위로 묶는 건 Python 쪽(excel_report_builder.py)에서 처리)"""
    query = """
        SELECT
            CAST(order_datetime AS date) AS day,
            SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) AS revenue
        FROM ORDERS
        WHERE order_datetime BETWEEN ? AND ?
        GROUP BY CAST(order_datetime AS date)
        ORDER BY day ASC
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, [start_date, end_date])
        rows = cursor.fetchall()
        conn.close()
        return [{"date": r.day.isoformat(), "revenue": int(r.revenue or 0)} for r in rows]
    except Exception as e:
        print(f"\n[DB QUERY ERROR in get_daily_trend]: {e}\n")
        return []