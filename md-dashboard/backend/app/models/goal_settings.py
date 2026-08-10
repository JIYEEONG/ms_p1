# dbo.GOAL_SETTINGS — 대시보드 목표 매출 설정 (단일 행, GoalModal에서 사용자가 수정)

from sqlalchemy import Column, Integer, BigInteger, DateTime, func
from app.core.database import Base

class GoalSettings(Base):
    __tablename__ = "GOAL_SETTINGS"
    __table_args__ = {"schema": "dbo"}

    id = Column(Integer, primary_key=True)
    day_amount = Column(BigInteger, nullable=False)
    week_amount = Column(BigInteger, nullable=False)
    month_amount = Column(BigInteger, nullable=False)
    year_amount = Column(BigInteger, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())