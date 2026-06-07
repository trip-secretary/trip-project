import json
import re
import logging
import asyncio
import hashlib
import google.generativeai as genai
from datetime import datetime, timedelta
from app.core.config import settings
from app.schemas.itinerary import ItineraryRequest, PlanResult, DayPlan, ItineraryItem

genai.configure(api_key=settings.GEMINI_API_KEY)
logger = logging.getLogger(__name__)

# 인메모리 캐시 (서버 재시작 전까지 유지)
_plan_cache: dict[str, list[PlanResult]] = {}


def _cache_key(req: ItineraryRequest) -> str:
    raw = f"{req.destination}|{req.start_date}|{req.end_date}|{'_'.join(sorted(req.purposes))}"
    return hashlib.md5(raw.encode()).hexdigest()


def _get_date_range(start_date: str, end_date: str) -> list[str]:
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    days = (end - start).days + 1
    return [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(min(days, 7))]


def _build_combined_prompt(req: ItineraryRequest, weather_by_date: dict) -> str:
    dates = _get_date_range(req.start_date, req.end_date)
    days_count = len(dates)
    purposes_str = ", ".join(req.purposes)

    # 날짜별 날씨 요약
    weather_lines = []
    for d in dates:
        w = weather_by_date.get(d, {})
        sky = w.get("sky", "맑음")
        precip = w.get("precipitation", "없음")
        tmin = w.get("min_temp")
        tmax = w.get("max_temp")
        temp_str = f" ({tmin}°C~{tmax}°C)" if tmin is not None and tmax is not None else ""
        weather_lines.append(f"  - {d}: {sky}, 강수={precip}{temp_str}")
    weather_str = "\n".join(weather_lines) if weather_lines else "  - 정보 없음"

    # days 구조 예시 (첫째날만)
    days_example = "\n      ".join(
        f'{{ "day": {i+1}, "date": "{d}" }}' for i, d in enumerate(dates)
    )

    return f"""당신은 한국 여행 전문 AI 플래너입니다.
아래 조건으로 Plan A, B, C 세 가지 일정을 JSON 하나로 생성해주세요.

## 여행 조건
- 여행지: {req.destination}
- 기간: {req.start_date} ~ {req.end_date} ({days_count}일)
- 여행 목적: {purposes_str}
- 날짜별 날씨:
{weather_str}

## 플랜 타입
- Plan A: 실외 활동 중심 (공원, 야외 명소, 해변, 거리 투어 등 실외 장소 위주)
- Plan B: 실내 활동 중심 (박물관, 실내 카페, 쇼핑몰, 실내 체험 등 실내 장소 위주)
- Plan C: 실내+실외 균형 혼합 (다양한 장소 조화롭게 구성)

## 필수 규칙
1. 하루 4~6개 일정 항목
2. 실제 존재하는 {req.destination} 장소명 사용
3. 위도/경도는 실제 좌표
4. 이동 동선이 효율적이도록 인접 장소 묶기
5. 시간은 09:00~21:00
6. **같은 장소를 여러 날짜에 중복 방문 절대 금지** (1일차와 2일차에 동일 장소 불가)
7. Plan A, B, C 각각 서로 다른 장소 위주로 구성
8. JSON 외 다른 텍스트 절대 출력 금지

## 출력 JSON 형식
{{
  "plans": [
    {{
      "plan_type": "A",
      "title": "플랜 제목 (20자 이내, 이모지 포함)",
      "description": "소개 (50자 이내)",
      "theme": "실외 중심",
      "weather_condition": "맑음",
      "estimated_cost": 총예상비용(원, 숫자만),
      "days": [
        {{
          "day": 1,
          "date": "{dates[0]}",
          "items": [
            {{
              "time": "09:00",
              "title": "활동명",
              "category": "food 또는 activity 또는 rest",
              "place_name": "실제 장소명",
              "address": "주소",
              "lat": 위도(숫자),
              "lng": 경도(숫자),
              "duration_minutes": 소요시간(숫자),
              "estimated_cost": 비용(원, 숫자),
              "notes": "간단한 팁",
              "is_indoor": false
            }}
          ]
        }}
      ]
    }},
    {{
      "plan_type": "B",
      "title": "...",
      "description": "...",
      "theme": "실내 중심",
      "weather_condition": "비/흐림",
      "estimated_cost": 0,
      "days": [ ... {days_count}일치 ... ]
    }},
    {{
      "plan_type": "C",
      "title": "...",
      "description": "...",
      "theme": "실내+실외 혼합",
      "weather_condition": "무관",
      "estimated_cost": 0,
      "days": [ ... {days_count}일치 ... ]
    }}
  ]
}}
"""


