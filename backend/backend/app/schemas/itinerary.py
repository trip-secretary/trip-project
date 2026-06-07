from pydantic import BaseModel
from typing import List


class ItineraryRequest(BaseModel):
    destination: str
    start_date: str             # "2026-07-01"
    end_date: str               # "2026-07-03"
    purposes: List[str]         # ["관광", "미식"]


class ItineraryItem(BaseModel):
    time: str                   # "09:00"
    title: str
    category: str               # "food" | "activity" | "rest"
    place_name: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    duration_minutes: int | None = None
    estimated_cost: int | None = None
    notes: str | None = None
    is_indoor: bool = False


class DayPlan(BaseModel):
    day: int
    date: str                   # "2026-07-01"
    items: List[ItineraryItem]


class PlanResult(BaseModel):
    plan_type: str              # "A" | "B" | "C"
    title: str
    description: str
    theme: str                  # "실외 중심" | "실내 중심" | "혼합"
    weather_condition: str      # "맑음" | "비/흐림" | "무관"
    estimated_cost: int
    days: List[DayPlan]


class ItineraryResponse(BaseModel):
    destination: str
    start_date: str
    end_date: str
    weather_summary: str
    weather_by_date: dict = {}  # {"2026-07-01": {"sky": "맑음", "emoji": "☀️", ...}}
    plans: List[PlanResult]


class SaveTripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    purposes: List[str]
    plan_type: str              # "A" | "B" | "C" | "custom"
    title: str
    description: str | None = None
    estimated_cost: int | None = None
    days: List[DayPlan]
