# PURCHASE_ORDERS 테이블 모델 — SKU별 발주 이력 (리드타임, MOQ 계산용)

from sqlalchemy import Column, String, Integer, Date, Numeric
from app.core.database import Base
from app.core.config import settings

class PurchaseOrder(Base):
    __tablename__ = "df_purchase_orders_clean" if settings.DB_DIALECT.lower() in {"postgres", "postgresql"} else "PURCHASE_ORDERS"
    __table_args__ = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}

    purchase_order_id = Column(String(50), primary_key=True, index=True)
    sku_id = Column(String(50), index=True, nullable=False)
    hub_id = Column(String(50))
    hub_name = Column(String(50))
    order_date = Column(Date)
    ordered_qty = Column(Integer)
    expected_arrival_date = Column(Date)
    actual_arrival_date = Column(Date)
    received_qty = Column(Integer)
    moq = Column(Integer)
    order_unit = Column(String(20))
    unit_cost = Column(Numeric(10, 2))
    lead_time = Column(Integer)
