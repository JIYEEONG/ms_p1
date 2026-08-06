# 26.08.04 백엔드 구축 기상(Weather) 데이터 테이블 모델 
# 기상 조건 및 지역별 날씨 데이터(매출/재고 예측 참고용)를 관리하는 모델

from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Weather(Base):
    """
    지역/일별 날씨 정보 테이블
    """
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, index=True, nullable=False)                    # 날짜
    region = Column(String(50), index=True, nullable=False)            # 지역 (HUB 위치 연동용)
    temperature = Column(Float, nullable=False)                        # 평균 기온
    precipitation = Column(Float, default=0.0)                         # 강수량
    weather_condition = Column(String(50), nullable=False)             # 날씨 상태 (맑음, 비, 눈 등)

    created_at = Column(DateTime(timezone=True), server_default=func.now())