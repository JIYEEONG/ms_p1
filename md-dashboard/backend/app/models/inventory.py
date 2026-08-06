# 26.08.04 백엔드 구축 재고(Stock) 
# 테이블 모델 HUB(물류센터)별 재고 상태, 안전재고, WOS, 위험 상태 등을 관리하는 모델

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Inventory(Base):
    """
    HUB 및 상품별 재고 현황 테이블
    """
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), ForeignKey("products.sku"), index=True, nullable=False) # Product 외래키
    hub_name = Column(String(50), index=True, nullable=False)          # HUB 이름 (서울, 경기 등)
    
    current_stock = Column(Integer, default=0)                         # 현재 가용 재고
    safety_stock = Column(Integer, default=0)                          # 안전 재고
    wos = Column(Float, default=0.0)                                   # 재고 주수 (Weeks of Supply)
    sell_through_rate = Column(Float, default=0.0)                     # 판매율 (%)
    claim_rate = Column(Float, default=0.0)                            # 클레임율 (%)
    inbound_plan = Column(Integer, default=0)                          # 입고 예정 수량
    risk_status = Column(String(20), index=True, default="정상")        # 위험 상태 (품절임박, 과잉재고 등)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())