#26.08.04 백엔드 구축 기상 데이터 & 기온 차트 API 엔드포인트

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.forecasting import forecast_demand_by_temp

router = APIRouter()

@router.get("/forecast")
def get_weather_and_demand_forecast(db: Session = Depends(get_db)):
    """기온 예측 및 카테고리별 수요 예측 데이터 반환"""
    forecast_result = forecast_demand_by_temp(db)
    return {
        "status": "success",
        "data": forecast_result
    }