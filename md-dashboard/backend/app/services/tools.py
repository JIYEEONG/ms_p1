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

def get_kpi_and_efficiency(start_date: str = "2026-08-01 00:00:00", end_date: str = "2026-08-07 23:59:59") -> Dict[str, Any]:
    """1. 실적 및 판매효율 지표 (ASP, ATV, UPT) 산출"""
    # NOTE: ORDERS에 order_id가 없어 order_item_id 건수로 근사 처리
    query = """
        SELECT 
            SUM(selling_price * order_qty) AS revenue,
            SUM(order_qty) AS qty,
            COUNT(order_item_id) AS item_cnt
        FROM ORDERS 
        WHERE order_status = '정상'
          AND order_datetime >= ? AND order_datetime <= ?
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, (start_date, end_date))
    row = cursor.fetchone()
    conn.close()

    revenue = float(row.revenue or 0)
    qty = int(row.qty or 0)
    item_cnt = int(row.item_cnt or 0)

    asp = round(revenue / qty, 0) if qty > 0 else 0
    atv = round(revenue / item_cnt, 0) if item_cnt > 0 else 0
    upt = round(qty / item_cnt, 2) if item_cnt > 0 else 0

    return {
        "revenue": revenue,
        "qty": qty,
        "item_cnt": item_cnt,
        "asp": asp,
        "atv": atv,
        "upt": upt,
        "note": "ATV/UPT는 장바구니 단위(order_id) 데이터 부재로 order_item_id 단위 근사치입니다."
    }

def get_inventory_risk() -> Dict[str, Any]:
    """2. 재고 리스크 현황 집계 (HUB별)"""
    query = """
        SELECT 
            hub_id,
            SUM(CASE WHEN stockout_yn = 1 THEN 1 ELSE 0 END) AS stockout_risk_cnt,
            SUM(available_qty) AS total_available_qty
        FROM INVENTORY
        GROUP BY hub_id
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    return {"hub_risk_summary": [{"hub_id": r.hub_id, "stockout_risk": r.stockout_risk_cnt} for r in rows]}