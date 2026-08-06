# 26.08.04 백엔드 구축 기온 변화 기반 카테고리 수요예측 알고리즘

from sqlalchemy.orm import Session

def forecast_demand_by_temp(db: Session):
    """
    Azure DB의 기상 데이터 및 판매 데이터를 연동하는 비즈니스 로직
    """
    # 8월 중순 기온 상승에 따른 수요 예측 더미 계산 로직
    return [
        {"date": "2026-08-05", "temp": 29.5, "short_sleeve_demand": 1200, "outer_demand": 100},
        {"date": "2026-08-06", "temp": 31.2, "short_sleeve_demand": 1500, "outer_demand": 80},
        {"date": "2026-08-07", "temp": 32.0, "short_sleeve_demand": 1800, "outer_demand": 50},
        {"date": "2026-08-08", "temp": 30.5, "short_sleeve_demand": 1400, "outer_demand": 90},
        {"date": "2026-08-09", "temp": 28.0, "short_sleeve_demand": 1100, "outer_demand": 150}
    ]