from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import auth, itinerary, dutch_pay, weather

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TwoWayTrip API",
    description="AI 기반 여행 일정 추천 서비스",
    version="1.0.0",
)

# CORS — 로컬 개발 + Vercel 배포 URL 허용
import os

_raw = os.getenv("ALLOWED_ORIGINS", "")
_extra = [o.strip() for o in _raw.split(",") if o.strip()]
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
] + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(itinerary.router, prefix="/api")
app.include_router(dutch_pay.router, prefix="/api")
app.include_router(weather.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "TwoWayTrip API 서버 정상 작동 중"}


@app.get("/health")
def health():
    return {"status": "ok"}
