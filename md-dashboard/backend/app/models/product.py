# 26.08.04 백엔드 구축 상품(Products), 
# 상품 마스터 데이터(SKU, 상품명, 카테고리, 시즌, 가격 등)를 관리하는 모델

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, Unicode
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(Unicode(100), nullable=False)
    category = Column(Unicode(50), index=True, nullable=False)
    season = Column(String(20), index=True, nullable=False)
    price = Column(Numeric(10, 2), nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ProductSku(Base):
    __tablename__ = "PRODUCT_SKU"
    __table_args__ = {"schema": "dbo"}

    sku_id = Column(String(50), primary_key=True, index=True)
    product_id = Column(String(50), index=True, nullable=False)
    product_name = Column(Unicode(100), nullable=False)
    brand_name = Column(Unicode(50))
    category_large = Column(Unicode(50), index=True)
    category_middle = Column(Unicode(50), index=True)
    season_type = Column(Unicode(20))
    launch_date = Column(Date)
    product_type = Column(Unicode(50))
    color_name = Column(Unicode(50))
    size_code = Column(String(20))
    supplier_id = Column(String(50))