# 26.08.04 백엔드 구축 KPI 카드 및 차트용 API 엔드포인트

# 26.08.05 UI 수정으로 인한 백엔드 코드 수정
# 26.08.06 이슈수정 테스트 코드

# 기존 (ProductInventoryResponse 누락)
# from app.schemas.dashboard import SalesTrendResponse

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, literal_column
from typing import List, Optional

from app.core.database import get_db
from app.models.sales import Order
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.dashboard import SalesTrendResponse, ProductInventoryResponse

router = APIRouter()

@router.get("/sales-trend", response_model=List[SalesTrendResponse])
def get_sales_trend(
    category: Optional[str] = Query("전체"),
    db: Session = Depends(get_db)
):
    """
    Azure DB dbo.ORDERS 테이블 연동: 월별 순매출 조회
    """
    # literal_column을 사용하여 SQL 원문 그대로 바인딩 없이 실행되도록 전달
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