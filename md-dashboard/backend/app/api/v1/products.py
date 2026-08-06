# 26.08.04 백엔드 구축 상품/재고/PO 발주 관리 API 엔드포인트

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

@router.get("/")
def get_product_list(db: Session = Depends(get_db)):
    """상품 및 재고 목록 조회"""
    return {
        "status": "success",
        "data": [
            {"sku": "TS-2026-01", "name": "오버핏 리넨 셔츠", "category": "셔츠/블라우스", "stock": 120, "status": "적정"},
            {"sku": "TS-2026-02", "name": "쿨링 반팔 티셔츠", "category": "반팔/티셔츠", "stock": 15, "status": "재고부족(리오더필요)"}
        ]
    }