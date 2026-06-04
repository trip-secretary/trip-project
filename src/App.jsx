import { useMemo, useState } from 'react';
import './App.css';
import TravelMap from './components/TravelMap';
import ChatWindow from './components/ChatWindow';
import ExpenseDashboard from './components/ExpenseDashboard';

const DEFAULT_TRIP_SETTINGS = {
  destination: '제주',
  dates: '2박 3일',
  travelers: 3,
  budget: 300000,
  preference: '감성 카페, 바다 산책, 사진 명소',
  transport: '렌터카',
  pace: '여유롭게',
  weatherMode: '자동',
};

const SETTING_OPTIONS = {
  destination: ['제주', '부산', '강릉', '여수'],
  dates: ['당일치기', '1박 2일', '2박 3일', '3박 4일'],
  transport: ['렌터카', '대중교통', '택시', '도보 위주'],
  pace: ['빡빡하게', '균형 있게', '여유롭게'],
  weatherMode: ['자동', '맑음 우선', '비 대비', '실내 위주'],
};

const SCENARIO_BASE = {
  balanced: {
    label: '기본 추천',
    weather: '맑음',
    budgetRisk: '안정',
    lineColor: '#2563eb',
    accentColor: '#2563eb',
    places: [
      { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523, time: '10:00', memo: '도착 및 이동 준비' },
      { title: '한담해안산책로', lat: 33.463907, lng: 126.310078, time: '11:20', memo: '바다 산책, 사진 포인트' },
      { title: '애월 감성 카페', lat: 33.462312, lng: 126.309689, time: '13:00', memo: '점심 겸 카페 휴식' },
      { title: '이호테우 해변', lat: 33.497555, lng: 126.452613, time: '16:00', memo: '일몰 전 가벼운 산책' },
    ],
  },
  rain: {
    label: '비 오는 날',
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
  },
  budget: {
    label: '예산 절약',
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
  },
};

function App() {
  const [scenarioKey, setScenarioKey] = useState('balanced');
  const [tripSettings, setTripSettings] = useState(DEFAULT_TRIP_SETTINGS);

  const scenarios = useMemo(() => createScenarios(tripSettings), [tripSettings]);
  const activePlan = scenarios[scenarioKey];

  const planStats = useMemo(() => {
    const stopCount = activePlan.places.length;
    const first = activePlan.places[0]?.time;
    const last = activePlan.places[stopCount - 1]?.time;
    return [
      { label: '방문지', value: `${stopCount}곳` },
      { label: '일정', value: `${first} - ${last}` },
      { label: '이동수단', value: tripSettings.transport },
      { label: '예산', value: `${tripSettings.budget.toLocaleString()}원` },
    ];
  }, [activePlan, tripSettings]);

  const updateSetting = (name, value) => {
    setTripSettings((prev) => ({
      ...prev,
      [name]: name === 'travelers' || name === 'budget' ? Number(value) : value,
    }));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Agentic Travel Assistant</span>
          <h1>AI 여행 매니저</h1>
          <p>
            사용자가 입력한 여행 조건을 바탕으로 날씨, 예산, 이동 피로도에 따라 일정을
            다시 구성하는 졸업프로젝트 데모입니다.
          </p>
        </div>

        <TripSettingsPanel settings={tripSettings} onChange={updateSetting} />
      </header>

      <section className="scenario-panel" aria-label="상황별 재계획">
        <div>
          <h2>상황별 자동 재계획</h2>
          <p>여행 조건을 바꾸거나 버튼을 누르면 AI가 코스, 일정표, 추천 이유를 다시 구성합니다.</p>
        </div>
        <div className="scenario-actions">
          {Object.entries(scenarios).map(([key, scenario]) => (
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
          plans={scenarios}
          tripSettings={tripSettings}
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

      <ExpenseDashboard scenarioKey={scenarioKey} tripSettings={tripSettings} />
    </div>
  );
}

function TripSettingsPanel({ settings, onChange }) {
  return (
    <form className="trip-card settings-card">
      <span className="trip-card-title">여행 조건 설정</span>

      <label className="setting-field">
        <span>여행지</span>
        <select value={settings.destination} onChange={(event) => onChange('destination', event.target.value)}>
          {SETTING_OPTIONS.destination.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <div className="setting-pair">
        <label className="setting-field">
          <span>기간</span>
          <select value={settings.dates} onChange={(event) => onChange('dates', event.target.value)}>
            {SETTING_OPTIONS.dates.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="setting-field">
          <span>인원</span>
          <input
            type="number"
            min="1"
            max="12"
            value={settings.travelers}
            onChange={(event) => onChange('travelers', event.target.value)}
          />
        </label>
      </div>

      <label className="setting-field">
        <span>1일 예산</span>
        <input
          type="range"
          min="100000"
          max="800000"
          step="50000"
          value={settings.budget}
          onChange={(event) => onChange('budget', event.target.value)}
        />
        <strong>{settings.budget.toLocaleString()}원</strong>
      </label>

      <label className="setting-field">
        <span>취향</span>
        <input
          type="text"
          value={settings.preference}
          onChange={(event) => onChange('preference', event.target.value)}
        />
      </label>

      <div className="setting-pair">
        <label className="setting-field">
          <span>이동수단</span>
          <select value={settings.transport} onChange={(event) => onChange('transport', event.target.value)}>
            {SETTING_OPTIONS.transport.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="setting-field">
          <span>여행 속도</span>
          <select value={settings.pace} onChange={(event) => onChange('pace', event.target.value)}>
            {SETTING_OPTIONS.pace.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="setting-field">
        <span>날씨 대응</span>
        <select value={settings.weatherMode} onChange={(event) => onChange('weatherMode', event.target.value)}>
          {SETTING_OPTIONS.weatherMode.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    </form>
  );
}

function createScenarios(settings) {
  const commonReason = `${settings.destination} ${settings.dates}, ${settings.travelers}명 기준으로 ${settings.transport} 이동에 맞췄습니다.`;
  const paceReason = `여행 속도는 '${settings.pace}' 설정을 반영했습니다.`;
  const preferenceReason = `사용자 취향 '${settings.preference}'를 우선순위로 두었습니다.`;

  return {
    balanced: {
      ...SCENARIO_BASE.balanced,
      headline: `${settings.destination} ${settings.dates} 맞춤 균형 일정`,
      summary: `${settings.preference} 취향을 중심으로 예산과 이동 시간을 균형 있게 맞춘 코스입니다.`,
      reasons: [commonReason, preferenceReason, paceReason],
    },
    rain: {
      ...SCENARIO_BASE.rain,
      headline: `${settings.destination} 비 예보 대응 실내 중심 일정`,
      summary: `${settings.weatherMode} 설정을 반영해 야외 체류 시간을 줄이고 실내 장소를 중심으로 재계획했습니다.`,
      reasons: [commonReason, '비 예보에 대비해 실내 관광지와 시장 동선을 우선 배치했습니다.', paceReason],
    },
    budget: {
      ...SCENARIO_BASE.budget,
      headline: `${settings.budget.toLocaleString()}원 예산을 지키는 절약 일정`,
      summary: `무료 관광지와 가성비 식사 장소를 섞어 ${settings.travelers}명이 예산을 넘기지 않도록 구성했습니다.`,
      reasons: [commonReason, '무료 관광지와 시장 중심 코스로 지출을 낮췄습니다.', preferenceReason],
    },
  };
}

export default App;
