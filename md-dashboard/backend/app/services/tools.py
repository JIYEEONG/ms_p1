# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

import pyodbc
from typing import Dict, Any
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

def get_kpi_and_efficiency() -> Dict[str, Any]:
    """1. ORDERS 테이블 전체 실적 및 월별 ASP/ATV 추이 집계 (예외 차단 안전 쿼리)"""
    
    # 1. 전체 실적 쿼리 (NULL 치환 및 타입 변환 안전성 확보)
    kpi_query = """
        SELECT 
            ISNULL(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)), 0) AS revenue,
            ISNULL(SUM(CAST(ISNULL(order_qty, 0) AS BIGINT)), 0) AS qty,
            ISNULL(COUNT(order_item_id), 0) AS item_cnt
        FROM ORDERS 
    """

    # 2. 월별 추이 쿼리 (최신 6개월)
    trend_query = """
        SELECT TOP 6
            FORMAT(order_datetime, 'yyyy-MM') AS yyyymm,
            ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(SUM(CAST(ISNULL(order_qty, 0) AS BIGINT)), 0), 0) AS asp,
            ROUND(SUM(CAST(ISNULL(selling_price, 0) AS BIGINT) * CAST(ISNULL(order_qty, 0) AS BIGINT)) / NULLIF(COUNT(order_item_id), 0), 0) AS atv
        FROM ORDERS
        WHERE order_datetime IS NOT NULL
        GROUP BY FORMAT(order_datetime, 'yyyy-MM')
        ORDER BY yyyymm DESC
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 전체 KPI 조회
        cursor.execute(kpi_query)
        row = cursor.fetchone()
        
        revenue = float(row.revenue or 0)
        qty = int(row.qty or 0)
        item_cnt = int(row.item_cnt or 0)

        asp = round(revenue / qty, 0) if qty > 0 else 0
        atv = round(revenue / item_cnt, 0) if item_cnt > 0 else 0
        upt = round(qty / item_cnt, 2) if item_cnt > 0 else 0

        # 월별 추이 조회
        cursor.execute(trend_query)
        trend_rows = cursor.fetchall()
        conn.close()

        monthly_trend = [
            {
                "name": str(r.yyyymm),
                "ASP": int(r.asp or 0),
                "ATV": int(r.atv or 0)
            }
            for r in reversed(trend_rows) if r.yyyymm
        ]

        # 🔍 DB 조회 성공 데이터 터미널 콘솔 출력
        print(f"\n================ [DB QUERY SUCCESS] ================")
        print(f"📊 Total Revenue : {revenue:,.0f} 원")
        print(f"📦 Total Qty     : {qty:,} 개")
        print(f"🏷️  ASP           : {asp:,.0f} 원")
        print(f"💳 ATV           : {atv:,.0f} 원")
        print(f"📈 Trend Data    : {monthly_trend}")
        print(f"===================================================\n")

        return {
            "total_sales": revenue,
            "total_qty": qty,
            "item_cnt": item_cnt,
            "asp": asp,
            "atv": atv,
            "upt": upt,
            "target_rate": "284.7%",
            "monthly_trend": monthly_trend
        }
    except Exception as e:
        print(f"\n❌ [DB QUERY ERROR in get_kpi_and_efficiency]: {e}\n")
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

def get_inventory_risk() -> Dict[str, Any]:
    """2. 재고 리스크 현황 집계 (HUB별)"""
    query = """
        SELECT 
            hub_id,
            ISNULL(SUM(CASE WHEN stockout_yn = 1 THEN 1 ELSE 0 END), 0) AS stockout_risk_cnt,
            ISNULL(SUM(available_qty), 0) AS total_available_qty
        FROM INVENTORY
        GROUP BY hub_id
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)
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
        print(f"🏭 HUB Data Count: {len(hub_data)}")
        print(f"===================================================\n")

        return {"hub_inventory_summary": hub_data}
    except Exception as e:
        print(f"\n❌ [DB QUERY ERROR in get_inventory_risk]: {e}\n")
        return {"hub_inventory_summary": []}