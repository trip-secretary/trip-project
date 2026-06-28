import json
import logging
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.dutch_pay import DutchPayGroup, DutchPayExpense
from app.schemas.dutch_pay import (
    CreateGroupRequest, AddExpenseRequest, DutchPaySummary,
    MemberBalance, SettlementItem, ExpenseResponse,
    OCRRequest, OCRResponse,
)
from app.services.ocr import extract_receipt
from app.api.deps import get_current_user

router = APIRouter(prefix="/dutch-pay", tags=["dutch-pay"])


@router.post("/groups")
def create_group(
    req: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = DutchPayGroup(
        user_id=current_user.id,
        trip_name=req.trip_name,
        members=json.dumps(req.members, ensure_ascii=False),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return {"group_id": group.id, "trip_name": group.trip_name, "members": req.members}


@router.get("/groups")
def get_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = db.query(DutchPayGroup).filter(DutchPayGroup.user_id == current_user.id).all()
    return [
        {
            "group_id": g.id,
            "trip_name": g.trip_name,
            "members": json.loads(g.members),
            "created_at": g.created_at,
        }
        for g in groups
    ]


@router.post("/expenses")
def add_expense(
    req: AddExpenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(DutchPayGroup).filter(
        DutchPayGroup.id == req.group_id,
        DutchPayGroup.user_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다.")

    expense = DutchPayExpense(
        group_id=req.group_id,
        category=req.category,
        description=req.description,
        amount=req.amount,
        paid_by=req.paid_by,
        participants=json.dumps(req.participants, ensure_ascii=False),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    return {
        "expense_id": expense.id,
        "per_person": expense.amount // len(req.participants),
    }


@router.get("/groups/{group_id}/summary", response_model=DutchPaySummary)
def get_summary(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """더치페이 정산 요약 — 누가 얼마 내야 하는지 계산"""
    group = db.query(DutchPayGroup).filter(
        DutchPayGroup.id == group_id,
        DutchPayGroup.user_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다.")

    members = json.loads(group.members)
    expenses = db.query(DutchPayExpense).filter(DutchPayExpense.group_id == group_id).all()

    # 멤버별 낸 금액 / 내야 할 금액 계산
    paid: dict[str, int] = {m: 0 for m in members}
    should_pay: dict[str, int] = {m: 0 for m in members}

    expense_responses = []
    total_amount = 0

    for exp in expenses:
        participants = json.loads(exp.participants)
        per_person = exp.amount // len(participants)
        total_amount += exp.amount

        paid[exp.paid_by] = paid.get(exp.paid_by, 0) + exp.amount
        for p in participants:
            should_pay[p] = should_pay.get(p, 0) + per_person

        expense_responses.append(ExpenseResponse(
            id=exp.id,
            category=exp.category,
            description=exp.description,
            amount=exp.amount,
            paid_by=exp.paid_by,
            participants=participants,
            per_person=per_person,
        ))

    balances = [
        MemberBalance(
            member=m,
            total_paid=paid.get(m, 0),
            total_should_pay=should_pay.get(m, 0),
            balance=paid.get(m, 0) - should_pay.get(m, 0),
        )
        for m in members
    ]

    settlements = _calculate_settlements(balances)

    return DutchPaySummary(
        group_id=group.id,
        trip_name=group.trip_name,
        members=members,
        total_amount=total_amount,
        expenses=expense_responses,
        balances=balances,
        settlements=settlements,
    )


def _calculate_settlements(balances: list[MemberBalance]) -> list[SettlementItem]:
    """최소 거래 횟수로 정산 계산"""
    creditors = sorted([(b.balance, b.member) for b in balances if b.balance > 0], reverse=True)
    debtors = sorted([(-b.balance, b.member) for b in balances if b.balance < 0], reverse=True)

    settlements = []
    i, j = 0, 0

    while i < len(creditors) and j < len(debtors):
        credit_amt, creditor = creditors[i]
        debt_amt, debtor = debtors[j]

        transfer = min(credit_amt, debt_amt)
        if transfer > 0:
            settlements.append(SettlementItem(from_member=debtor, to_member=creditor, amount=transfer))

        creditors[i] = (credit_amt - transfer, creditor)
        debtors[j] = (debt_amt - transfer, debtor)

        if creditors[i][0] == 0:
            i += 1
        if debtors[j][0] == 0:
            j += 1

    return settlements


@router.post("/ocr", response_model=OCRResponse)
async def ocr_receipt(req: OCRRequest):
    """영수증 이미지(base64) → Gemini Vision으로 금액/항목 추출 (로그인 불필요)"""
    try:
        result = await extract_receipt(req.image_base64)
        return result
    except Exception as e:
        logger.exception("OCR 처리 실패")
        raise HTTPException(status_code=500, detail=f"OCR 처리 실패: {str(e)}")
