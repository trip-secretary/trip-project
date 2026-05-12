import React from 'react';
import TravelMap from './components/TravelMap'; 
import ChatWindow from './components/ChatWindow'; 
import ExpenseDashboard from './components/ExpenseDashboard'; // 📌 [추가] 대시보드 불러오기

function App() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif', padding: '0 20px 40px 20px' }}>
      
      {/* 상단 헤더 */}
      <header style={{ padding: '25px 0', borderBottom: '1px solid #eee', marginBottom: '25px' }}>
        <h1 style={{ color: '#4A90E2', margin: '0 0 8px 0', fontSize: '28px' }}>🤖 AI 기반 여정 어시스턴트</h1>
        <p style={{ color: '#777', margin: 0, fontSize: '15px' }}>
          차세대 웹 트렌드 테크를 적용한 나만의 스마트 여행 도우미
        </p>
      </header>

      {/* 메인 2분할 레이아웃 (채팅창 & 지도) */}
      <main style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '30px', alignItems: 'start' }}>
        <section>
          <ChatWindow />
        </section>

        <section style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden' }}>
          <TravelMap />
        </section>
      </main>

      {/* 하단 섹션: 영수증 처리 및 대시보드 대형 조각 조립 */}
      <section>
        <ExpenseDashboard />
      </section>

    </div>
  );
}

export default App;