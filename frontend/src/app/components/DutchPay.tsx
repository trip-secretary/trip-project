import { useState, useEffect, useRef } from "react";
import { Receipt, Plus, Trash2, ChevronRight, ArrowRight, Users, Calculator, X, Camera, Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function ocrReceipt(imageBase64: string): Promise<{ store_name: string | null; total_amount: number | null; items: { name: string; price: number }[] }> {
  const res = await fetch(`${BASE_URL}/dutch-pay/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!res.ok) throw new Error("OCR 실패");
  return res.json();
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

interface Group {
  id: string;
  name: string;
  members: string[];
  expenses: Expense[];
  createdAt: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const CATEGORIES = ["식비", "숙박", "교통", "입장료", "쇼핑", "기타"];

function calcSettlements(members: string[], expenses: Expense[]): { balances: Record<string, number>; settlements: Settlement[] } {
  const paid: Record<string, number> = Object.fromEntries(members.map((m) => [m, 0]));
  const shouldPay: Record<string, number> = Object.fromEntries(members.map((m) => [m, 0]));

  for (const exp of expenses) {
    const per = Math.floor(exp.amount / exp.participants.length);
    paid[exp.paidBy] = (paid[exp.paidBy] ?? 0) + exp.amount;
    for (const p of exp.participants) {
      shouldPay[p] = (shouldPay[p] ?? 0) + per;
    }
  }

  const balances: Record<string, number> = {};
  for (const m of members) balances[m] = (paid[m] ?? 0) - (shouldPay[m] ?? 0);

  const creditors = members.filter((m) => balances[m] > 0).map((m) => ({ name: m, amt: balances[m] })).sort((a, b) => b.amt - a.amt);
  const debtors = members.filter((m) => balances[m] < 0).map((m) => ({ name: m, amt: -balances[m] })).sort((a, b) => b.amt - a.amt);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const transfer = Math.min(creditors[i].amt, debtors[j].amt);
    if (transfer > 0) settlements.push({ from: debtors[j].name, to: creditors[i].name, amount: transfer });
    creditors[i].amt -= transfer;
    debtors[j].amt -= transfer;
    if (creditors[i].amt === 0) i++;
    if (debtors[j].amt === 0) j++;
  }

  return { balances, settlements };
}

const STORAGE_KEY = "dutch_pay_groups";

function loadGroups(): Group[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveGroups(groups: Group[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function DutchPay() {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Create group form
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberInput, setNewMemberInput] = useState("");
  const [newMembers, setNewMembers] = useState<string[]>([]);

  // Add expense form
  const [expDesc, setExpDesc] = useState("");
  const [expCategory, setExpCategory] = useState("식비");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expParticipants, setExpParticipants] = useState<string[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrItems, setOcrItems] = useState<{ name: string; price: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveGroups(groups); }, [groups]);

  const selectedGroup = groups.find((g) => g.id === selectedId) ?? null;

  // ── Create Group ──
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || newMembers.length < 2) return;
    const g: Group = { id: Date.now().toString(), name: newGroupName.trim(), members: newMembers, expenses: [], createdAt: new Date().toLocaleDateString("ko-KR") };
    setGroups((prev) => [g, ...prev]);
    setSelectedId(g.id);
    setShowCreate(false);
    setNewGroupName("");
    setNewMembers([]);
  };

  const addMember = () => {
    const name = newMemberInput.trim();
    if (name && !newMembers.includes(name)) setNewMembers((prev) => [...prev, name]);
    setNewMemberInput("");
  };

  // ── Add Expense ──
  const openAddExpense = () => {
    if (!selectedGroup) return;
    setExpDesc("");
    setExpCategory("식비");
    setExpAmount("");
    setExpPaidBy(selectedGroup.members[0] ?? "");
    setExpParticipants([...selectedGroup.members]);
    setOcrItems([]);
    setShowAddExpense(true);
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await ocrReceipt(base64);
      if (result.store_name) setExpDesc(result.store_name);
      if (result.total_amount) setExpAmount(String(result.total_amount));
      if (result.items?.length) setOcrItems(result.items);
    } catch {
      alert("영수증 인식에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddExpense = () => {
    const amount = parseInt(expAmount.replace(/,/g, ""));
    if (!expDesc.trim() || isNaN(amount) || amount <= 0 || !expPaidBy || expParticipants.length === 0) return;
    const expense: Expense = { id: Date.now().toString(), description: expDesc.trim(), category: expCategory, amount, paidBy: expPaidBy, participants: expParticipants };
    setGroups((prev) => prev.map((g) => g.id === selectedId ? { ...g, expenses: [...g.expenses, expense] } : g));
    setShowAddExpense(false);
  };

  const deleteExpense = (expId: string) => {
    setGroups((prev) => prev.map((g) => g.id === selectedId ? { ...g, expenses: g.expenses.filter((e) => e.id !== expId) } : g));
  };

  const deleteGroup = (gid: string) => {
    if (!confirm("이 정산 그룹을 삭제할까요?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== gid));
    if (selectedId === gid) setSelectedId(null);
  };

  // ── GROUP DETAIL VIEW ──
  if (selectedGroup) {
    const { balances, settlements } = calcSettlements(selectedGroup.members, selectedGroup.expenses);
    const totalAmount = selectedGroup.expenses.reduce((s, e) => s + e.amount, 0);

    return (
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors">
          ← 목록으로
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selectedGroup.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{selectedGroup.members.join(", ")} · {selectedGroup.createdAt}</p>
          </div>
          <button onClick={openAddExpense} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            지출 추가
          </button>
        </div>

        {/* 지출 목록 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">지출 내역</h2>
            <span className="text-sm text-slate-500">총 {totalAmount.toLocaleString()}원</span>
          </div>
          {selectedGroup.expenses.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">지출 내역이 없습니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selectedGroup.expenses.map((exp) => (
                <li key={exp.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{exp.category}</span>
                      <span className="font-medium text-slate-800 truncate">{exp.description}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.paidBy} 결제 · {exp.participants.join(", ")} 참여 · 1인 {Math.floor(exp.amount / exp.participants.length).toLocaleString()}원</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">{exp.amount.toLocaleString()}원</span>
                  <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 멤버별 잔액 */}
        {selectedGroup.expenses.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">멤버별 현황</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {selectedGroup.members.map((m) => {
                  const bal = balances[m] ?? 0;
                  return (
                    <li key={m} className="flex items-center justify-between px-5 py-3.5">
                      <span className="font-medium text-slate-800">{m}</span>
                      <span className={`font-bold ${bal > 0 ? "text-emerald-600" : bal < 0 ? "text-red-500" : "text-slate-400"}`}>
                        {bal > 0 ? `+${bal.toLocaleString()}원 받을 예정` : bal < 0 ? `${bal.toLocaleString()}원 내야 함` : "정산 완료"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 정산 방법 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-800">정산 방법</h2>
              </div>
              {settlements.length === 0 ? (
                <p className="px-5 py-6 text-center text-slate-400 text-sm">모두 정산이 완료되었습니다 🎉</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {settlements.map((s, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-4">
                      <span className="font-bold text-slate-800">{s.from}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800">{s.to}</span>
                      <span className="ml-auto font-bold text-indigo-600">{s.amount.toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">지출 추가</h3>
                <button onClick={() => setShowAddExpense(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>

              {/* OCR 영수증 스캔 */}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOcrUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {ocrLoading ? <><Loader2 className="w-4 h-4 animate-spin" />영수증 인식 중...</> : <><Camera className="w-4 h-4" />영수증 사진으로 자동 입력</>}
              </button>

              {ocrItems.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-xl text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-indigo-700">인식된 항목 <span className="text-indigo-400 font-normal">(직접 수정 가능)</span></p>
                    <button
                      type="button"
                      onClick={() => {
                        const total = ocrItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
                        if (total > 0) setExpAmount(String(total));
                      }}
                      className="text-xs text-indigo-600 font-medium underline hover:text-indigo-800"
                    >
                      합계 금액에 반영
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {ocrItems.map((item, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <input
                          value={item.name}
                          onChange={(e) => setOcrItems((prev) => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                          className="flex-1 min-w-0 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="품목명"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => setOcrItems((prev) => prev.map((it, idx) => idx === i ? { ...it, price: Number(e.target.value) } : it))}
                          className="w-24 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="가격"
                        />
                        <span className="text-indigo-500 text-xs shrink-0">원</span>
                        <button
                          type="button"
                          onClick={() => setOcrItems((prev) => prev.filter((_, idx) => idx !== i))}
                          className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setOcrItems((prev) => [...prev, { name: "", price: 0 }])}
                    className="mt-2 w-full text-xs text-indigo-500 hover:text-indigo-700 py-1 border border-dashed border-indigo-300 rounded-lg transition-colors"
                  >
                    + 항목 추가
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">내용</label>
                  <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="ex. 저녁 식사" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">카테고리</label>
                    <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">금액 (원)</label>
                    <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">결제한 사람</label>
                  <select value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {selectedGroup.members.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">참여 인원</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.members.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setExpParticipants((prev) => prev.includes(m) ? prev.filter((p) => p !== m) : [...prev, m])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${expParticipants.includes(m) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddExpense(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50">취소</button>
                <button onClick={handleAddExpense} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">추가</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── GROUP LIST VIEW ──
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-12 md:py-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
          <Receipt className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          복잡한 여행 경비, <span className="text-indigo-600">간편하게 정산하세요</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          일행과 함께한 여행의 모든 지출을 기록하고, 버튼 한 번으로 더치페이 금액을 나누세요.
        </p>
      </div>

      {groups.length > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            새 정산 그룹 만들기
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center max-w-2xl mx-auto w-full">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">정산 그룹이 없습니다</h2>
          <p className="text-slate-500 mb-6 text-sm">새 정산 그룹을 만들어 경비를 관리해보세요.</p>
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            새 정산 그룹 만들기
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const total = g.expenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 cursor-pointer" onClick={() => setSelectedId(g.id)}>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{g.name}</h3>
                  <p className="text-sm text-slate-500">{g.members.join(", ")}</p>
                  <p className="text-sm font-medium text-indigo-600 mt-0.5">총 {total.toLocaleString()}원 · {g.expenses.length}건</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">새 정산 그룹 만들기</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">여행 이름</label>
                <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="ex. 제주도 여행" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">멤버 추가 (최소 2명)</label>
                <div className="flex gap-2">
                  <input
                    value={newMemberInput}
                    onChange={(e) => setNewMemberInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMember()}
                    placeholder="이름 입력 후 Enter"
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button onClick={addMember} className="px-3 py-2.5 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">추가</button>
                </div>
                {newMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newMembers.map((m) => (
                      <span key={m} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                        {m}
                        <button onClick={() => setNewMembers((prev) => prev.filter((x) => x !== m))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || newMembers.length < 2} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
