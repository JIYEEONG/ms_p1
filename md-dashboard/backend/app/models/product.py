# 26.08.04 백엔드 구축 상품(Products), 
# 상품 마스터 데이터(SKU, 상품명, 카테고리, 시즌, 가격 등)를 관리하는 모델

from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    """
    상품 마스터 테이블
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)   # SKU 코드
    product_name = Column(String(100), nullable=False)                # 상품명
    category = Column(String(50), index=True, nullable=False)           # 카테고리 (상의, 하의 등)
    season = Column(String(20), index=True, nullable=False)             # 시즌 (예: 25FW)
    price = Column(Numeric(10, 2), nullable=False, default=0)           # 판매가

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())