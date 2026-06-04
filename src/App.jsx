import { useMemo, useState } from 'react';
import './App.css';
import TravelMap from './components/TravelMap';
import ChatWindow from './components/ChatWindow';
import ExpenseDashboard from './components/ExpenseDashboard';

const SCENARIOS = {
  balanced: {
    label: '기본 추천',
    headline: '취향, 예산, 이동 시간을 균형 있게 맞춘 제주 일정',
    summary: '감성 카페와 바다 산책을 중심으로 하되, 이동 피로가 커지지 않도록 공항 근처 동선을 먼저 배치했습니다.',
    weather: '맑음',
    budgetRisk: '안정',
    lineColor: '#2563eb',
    accentColor: '#2563eb',
    places: [
      { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523, time: '10:00', memo: '도착 및 렌터카 수령' },
      { title: '한담해안산책로', lat: 33.463907, lng: 126.310078, time: '11:20', memo: '바다 산책, 사진 포인트' },
      { title: '애월 감성 카페', lat: 33.462312, lng: 126.309689, time: '13:00', memo: '점심 겸 카페 휴식' },
      { title: '이호테우 해변', lat: 33.497555, lng: 126.452613, time: '16:00', memo: '일몰 전 가벼운 산책' },
    ],
    reasons: ['공항에서 멀지 않은 서쪽 코스', '사진 명소와 휴식 시간이 균형적', '1일 예산 30만원 안에서 진행 가능'],
  },
  rain: {
    label: '비 오는 날',
    headline: '비 예보에 맞춰 실내 중심으로 자동 변경한 일정',
    summary: '야외 해변 코스를 줄이고 박물관, 전시, 실내 카페를 중심으로 재계획했습니다.',
    weather: '비',
    budgetRisk: '안정',
    lineColor: '#0f766e',
    accentColor: '#0f766e',
    places: [
      { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523, time: '10:00', memo: '도착 및 우천 알림 확인' },
      { title: '국립제주박물관', lat: 33.513495, lng: 126.548956, time: '11:00', memo: '실내 관람 코스' },
      { title: '동문시장', lat: 33.512305, lng: 126.526017, time: '13:10', memo: '점심 및 간식 구매' },
      { title: '아라리오뮤지엄', lat: 33.516805, lng: 126.527315, time: '15:20', memo: '전시 관람, 비 피하기' },
    ],
    reasons: ['비 예보로 야외 체류 시간 축소', '실내 이동 동선이 짧음', '시장 방문으로 식비를 유연하게 조절 가능'],
  },
  budget: {
    label: '예산 절약',
    headline: '예산 초과 위험을 줄인 가성비 중심 일정',
    summary: '유료 관광지를 줄이고 시장, 산책로, 무료 전망 포인트를 섞어 전체 비용을 낮췄습니다.',
    weather: '구름 많음',
    budgetRisk: '절약',
    lineColor: '#ea580c',
    accentColor: '#ea580c',
    places: [
      { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523, time: '10:00', memo: '도착' },
      { title: '도두봉 전망대', lat: 33.508931, lng: 126.465939, time: '10:40', memo: '무료 전망 코스' },
      { title: '동문시장', lat: 33.512305, lng: 126.526017, time: '12:20', memo: '가성비 점심' },
      { title: '용두암', lat: 33.516119, lng: 126.511879, time: '15:00', memo: '짧은 산책과 사진' },
    ],
    reasons: ['무료 관광지 비중 확대', '식비를 시장 중심으로 절약', '공항 근처 동선으로 교통비 감소'],
  },
};

const TRIP_PROFILE = {
  destination: '제주',
  dates: '2박 3일',
  travelers: '친구 3명',
  budget: '300,000원',
  preference: '감성 카페, 바다 산책, 사진 명소',
};

function App() {
  const [scenarioKey, setScenarioKey] = useState('balanced');
  const activePlan = SCENARIOS[scenarioKey];

  const planStats = useMemo(() => {
    const stopCount = activePlan.places.length;
    const first = activePlan.places[0]?.time;
    const last = activePlan.places[stopCount - 1]?.time;
    return [
      { label: '방문지', value: `${stopCount}곳` },
      { label: '일정', value: `${first} - ${last}` },
      { label: '날씨 대응', value: activePlan.weather },
      { label: '예산 상태', value: activePlan.budgetRisk },
    ];
  }, [activePlan]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Agentic Travel Assistant</span>
          <h1>여행 중 상황 변화까지 관리하는 AI 여행 매니저</h1>
          <p>
            단순 장소 추천을 넘어 날씨, 예산, 이동 피로도를 함께 보고 일정을 다시 짜주는
            졸업프로젝트 데모입니다.
          </p>
        </div>

        <div className="trip-card">
          <span className="trip-card-title">현재 여행 조건</span>
          {Object.entries(TRIP_PROFILE).map(([key, value]) => (
            <div className="trip-row" key={key}>
              <span>{PROFILE_LABELS[key]}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </header>

      <section className="scenario-panel" aria-label="상황별 재계획">
        <div>
          <h2>상황별 자동 재계획</h2>
          <p>버튼을 누르면 AI가 같은 여행 조건에서 코스, 일정표, 추천 이유를 다시 구성합니다.</p>
        </div>
        <div className="scenario-actions">
          {Object.entries(SCENARIOS).map(([key, scenario]) => (
            <button
              className={scenarioKey === key ? 'active' : ''}
              key={key}
              onClick={() => setScenarioKey(key)}
              type="button"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section className="insight-grid">
        {planStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <main className="workspace-grid">
        <ChatWindow
          activePlan={activePlan}
          plans={SCENARIOS}
          onScenarioChange={setScenarioKey}
          scenarioKey={scenarioKey}
        />
        <TravelMap activePlan={activePlan} />
      </main>

      <section className="detail-grid">
        <article className="timeline-panel">
          <div className="section-heading">
            <span>AI 일정표</span>
            <h2>{activePlan.headline}</h2>
            <p>{activePlan.summary}</p>
          </div>
          <ol className="timeline">
            {activePlan.places.map((place) => (
              <li key={`${place.time}-${place.title}`}>
                <time>{place.time}</time>
                <div>
                  <strong>{place.title}</strong>
                  <span>{place.memo}</span>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="reason-panel">
          <div className="section-heading">
            <span>추천 근거</span>
            <h2>왜 이 일정인가요?</h2>
          </div>
          <ul>
            {activePlan.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </article>
      </section>

      <ExpenseDashboard scenarioKey={scenarioKey} />
    </div>
  );
}

const PROFILE_LABELS = {
  destination: '여행지',
  dates: '기간',
  travelers: '인원',
  budget: '1일 예산',
  preference: '취향',
};

export default App;
