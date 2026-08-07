# 26.08.06 백엔드 azure sql server 연동 테스트 코드 (sales)

from sqlalchemy import Column, Integer, String, Float, DateTime
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