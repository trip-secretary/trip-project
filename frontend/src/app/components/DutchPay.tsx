import { useState, useRef } from "react";
import { Camera, Plus, Minus, X, ChevronUp, Check, Loader2, AlertCircle } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  checked: boolean;
}

interface Person {
  id: string;
  name: string;
}

const DEFAULT_PERSONS: Person[] = [
  { id: "1", name: "증김동" },
  { id: "2", name: "김철수" },
  { id: "3", name: "이영희" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function parseReceiptImage(dataUrl: string): Promise<ReceiptItem[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "여기에_발급받은_키_입력") {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const [header, base64Data] = dataUrl.split(",");
  const mimeType = (header.match(/data:([^;]+)/) ?? [])[1] ?? "image/jpeg";

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    `이 영수증 이미지에서 개별 항목명과 금액을 추출해주세요.
JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{"items": [{"name": "항목명", "price": 숫자}]}
규칙:
- 총계/합계/소계/부가세/봉사료 항목은 제외
- 가격은 원화 숫자만 (쉼표, 원 기호 제외)
- 항목이 없으면 {"items": []} 반환`,
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("파싱 실패");

  const parsed: { items: { name: string; price: number }[] } = JSON.parse(jsonMatch[0]);
  return parsed.items.map((item, i) => ({
    id: `${Date.now()}-${i}`,
    name: item.name,
    price: Number(item.price),
    checked: true,
  }));
}

export function DutchPay() {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [persons, setPersons] = useState<Person[]>(DEFAULT_PERSONS);
  const [splitMode, setSplitMode] = useState<"equal" | "item">("item");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = items.reduce((sum, i) => sum + i.price, 0);
  const selectedAmount = items.filter((i) => i.checked).reduce((sum, i) => sum + i.price, 0);
  const perPersonEqual = persons.length > 0 ? Math.ceil(totalAmount / persons.length) : 0;
  const perPersonItem = persons.length > 0 ? Math.ceil(selectedAmount / persons.length) : 0;

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.match(/image\/(jpeg|png)/));
    if (!validFiles.length) return;

    setOcrLoading(true);
    setOcrError(null);

    for (const file of validFiles) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setUploadedImages((prev) => [...prev, dataUrl]);
        const newItems = await parseReceiptImage(dataUrl);
        setItems((prev) => [...prev, ...newItems]);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "GEMINI_API_KEY_MISSING") {
          setOcrError("Gemini API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 입력해주세요.");
        } else {
          setOcrError("영수증 인식에 실패했습니다. 항목을 직접 입력해주세요.");
        }
      }
    }

    setOcrLoading(false);
  };

  const toggleItem = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const addItem = () => {
    const price = parseInt(newItemPrice);
    if (!newItemName.trim() || isNaN(price) || price <= 0) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newItemName.trim(), price, checked: true },
    ]);
    setNewItemName("");
    setNewItemPrice("");
  };

  const removePerson = (id: string) => setPersons((prev) => prev.filter((p) => p.id !== id));

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    setPersons((prev) => [...prev, { id: Date.now().toString(), name: newPersonName.trim() }]);
    setNewPersonName("");
    setAddingPerson(false);
  };

  const handleReset = () => {
    setItems([]);
    setPersons(DEFAULT_PERSONS);
    setSplitMode("item");
    setUploadedImages([]);
    setOcrError(null);
  };

  const amountPerPerson = splitMode === "equal" ? perPersonEqual : perPersonItem;
  const hasUploaded = uploadedImages.length > 0;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">더치페이 계산</h1>

      {/* 영수증 업로드 + 미리보기 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex gap-6">
          {/* 업로드 영역 */}
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer transition-colors min-h-[200px] ${
              hasUploaded ? "w-52 shrink-0" : "flex-1"
            } ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
            />
            {hasUploaded ? (
              <>
                <div className="flex flex-wrap gap-2 justify-center px-3 mb-3">
                  {uploadedImages.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt={`영수증 ${i + 1}`} className="w-16 h-20 object-cover rounded-lg border border-slate-200" />
                      <button
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setUploadedImages((prev) => prev.filter((_, idx) => idx !== i)); }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Plus className="w-3 h-3" />
                  추가 업로드
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 mb-1">영수증 사진 업로드</p>
                <p className="text-sm text-indigo-500 mb-4">클릭 또는 드래그</p>
                <button
                  className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  다시 업로드
                </button>
                <p className="text-xs text-slate-400 mt-3">.jpg, .png (최대 10MB) 포맷입니다.</p>
              </>
            )}
          </div>

          {/* 영수증 미리보기: 업로드한 개수만큼 */}
          {hasUploaded && (
            <div className="flex gap-3 flex-wrap flex-1">
              {uploadedImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 w-40 shrink-0 ${idx > 0 ? "shadow-md" : ""} border-slate-200`}
                >
                  <p className="text-center font-semibold text-slate-800 text-sm mb-2 pb-2 border-b border-slate-100">
                    영수증
                  </p>
                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      <p className="text-xs text-slate-400">인식 중...</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">항목 없음</p>
                      ) : (
                        items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-slate-700">
                            <span>{item.name}</span>
                            <span>{item.price.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                      {items.length > 0 && (
                        <div className="flex justify-between text-xs font-bold border-t border-slate-100 pt-2 mt-1">
                          <span>총계</span>
                          <span>{totalAmount.toLocaleString()}원</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OCR 에러 메시지 */}
        {ocrError && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{ocrError}</p>
          </div>
        )}
      </div>

      {/* 인원 설정 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">인원 설정</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-slate-700 mr-1">인원 수</span>
          <button
            onClick={() => persons.length > 1 && setPersons((p) => p.slice(0, -1))}
            className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-bold text-slate-900 w-5 text-center text-sm">{persons.length}</span>
          <button
            onClick={() => setAddingPerson(true)}
            className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
          >
            <Plus className="w-3 h-3" />
          </button>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          {persons.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-1.5 border border-slate-300 rounded-full px-3 py-1.5 text-sm bg-white"
            >
              <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700">{person.name}</span>
              <button onClick={() => removePerson(person.id)} className="text-slate-400 hover:text-red-400 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {addingPerson ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addPerson(); if (e.key === "Escape") { setAddingPerson(false); setNewPersonName(""); } }}
                className="border border-indigo-400 rounded-full px-3 py-1.5 text-sm w-24 outline-none"
                placeholder="이름"
              />
              <button onClick={addPerson} className="text-indigo-600 text-sm font-medium">확인</button>
              <button onClick={() => { setAddingPerson(false); setNewPersonName(""); }} className="text-slate-400 text-sm">취소</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPerson(true)}
              className="flex items-center gap-1.5 border border-dashed border-slate-300 rounded-full px-3 py-1.5 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              추가
            </button>
          )}
        </div>
      </div>

      {/* 영수증 금액 확인 + 각자 낼 금액: 업로드 후에만 표시 */}
      {hasUploaded && !ocrLoading && (
        <div className="flex gap-6 items-start">
          {/* 영수증 금액 확인 */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-3">영수증 금액 확인</h2>
            <div className="flex gap-3">
              {/* 1/N 균등 분할 */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition-all shrink-0 ${
                  splitMode === "equal" ? "border-indigo-400 bg-indigo-50" : "border-slate-200"
                }`}
                onClick={() => setSplitMode("equal")}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      splitMode === "equal" ? "border-indigo-600" : "border-slate-300"
                    }`}
                  >
                    {splitMode === "equal" && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                  </div>
                  <span className="font-bold text-indigo-600 text-sm">1/N 균등 분할</span>
                </div>
                <div className="text-xs space-y-1 min-w-[100px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">총 지</span>
                    <span className="font-medium text-slate-700">{totalAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">{persons.length}명</span>
                    <span className="font-bold text-slate-800">{perPersonEqual.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 항목별 선택 */}
              <div
                className={`flex-1 border rounded-xl overflow-hidden cursor-pointer transition-all ${
                  splitMode === "item" ? "border-emerald-400" : "border-slate-200"
                }`}
                onClick={() => setSplitMode("item")}
              >
                <div
                  className={`px-3 py-2 flex items-center gap-2 ${
                    splitMode === "item" ? "bg-emerald-50" : "bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-700">총 금액 지정</span>
                  {splitMode === "item" && (
                    <span className="ml-auto flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <Check className="w-3.5 h-3.5" />
                      {selectedAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 text-center">인식된 항목이 없습니다.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-pointer ${
                            item.checked ? "bg-indigo-600" : "border border-slate-300 bg-white"
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                        >
                          {item.checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="flex-1 text-slate-700">{item.name}</span>
                        <span className="text-slate-600">{item.price.toLocaleString()}원</span>
                        <span className="text-slate-400">
                          +1인 {persons.length > 0 ? Math.ceil(item.price / persons.length).toLocaleString() : 0}원
                        </span>
                      </div>
                    ))
                  )}
                  {/* 항목 추가 행 */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      placeholder="항목명"
                      className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                    />
                    <input
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      placeholder="금액"
                      type="number"
                      className="w-16 text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={addItem}
                      className="text-xs text-indigo-600 font-medium px-1.5 py-1 hover:bg-indigo-50 rounded"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 각자 낼 금액 */}
          <div className="w-64 shrink-0">
            <h2 className="text-lg font-bold text-slate-900 mb-3">각자 낼 금액</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
              {persons.map((person) => (
                <div key={person.id} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs text-slate-700 truncate">{person.name}</span>
                  <span className="text-xs font-medium text-slate-800 ml-auto whitespace-nowrap">
                    {amountPerPerson.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors">
                <span>💬</span>
                정산 공유
                <span className="text-xs">›</span>
              </button>
              <button
                onClick={handleReset}
                className="flex-1 border border-slate-300 text-slate-700 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                다시 계산
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR 로딩 중 하단 플레이스홀더 */}
      {hasUploaded && ocrLoading && (
        <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">영수증을 분석하는 중입니다...</span>
        </div>
      )}
    </div>
  );
}
