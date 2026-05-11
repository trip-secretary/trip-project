from fastapi import FastAPI

app = FastAPI()

from pydantic import BaseModel
from typing import List

@app.get("/")
@app.get("/hello")

class TripRequest(BaseModel):
    region: str
    days: int
    budget: int
    preferences: List[str]
    transport: str

places = [
    {"name": "해운대", "region":"부산", "category":"자연","type":"outdoor","cost":0},
    {"name":"감천문화마을","region":"부산","category":"관광","type":"outdoor","cost":0},
    {"name":"부산박물관","region":"부산","category":"문화","type":"indoor","cost":5000},
    {"name":"카페거리","region":"부산","category":"카페","type":"indoor","cost":15000}
]

@app.post("/generate-trip")
def generate_trip(request: TripRequest):

    filtered = [
        place for place in places
        if place["region"] == request.region
        and place["category"] in request.preferences
    ]

    plan_a = [p for p in filtered if p["type"] == "outdoor"]
    plan_b = [p for p in filtered if p["type"] == "indoor"]

    itinerary = {
        "Plan_A":plan_a[:request.days],
        "Plan_B":plan_b[:request.days]
    }

    return itinerary