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

# CORS — 프론트(localhost:5173) 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
