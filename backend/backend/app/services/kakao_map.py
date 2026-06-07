import httpx
from app.core.config import settings

KAKAO_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"


async def search_place(keyword: str, destination: str) -> dict | None:
    """카카오맵 키워드 검색으로 장소 좌표 조회"""
    if not settings.KAKAO_MAP_API_KEY:
        return None

    headers = {"Authorization": f"KakaoAK {settings.KAKAO_MAP_API_KEY}"}
    params = {"query": f"{destination} {keyword}", "size": 1}

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(KAKAO_SEARCH_URL, headers=headers, params=params)
            data = response.json()

        documents = data.get("documents", [])
        if not documents:
            return None

        place = documents[0]
        return {
            "place_name": place.get("place_name"),
            "address": place.get("road_address_name") or place.get("address_name"),
            "lat": float(place.get("y", 0)),
            "lng": float(place.get("x", 0)),
        }
    except Exception:
        return None


async def enrich_items_with_coordinates(items: list, destination: str) -> list:
    """일정 항목에 카카오맵 좌표 추가"""
    enriched = []
    for item in items:
        if item.get("lat") and item.get("lng"):
            enriched.append(item)
            continue

        place_info = await search_place(item.get("place_name", item.get("title", "")), destination)
        if place_info:
            item.update({
                "place_name": place_info["place_name"],
                "address": place_info["address"],
                "lat": place_info["lat"],
                "lng": place_info["lng"],
            })
        enriched.append(item)

    return enriched


def optimize_route(items: list) -> list:
    """
    간단한 Nearest Neighbor 알고리즘으로 동선 최적화.
    좌표가 없는 항목은 순서 유지.
    """
    if len(items) <= 2:
        return items

    coords_items = [i for i in items if i.get("lat") and i.get("lng")]
    no_coords = [i for i in items if not (i.get("lat") and i.get("lng"))]

    if len(coords_items) <= 2:
        return items

    visited = [False] * len(coords_items)
    route = [coords_items[0]]
    visited[0] = True

    for _ in range(len(coords_items) - 1):
        current = route[-1]
        nearest_idx = -1
        nearest_dist = float("inf")

        for j, item in enumerate(coords_items):
            if visited[j]:
                continue
            dist = _haversine(current["lat"], current["lng"], item["lat"], item["lng"])
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = j

        if nearest_idx >= 0:
            route.append(coords_items[nearest_idx])
            visited[nearest_idx] = True

    # 원래 시간 순서 재배정 (시간 정보 유지)
    original_times = [i.get("time", "") for i in items if i.get("lat") and i.get("lng")]
    original_times.sort()
    for i, item in enumerate(route):
        if i < len(original_times):
            item["time"] = original_times[i]

    return route + no_coords


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 좌표 간 거리 계산 (km)"""
    import math
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
