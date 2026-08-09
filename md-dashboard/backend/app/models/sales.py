# 26.08.06 백엔드 azure sql server 연동 테스트 코드 (sales)

from sqlalchemy import Column, Integer, String, Float, DateTime, Unicode
from app.core.database import Base

class Order(Base):
    __tablename__ = "ORDERS"
    __table_args__ = {"schema": "dbo"}

    order_item_id = Column(String(50), primary_key=True, index=True)
    order_datetime = Column(DateTime, nullable=False)
    sku_id = Column(String(50), nullable=True)
    order_qty = Column(Integer, nullable=False)
    selling_price = Column(Float, nullable=False)
    total_sales = Column(Float, nullable=False)
    hub_id = Column(String(50), nullable=True)  # HUB별 재고 탭에서 사용 (소진속도 계산용)
    order_status = Column(Unicode(20), nullable=True)  # 정상/취소/교환/반품 — 순매출 계산 시 정상 주문만 필터링