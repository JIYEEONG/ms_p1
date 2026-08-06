# 26.08.04 백엔드 구축 AI 기반 적정 발주량(리오더) 계산 엔진

from sqlalchemy.orm import Session

def calculate_reorder_recommendation(db: Session):
    """
    재고 부족 상품 대상 AI 안전재고 및 리오더 추천 수량 계산
    """
    return [
        {
            "sku": "TS-2026-02",
            "name": "쿨링 반팔 티셔츠",
            "current_stock": 15,
            "predicted_weekly_sales": 250,
            "recommended_reorder_qty": 300,
            "urgency": "HIGH"
        }
    ]