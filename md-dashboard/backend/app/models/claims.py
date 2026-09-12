# dbo.CLAIMS — 반품/교환 등 클레임 데이터

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.core.database import Base
from app.core.config import settings

class Claim(Base):
    __tablename__ = "df_claims_clean" if settings.DB_DIALECT.lower() in {"postgres", "postgresql"} else "CLAIMS"
    __table_args__ = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}

    claim_id = Column(Integer, primary_key=True) if settings.DB_DIALECT.lower() not in {"postgres", "postgresql"} else None
    order_item_id = Column(String(20), primary_key=settings.DB_DIALECT.lower() in {"postgres", "postgresql"}, nullable=False)
    claim_type = Column(String(40), primary_key=settings.DB_DIALECT.lower() in {"postgres", "postgresql"})
    claim_datetime = Column(DateTime, primary_key=settings.DB_DIALECT.lower() in {"postgres", "postgresql"})
    claim_qty = Column(Integer)
    claim_reason = Column(String(200))
    restockable_yn = Column(Boolean)
