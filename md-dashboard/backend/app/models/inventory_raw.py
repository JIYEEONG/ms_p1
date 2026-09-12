# dbo.INVENTORY (원본, 대문자) — 스냅샷 기반 실제 재고 데이터

from sqlalchemy import Column, String, Integer, Date, Boolean, Unicode
from app.core.database import Base
from app.core.config import settings

class InventoryRaw(Base):
    __tablename__ = "df_inventory_clean" if settings.DB_DIALECT.lower() in {"postgres", "postgresql"} else "INVENTORY"
    __table_args__ = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}

    snapshot_date = Column(Date, primary_key=True)
    sku_id = Column(String(50), primary_key=True)
    hub_id = Column(String(50), primary_key=True)
    hub_name = Column(Unicode(50))
    on_hand_qty = Column(Integer)
    available_qty = Column(Integer)
    reserved_qty = Column(Integer)
    in_transit_qty = Column(Integer)
    stockout_yn = Column(Boolean)
