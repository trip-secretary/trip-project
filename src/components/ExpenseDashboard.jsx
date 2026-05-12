import React, { useState } from 'react';

function ExpenseDashboard() {
  // 1. 총 예산 설정
  const budget = 300000; // 30만 원

  // 2. 카테고리별 지출 상태 관리 (초기 데이터)
  const [expenses, setExpenses] = useState([
    { category: '식비', amount: 120000, color: '#FF6B6B' },
    { category: '교통(항공/렌트)', amount: 90000, color: '#4A90E2' },
    { category: '숙박', amount: 50000, color: '#FCC419' },
    { category: '기타', amount: 0, color: '#20C997' },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  // 현재 총 지출 계산
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  // 예산 대비 지출 퍼센트
  const totalPercent = Math.min((totalSpent / budget) * 100, 100);

  // [핵심 함수] 가짜 영수증 이미지 업로드 시 동작 (플로우 C 시뮬레이션)
  const handleReceiptUpload = (e) => {
    if (!e.target.files[0]) return;

    setIsProcessing(true);

    // 1.5초 동안 OCR 분석 및 LLM 분류 과정을 흉내 냅니다.
    setTimeout(() => {
      // 랜덤하게 식비나 기타 비용에 영수증 금액이 추가되도록 설정
      const randomAmount = Math.floor(Math.random() * 5 + 1) * 10000; // 1만 원 ~ 5만 원 무작위
      
      setExpenses((prev) =>
        prev.map((item) =>
          item.category === '식비' 
            ? { ...item, amount: item.amount + randomAmount } 
            : item
        )
      );

      setIsProcessing(false);
      alert(`🎉 [플로우 C 자동 정산 완료]\n영수증에서 식비 항목 ${randomAmount.toLocaleString()}원이 자동으로 추출되어 합산되었습니다!`);
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #eee', marginTop: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>🧾 플로우 C — 영수증 스캔 및 자동 비용 정산</h3>
      <p style={{ color: '#777', fontSize: '14px', margin: '0 0 20px 0' }}>기존 앱의 수동 입력 불편함을 OCR과 LLM 분류로 자동화합니다.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4px', alignItems: 'center' }}>
        
        {/* 왼쪽: 영수증 업로드 구역 */}
        <div style={{ border: '2px dashed #ccc', borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: '#fafafa', marginRight: '20px' }}>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
            {isProcessing ? "⏳ OCR 및 LLM 분류 중..." : "📸 영수증 / 항공권 등록"}
          </p>
          <label style={{
            padding: '10px 15px',
            backgroundColor: isProcessing ? '#ccc' : '#20C997',
            color: '#fff',
            borderRadius: '8px',
            cursor: isProcessing ? 'default' : 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'inline-block'
          }}>
            파일 선택
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleReceiptUpload} 
              disabled={isProcessing} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* 오른쪽: 대시보드 차트 구역 */}
        <div>
          {/* 전체 예산 바 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>총 지출 현황 ({totalSpent.toLocaleString()}원 / {budget.toLocaleString()}원)</span>
              <span style={{ color: totalSpent > budget ? '#FF6B6B' : '#333' }}>
                {((totalSpent / budget) * 100).toFixed(0)}%
              </span>
            </div>
            {/* 전체 진행 바 배경 */}
            <div style={{ width: '100%', height: '16px', backgroundColor: '#eee', borderRadius: '8px', overflow: 'hidden' }}>
              {/* 실제 채워지는 게이지 바 */}
              <div style={{ 
                width: `${totalPercent}%`, 
                height: '100%', 
                backgroundColor: totalSpent > budget ? '#FF6B6B' : '#4A90E2', // 예산 초과 시 빨간색 변환!
                transition: 'width 0.4s ease-out-cubic'
              }} />
            </div>
            {/* 🚨 초과 알림 (이미지 속 '초과 알림' 기능 구현) */}
            {totalSpent > budget && (
              <p style={{ color: '#FF6B6B', fontSize: '12px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                ⚠️ 경고: 설정한 여행 예산을 초과했습니다! 지출을 관리해 주세요.
              </p>
            )}
          </div>

          {/* 카테고리별 상세 바 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expenses.map((item, index) => {
              const itemPercent = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ width: '120px', fontWeight: '500' }}>{item.category}</span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', margin: '0 15px', overflow: 'hidden' }}>
                    <div style={{ width: `${itemPercent}%`, height: '100%', backgroundColor: item.color, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ width: '90px', textAlign: 'right', color: '#555' }}>{item.amount.toLocaleString()}원</span>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}

export default ExpenseDashboard;