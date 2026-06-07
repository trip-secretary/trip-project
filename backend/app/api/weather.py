from fastapi import APIRouter
from app.services.weather import get_weather_forecast

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
async def weather(destination: str, date: str):
    """기상청 날씨 단독 조회 (destination: 도시명, date: YYYY-MM-DD)"""
    result = await get_weather_forecast(destination, date)
    return result
