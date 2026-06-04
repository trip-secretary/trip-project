import { useEffect, useMemo, useRef, useState } from 'react';

const QUICK_ACTIONS = [
  { label: '비 오면?', scenario: 'rain', prompt: '비가 오면 일정이 어떻게 바뀌어?' },
  { label: '예산 줄이기', scenario: 'budget', prompt: '예산을 아끼는 일정으로 다시 짜줘.' },
  { label: '기본 추천', scenario: 'balanced', prompt: '현재 조건에 맞는 균형 잡힌 일정으로 보여줘.' },
];

function ChatWindow({ activePlan, plans, tripSettings, onScenarioChange, scenarioKey }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요. 여행 조건을 바꾸면 제가 예산, 이동수단, 취향을 반영해서 일정을 다시 계산해드릴게요.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const activeAction = useMemo(
    () => QUICK_ACTIONS.find((action) => action.scenario === scenarioKey),
    [scenarioKey],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addConversation = (prompt, scenario = scenarioKey) => {
    if (isTyping) return;

    const userMessage = { id: Date.now(), sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    onScenarioChange(scenario);
    streamAIResponse(prompt, scenario);
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const normalized = inputText.trim();
    const detectedScenario = detectScenario(normalized, scenarioKey);
    addConversation(normalized, detectedScenario);
  };

  const streamAIResponse = (prompt, scenario) => {
    setIsTyping(true);
    const answer = createAnswer(prompt, scenario, plans[scenario] ?? activePlan, tripSettings);
    const aiMessageId = Date.now() + 1;

    setMessages((prev) => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

    let index = 0;
    let currentText = '';
    const interval = setInterval(() => {
      if (index < answer.length) {
        currentText += answer[index];
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId ? { ...message, text: currentText } : message,
          ),
        );
        index += 1;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 16);
  };

  return (
    <section className="chat-panel">
      <div className="panel-header">
        <div>
          <span>AI 플래너</span>
          <h2>상황 대응 채팅</h2>
        </div>
        <strong>{activeAction?.label}</strong>
      </div>

      <div className="quick-actions" aria-label="빠른 상황 변경">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.scenario}
            className={scenarioKey === action.scenario ? 'selected' : ''}
            onClick={() => addConversation(action.prompt, action.scenario)}
            type="button"
            disabled={isTyping}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="message-list">
        {messages.map((message) => (
          <div className={`message ${message.sender}`} key={message.id}>
            {message.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder={isTyping ? 'AI가 일정을 다시 계산하고 있어요...' : '예: 비 오면 실내 코스로 바꿔줘'}
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping || !inputText.trim()}>
          전송
        </button>
      </form>
    </section>
  );
}

function detectScenario(text, fallback) {
  if (/비|우천|실내|날씨/.test(text)) return 'rain';
  if (/예산|절약|돈|비용|저렴/.test(text)) return 'budget';
  if (/기본|균형|처음|추천/.test(text)) return 'balanced';
  return fallback;
}

function createAnswer(prompt, scenario, activePlan, settings) {
  const planName = {
    balanced: '기본 추천 일정',
    rain: '비 오는 날 대체 일정',
    budget: '예산 절약 일정',
  }[scenario];

  const firstStop = activePlan.places[1]?.title ?? activePlan.places[0].title;
  const lastStop = activePlan.places[activePlan.places.length - 1].title;

  return `[${planName}] 요청: "${prompt}"

현재 조건
- 여행지: ${settings.destination}
- 기간/인원: ${settings.dates}, ${settings.travelers}명
- 예산: ${settings.budget.toLocaleString()}원
- 이동수단: ${settings.transport}
- 취향: ${settings.preference}

${activePlan.summary}

핵심 변경점은 ${firstStop}부터 ${lastStop}까지의 동선을 ${settings.pace} 흐름에 맞춘 것입니다.

추천 근거
- ${activePlan.reasons.join('\n- ')}`;
}

export default ChatWindow;
