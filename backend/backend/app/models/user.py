from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    kakao_id = Column(String(100), unique=True, index=True, nullable=False)
    nickname = Column(String(100), nullable=False)
    profile_image = Column(String(500), nullable=True)
    email = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    dutch_pay_groups = relationship("DutchPayGroup", back_populates="user", cascade="all, delete-orphan")