def _extract_json(raw: str) -> dict:
    """응답에서 첫 번째 완전한 JSON 오브젝트 추출"""
    # response_mime_type=json 이면 바로 파싱
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # 중괄호 카운팅으로 첫 번째 완전한 {} 블록 추출
    start = raw.find("{")
    if start == -1:
        raise ValueError("응답에서 JSON을 찾을 수 없습니다")
    depth = 0
    for i, ch in enumerate(raw[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(raw[start : i + 1])
    raise ValueError("JSON 블록이 불완전합니다")


def _parse_plan(plan_data: dict) -> PlanResult:
    days = []
    for d in plan_data.get("days", []):
        items = [ItineraryItem(**item) for item in d.get("items", [])]
        days.append(DayPlan(day=d["day"], date=d["date"], items=items))
    return PlanResult(
        plan_type=plan_data["plan_type"],
        title=plan_data["title"],
        description=plan_data["description"],
        theme=plan_data["theme"],
        weather_condition=plan_data["weather_condition"],
        estimated_cost=plan_data.get("estimated_cost", 0),
        days=days,
    )


async def generate_all_plans(req: ItineraryRequest, weather_by_date: dict) -> list[PlanResult]:
    """A, B, C 플랜을 단일 API 호출로 생성 (캐시 + 429 자동 재시도)"""
    # 캐시 확인
    key = _cache_key(req)
    if key in _plan_cache:
        logger.info(f"캐시 히트: {req.destination} {req.start_date}~{req.end_date}")
        return _plan_cache[key]

    prompt = _build_combined_prompt(req, weather_by_date)

    # 모델 우선순위 목록 — 할당량 초과 시 다음 모델로 폴백
    MODEL_FALLBACKS = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
    ]

    last_error = None
    for model_name in MODEL_FALLBACKS:
        try:
            logger.info(f"모델 시도: {model_name}")
            m = genai.GenerativeModel(model_name)
            response = m.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                ),
            )
            raw = response.text.strip()
            data = _extract_json(raw)

            plans = []
            for plan_data in data.get("plans", []):
                try:
                    plans.append(_parse_plan(plan_data))
                except Exception as e:
                    logger.error(f"Plan {plan_data.get('plan_type', '?')} 파싱 실패: {e}")

            if plans:
                _plan_cache[key] = plans
                if len(_plan_cache) > 20:
                    oldest = next(iter(_plan_cache))
                    del _plan_cache[oldest]
                logger.info(f"성공 — 모델: {model_name}, 플랜 수: {len(plans)}")

            return plans

        except Exception as e:
            last_error = e
            if "429" in str(e) or "quota" in str(e).lower():
                logger.warning(f"{model_name} 할당량 초과 — 다음 모델 시도")
                continue
            raise  # 429/quota 외 오류는 바로 raise

    raise Exception(
        "모든 모델의 API 할당량이 초과되었습니다. "
        "Google AI Studio(aistudio.google.com)에서 사용량을 확인하거나 "
        "한국시간 오전 9시(UTC 00:00) 이후 다시 시도해주세요."
    )
