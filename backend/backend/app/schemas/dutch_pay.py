from pydantic import BaseModel
from typing import List


class CreateGroupRequest(BaseModel):
    trip_name: str
    members: List[str]


class AddExpenseRequest(BaseModel):
    group_id: int
    category: str               # "식비" | "교통" | "숙박" | "입장료" | "기타"
    description: str
    amount: int
    paid_by: str
    participants: List[str]


class ExpenseResponse(BaseModel):
    id: int
    category: str
    description: str
    amount: int
    paid_by: str
    participants: List[str]
    per_person: int             # amount / len(participants)

    class Config:
        from_attributes = True


class MemberBalance(BaseModel):
    member: str
    total_paid: int             # 본인이 낸 총액
    total_should_pay: int       # 본인이 내야 할 총액
    balance: int                # 양수: 받아야 함, 음수: 더 내야 함


class SettlementItem(BaseModel):
    from_member: str
    to_member: str
    amount: int


class DutchPaySummary(BaseModel):
    group_id: int
    trip_name: str
    members: List[str]
    total_amount: int
    expenses: List[ExpenseResponse]
    balances: List[MemberBalance]
    settlements: List[SettlementItem]


class OCRRequest(BaseModel):
    image_base64: str           # base64 인코딩된 영수증 이미지


class OCRResponse(BaseModel):
    store_name: str | None = None
    total_amount: int | None = None
    items: List[dict] = []      # [{"name": "아메리카노", "price": 4500}]
    raw_text: str | None = None
