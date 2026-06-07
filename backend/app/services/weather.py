import httpx
from datetime import datetime, timedelta
from app.core.config import settings

# 기상청 단기예보 API (초단기예보 + 단기예보)
KMA_FORECAST_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

# 주요 도시 기상청 격자 좌표 (nx, ny)
CITY_GRID = {
    "서울": (60, 127), "부산": (98, 76), "대구": (89, 90),
    "인천": (55, 124), "광주": (58, 74), "대전": (67, 100),
    "울산": (102, 84), "세종": (66, 103), "수원": (60, 121),
    "제주": (52, 38),  "강릉": (92, 131), "전주": (63, 89),
    "청주": (69, 107), "창원": (90, 77),  "포항": (102, 94),
    "천안": (63, 110), "경주": (100, 91), "여수": (73, 66),
}

DEFAULT_GRID = (60, 127)  # 서울 기본값


def get_city_grid(destination: str) -> tuple[int, int]:
    for city, grid in CITY_GRID.items():
        if city in destination:
            return grid
    return DEFAULT_GRID


async def get_weather_forecast(destination: str, start_date: str) -> dict:
    """
    기상청 단기예보로 여행 시작일 날씨 조회.
    API 키 없거나 실패 시 기본값 반환.
    """
    if not settings.KMA_API_KEY:
        return _default_weather()

    nx, ny = get_city_grid(destination)
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    # 기상청은 최대 3일치 제공 — 오늘 기준 3일 이후면 기본값 사용
    today = datetime.now()
    if (base_date - today).days > 3:
        return _default_weather()

    base_date_str = base_date.strftime("%Y%m%d")

    params = {
        "serviceKey": settings.KMA_API_KEY,
        "pageNo": 1,
        "numOfRows": 100,
        "dataType": "JSON",
        "base_date": base_date_str,
        "base_time": "0500",
        "nx": nx,
        "ny": ny,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(KMA_FORECAST_URL, params=params)
            data = response.json()

        items = data["response"]["body"]["items"]["item"]
        return _parse_forecast(items, base_date_str)
    except Exception:
        return _default_weather()


def _latest_base_time() -> str:
    """현재 시각 기준 가장 최근 기상청 발표 시각 반환 (0200~2300)"""
    hour = datetime.now().hour
    base_times = [2, 5, 8, 11, 14, 17, 20, 23]
    bt = max((t for t in base_times if t <= hour), default=23)
    return f"{bt:02d}00"


def _parse_forecast(items: list, target_date: str) -> dict:
    """target_date(YYYYMMDD) 당일 낮 시간대(06~21시) 기준 가장 나쁜 날씨 반환"""
    sky_map = {"1": "맑음", "3": "구름많음", "4": "흐림"}
    pty_map = {"0": "없음", "1": "비", "2": "비/눈", "3": "눈", "4": "소나기"}

    # 낮 시간대 SKY/PTY 수집
    sky_codes: list[str] = []
    pty_codes: list[str] = []
    min_temp = None
    max_temp = None

    for item in items:
        if item.get("fcstDate") != target_date:
            continue
        category = item.get("category")
        value = item.get("fcstValue")
        fcst_time = item.get("fcstTime", "0000")
        if category == "SKY" and "0600" <= fcst_time <= "2100":
            sky_codes.append(value)
        elif category == "PTY" and "0600" <= fcst_time <= "2100":
            pty_codes.append(value)
        elif category == "TMN":
            try:
                min_temp = float(value)
            except (ValueError, TypeError):
                pass
        elif category == "TMX":
            try:
                max_temp = float(value)
            except (ValueError, TypeError):
                pass

    # 가장 나쁜 날씨 조건 선택 (비 > 흐림 > 구름 > 맑음)
    sky_priority = {"4": 3, "3": 2, "1": 0}
    pty_priority = {"1": 4, "4": 4, "2": 3, "3": 3, "0": 0}

    sky_code = max(sky_codes, key=lambda x: sky_priority.get(x, 0)) if sky_codes else "1"
    pty_code = max(pty_codes, key=lambda x: pty_priority.get(x, 0)) if pty_codes else "0"

    is_bad_weather = pty_code != "0" or sky_code == "4"

    return {
        "sky": sky_map.get(sky_code, "맑음"),
        "precipitation": pty_map.get(pty_code, "없음"),
        "min_temp": min_temp,
        "max_temp": max_temp,
        "is_bad_weather": is_bad_weather,
        "summary": f"{'비/흐림' if is_bad_weather else sky_map.get(sky_code, '맑음')} 예상",
    }


def _default_weather() -> dict:
    return {
        "sky": "맑음",
        "precipitation": "없음",
        "min_temp": None,
        "max_temp": None,
        "is_bad_weather": False,
        "emoji": "🌤️",
        "summary": "날씨 정보 없음 (A/B/C 전체 제공)",
    }


def _weather_emoji(sky: str, precipitation: str) -> str:
    if precipitation not in ("없음", "0"):
        return "🌧️"
    if sky == "맑음":
        return "☀️"
    if sky == "구름많음":
        return "⛅"
    return "☁️"


async def get_multi_day_forecast(destination: str, start_date: str, end_date: str) -> dict:
    """여행 기간 전체 날짜별 날씨 반환 — {date_str: weather_dict}"""
    from datetime import datetime, timedelta

    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    dates = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range((end - start).days + 1)]

    if not settings.KMA_API_KEY:
        return {d: _default_weather() for d in dates}

    nx, ny = get_city_grid(destination)
    today = datetime.now()

    # 기상청은 현재 기준 최대 ~3일치만 제공
    valid_dates = [d for d in dates if (datetime.strptime(d, "%Y-%m-%d") - today).days <= 3]
    result = {d: _default_weather() for d in dates}

    if not valid_dates:
        return result

    # base_date는 항상 오늘, base_time은 현재 기준 최신 발표 시각
    base_date_str = today.strftime("%Y%m%d")
    base_time = _latest_base_time()
    params = {
        "serviceKey": settings.KMA_API_KEY,
        "pageNo": 1,
        "numOfRows": 1000,
        "dataType": "JSON",
        "base_date": base_date_str,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(KMA_FORECAST_URL, params=params)
            data = res.json()
        items = data["response"]["body"]["items"]["item"]

        for d in valid_dates:
            target = d.replace("-", "")
            parsed = _parse_forecast(items, target)
            parsed["emoji"] = _weather_emoji(parsed["sky"], parsed["precipitation"])
            result[d] = parsed
    except Exception:
        pass

    return result
