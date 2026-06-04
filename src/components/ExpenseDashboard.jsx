import { useMemo, useState } from 'react';

const BASE_EXPENSES = [
  { category: '식비', amount: 82000, color: '#f97316' },
  { category: '교통', amount: 64000, color: '#2563eb' },
  { category: '입장권', amount: 36000, color: '#7c3aed' },
  { category: '카페/간식', amount: 42000, color: '#0f766e' },
];

const RECEIPT_SAMPLES = [
  { category: '식비', store: '동문시장 고기국수', amount: 18000 },
  { category: '카페/간식', store: '애월 오션뷰 카페', amount: 14500 },
  { category: '교통', store: '주차 및 주유', amount: 22000 },
];

function ExpenseDashboard({ scenarioKey }) {
  const budget = scenarioKey === 'budget' ? 240000 : 300000;
  const [expenses, setExpenses] = useState(BASE_EXPENSES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisLog, setAnalysisLog] = useState('영수증이나 교통비 이미지를 올리면 카테고리를 자동 분류합니다.');

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalPercent = Math.min((totalSpent / budget) * 100, 100);
  const remain = budget - totalSpent;

  const riskMessage = useMemo(() => {
    if (remain < 0) return '예산을 초과했습니다. AI가 무료 코스와 시장 중심 일정으로 재계획할 수 있어요.';
    if (remain < budget * 0.15) return '남은 예산이 적습니다. 다음 식사나 이동 수단을 조정하는 것이 좋습니다.';
    return '현재 예산 흐름은 안정적입니다.';
  }, [budget, remain]);

  const handleReceiptUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setAnalysisLog('OCR로 가게명과 금액을 읽고, LLM이 지출 카테고리를 분류하는 중입니다...');

    const sample = RECEIPT_SAMPLES[Math.floor(Math.random() * RECEIPT_SAMPLES.length)];

    setTimeout(() => {
      setExpenses((prev) =>
        prev.map((item) =>
          item.category === sample.category ? { ...item, amount: item.amount + sample.amount } : item,
        ),
      );
      setAnalysisLog(
        `${sample.store} 영수증에서 ${sample.amount.toLocaleString()}원을 감지해 '${sample.category}'로 분류했습니다.`,
      );
      setIsProcessing(false);
      event.target.value = '';
    }, 900);
  };

  return (
    <section className="expense-panel">
      <div className="section-heading">
        <span>예산 관리</span>
        <h2>영수증 기반 자동 정산</h2>
        <p>수동 입력 대신 OCR과 LLM 분류 흐름을 데모로 보여주고, 예산 위험도를 즉시 알려줍니다.</p>
      </div>

      <div className="expense-grid">
        <div className="receipt-box">
          <strong>{isProcessing ? '분석 중...' : '영수증 업로드'}</strong>
          <p>{analysisLog}</p>
          <label className={isProcessing ? 'disabled' : ''}>
            파일 선택
            <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={isProcessing} />
          </label>
        </div>

        <div className="budget-box">
          <div className="budget-header">
            <span>총 지출</span>
            <strong>
              {totalSpent.toLocaleString()}원 / {budget.toLocaleString()}원
            </strong>
          </div>
          <div className="progress-track">
            <div
              className={remain < 0 ? 'danger' : ''}
              style={{ width: `${totalPercent}%` }}
            />
          </div>
          <p className={remain < 0 ? 'risk danger' : 'risk'}>{riskMessage}</p>

          <div className="expense-list">
            {expenses.map((item) => {
              const itemPercent = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              return (
                <div className="expense-row" key={item.category}>
                  <span>{item.category}</span>
                  <div>
                    <i style={{ width: `${itemPercent}%`, backgroundColor: item.color }} />
                  </div>
                  <strong>{item.amount.toLocaleString()}원</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExpenseDashboard;
