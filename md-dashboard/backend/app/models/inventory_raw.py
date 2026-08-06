# dbo.INVENTORY (원본, 대문자) — 스냅샷 기반 실제 재고 데이터

from sqlalchemy import Column, String, Integer, Date, Boolean
from app.core.database import Base

class InventoryRaw(Base):
    __tablename__ = "INVENTORY"
    __table_args__ = {"schema": "dbo"}

    snapshot_date = Column(Date, primary_key=True)
    sku_id = Column(String(50), primary_key=True)
    hub_id = Column(String(50), primary_key=True)
    hub_name = Column(String(50))
    on_hand_qty = Column(Integer)
    available_qty = Column(Integer)
    reserved_qty = Column(Integer)
    in_transit_qty = Column(Integer)
    stockout_yn = Column(Boolean)