import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.trip import Trip, TripItem
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse, SaveTripRequest
from app.services.gemini import generate_all_plans
from app.services.weather import get_multi_day_forecast
from app.services.kakao_map import enrich_items_with_coordinates
from app.api.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


@router.post("/generate", response_model=ItineraryResponse)
async def generate_itinerary(req: ItineraryRequest):
    """
    A(실외)/B(실내)/C(혼합) 세 가지 플랜 동시 생성.
    로그인 불필요 — 누구나 일정 생성 가능.
    """
    import traceback, logging
    logger = logging.getLogger(__name__)

    # 1) 날씨 조회 (날짜별)
    weather_by_date = await get_multi_day_forecast(req.destination, req.start_date, req.end_date)
    first_weather = next(iter(weather_by_date.values()), {})

    # 2) LLM으로 A/B/C 플랜 단일 호출 생성
    try:
        plans = await generate_all_plans(req, weather_by_date)
    except Exception as e:
        logger.error(f"generate_all_plans 예외: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"일정 생성 오류: {type(e).__name__}: {str(e)[:200]}")

    if not plans:
        raise HTTPException(status_code=500, detail="일정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.")

    # 3) 각 플랜의 항목에 카카오맵 좌표 보강
    for plan in plans:
        for day in plan.days:
            items_dict = [item.model_dump() for item in day.items]
            enriched = await enrich_items_with_coordinates(items_dict, req.destination)
            day.items = [type(day.items[0])(**item) if day.items else item for item in enriched]

    weather_summary = first_weather.get("summary", "날씨 정보 없음")
    return ItineraryResponse(
        destination=req.destination,
        start_date=req.start_date,
        end_date=req.end_date,
        weather_summary=weather_summary,
        weather_by_date={
            date: {
                "sky": w.get("sky", "맑음"),
                "precipitation": w.get("precipitation", "없음"),
                "min_temp": w.get("min_temp"),
                "max_temp": w.get("max_temp"),
                "is_bad_weather": w.get("is_bad_weather", False),
                "emoji": w.get("emoji", "🌤️"),
            }
            for date, w in weather_by_date.items()
        },
        plans=plans,
    )


@router.post("/save")
async def save_trip(
    req: SaveTripRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """선택한 일정(A/B/C 또는 커스텀) 저장"""
    trip = Trip(
        user_id=current_user.id,
        destination=req.destination,
        start_date=req.start_date,
        end_date=req.end_date,
        purposes=",".join(req.purposes),
        plan_type=req.plan_type,
        title=req.title,
        description=req.description,
        estimated_cost=req.estimated_cost,
    )
    db.add(trip)
    db.flush()

    for day in req.days:
        for item in day.items:
            db.add(TripItem(
                trip_id=trip.id,
                day=day.day,
                time=item.time,
                title=item.title,
                category=item.category,
                place_name=item.place_name,
                address=item.address,
                lat=item.lat,
                lng=item.lng,
                duration_minutes=item.duration_minutes,
                estimated_cost=item.estimated_cost,
                notes=item.notes,
                is_indoor=1 if item.is_indoor else 0,
            ))

    db.commit()
    return {"message": "일정이 저장되었습니다.", "trip_id": trip.id}


@router.get("/saved")
def get_saved_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """저장된 여행 목록 조회"""
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "destination": t.destination,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "plan_type": t.plan_type,
            "title": t.title,
            "description": t.description,
            "estimated_cost": t.estimated_cost,
            "purposes": t.purposes.split(","),
            "created_at": t.created_at,
        }
        for t in trips
    ]


@router.get("/saved/{trip_id}")
def get_trip_detail(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """저장된 여행 상세 조회"""
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")

    days_dict: dict[int, list] = {}
    for item in trip.items:
        days_dict.setdefault(item.day, []).append({
            "time": item.time,
            "title": item.title,
            "category": item.category,
            "place_name": item.place_name,
            "address": item.address,
            "lat": item.lat,
            "lng": item.lng,
            "duration_minutes": item.duration_minutes,
            "estimated_cost": item.estimated_cost,
            "notes": item.notes,
            "is_indoor": bool(item.is_indoor),
        })

    return {
        "id": trip.id,
        "destination": trip.destination,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "plan_type": trip.plan_type,
        "title": trip.title,
        "description": trip.description,
        "estimated_cost": trip.estimated_cost,
        "purposes": trip.purposes.split(","),
        "days": [{"day": day, "items": items} for day, items in sorted(days_dict.items())],
    }


@router.delete("/saved/{trip_id}")
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(trip)
    db.commit()
    return {"message": "일정이 삭제되었습니다."}
