from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DutchPayGroup(Base):
    __tablename__ = "dutch_pay_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_name = Column(String(300), nullable=False)
    members = Column(Text, nullable=False)          # JSON 문자열: ["혜인", "친구1", "친구2"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="dutch_pay_groups")
    expenses = relationship("DutchPayExpense", back_populates="group", cascade="all, delete-orphan")


class DutchPayExpense(Base):
    __tablename__ = "dutch_pay_expenses"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("dutch_pay_groups.id"), nullable=False)
    category = Column(String(100), nullable=False)  # "식비", "교통", "숙박", "입장료", "기타"
    description = Column(String(300), nullable=False)
    amount = Column(Integer, nullable=False)
    paid_by = Column(String(100), nullable=False)   # 누가 냈는지
    participants = Column(Text, nullable=False)      # JSON: ["혜인", "친구1"] 누가 나눌지
    receipt_image = Column(Text, nullable=True)      # base64 or 파일 경로
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("DutchPayGroup", back_populates="expenses")
