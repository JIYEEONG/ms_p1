# dbo.CLAIMS — 반품/교환 등 클레임 데이터

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.core.database import Base

class Claim(Base):
    __tablename__ = "CLAIMS"
    __table_args__ = {"schema": "dbo"}

    claim_id = Column(Integer, primary_key=True)
    order_item_id = Column(String(20), nullable=False)
    claim_type = Column(String(40))
    claim_datetime = Column(DateTime)
    claim_qty = Column(Integer)
    claim_reason = Column(String(200))
    restockable_yn = Column(Boolean)