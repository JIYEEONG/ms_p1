# demand_forecast_results 테이블 모델 — 사전 계산된 SKU/product 단위 수요예측 결과

from sqlalchemy import Column, String, BigInteger, Float, Date
from app.core.database import Base

class DemandForecastResult(Base):
    __tablename__ = "demand_forecast_results"
    __table_args__ = {"schema": "dbo"}

    product_id = Column(String(50), primary_key=True, index=True)
    category_large = Column(String(50))
    category_middle = Column(String(50))
    brand_name = Column(String(50))
    week_start = Column(Date, primary_key=True)   # product_id + week_start가 복합 PK
    actual_qty = Column(BigInteger)
    predicted_qty = Column(Float)