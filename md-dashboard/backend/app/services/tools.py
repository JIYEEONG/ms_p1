# app/services/tools.py
# 26.08.07 AI 챌린지 서비스 구축에 따른 파일 추가
# 26.08.XX 기간별 필터링 지원 추가 (start_date/end_date 파라미터, WHERE절 반영)
#   -> 함수 시그니처와 반환 키는 그대로 유지. 쿼리 안에 기간 조건만 추가함.
#   -> 아래 표시된 부분 외에는 원본과 동일.

import pyodbc
from typing import Dict, Any, Optional
from app.core.config import settings

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

        # 디버그 로그
        print(f"\n================ [DB QUERY SUCCESS] ================")
        print(f"기간 필터: {start_date} ~ {end_date}" if start_date else "기간 필터: 없음(전체)")
        print(f"Total Revenue : {revenue:,.0f} 원")
        print(f"Total Qty     : {qty:,} 개")
        print(f"ASP           : {asp:,.0f} 원")
        print(f"ATV           : {atv:,.0f} 원")
        print(f"Trend Data    : {len(monthly_trend)}건")
        print(f"===================================================\n")

        return {
            "total_sales": revenue,
            "total_qty": qty,
            "item_cnt": item_cnt,
            "asp": asp,
            "atv": atv,
            "upt": upt,
            "target_rate": "284.7%",  # TODO: 하드코딩 - 별도 개선 필요 (이번 작업 범위 아님, 확인 필요)
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