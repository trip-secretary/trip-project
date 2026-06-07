from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destination = Column(String(200), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    purposes = Column(String(500), nullable=False)   # 콤마 구분: "관광,미식"
    plan_type = Column(String(10), nullable=False)   # "A", "B", "C", "custom"
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    estimated_cost = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trips")
    items = relationship("TripItem", back_populates="trip", cascade="all, delete-orphan", order_by="TripItem.day, TripItem.time")


class TripItem(Base):
    __tablename__ = "trip_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day = Column(Integer, nullable=False)
    time = Column(String(10), nullable=False)       # "09:00"
    title = Column(String(300), nullable=False)
    category = Column(String(50), nullable=True)    # "food", "activity", "rest"
    place_name = Column(String(300), nullable=True)
    address = Column(String(500), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    estimated_cost = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    is_indoor = Column(Integer, default=0)          # 0: 실외, 1: 실내

    trip = relationship("Trip", back_populates="items")
