import { useEffect, useMemo, useRef, useState } from 'react';

const QUICK_ACTIONS = [
  { label: '비 오면?', scenario: 'rain', prompt: '비가 오면 일정이 어떻게 바뀌어?' },
  { label: '예산 줄이기', scenario: 'budget', prompt: '예산을 아끼는 일정으로 다시 짜줘.' },
  { label: '기본 추천', scenario: 'balanced', prompt: '처음 조건에 맞는 균형 잡힌 일정으로 보여줘.' },
];

function ChatWindow({ activePlan, plans, onScenarioChange, scenarioKey }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요. 저는 여행 중 날씨, 예산, 이동 피로도를 보고 일정을 다시 짜주는 AI 여행 매니저입니다. 아래 버튼으로 상황을 바꿔보세요.',
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
    const answer = createAnswer(prompt, scenario, plans[scenario] ?? activePlan);
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

function createAnswer(prompt, scenario, activePlan) {
  const planName = {
    balanced: '기본 추천 일정',
    rain: '비 오는 날 대체 일정',
    budget: '예산 절약 일정',
  }[scenario];

  const firstStop = activePlan.places[1]?.title ?? activePlan.places[0].title;
  const lastStop = activePlan.places[activePlan.places.length - 1].title;

  return `[${planName}] 요청: "${prompt}"\n\n${activePlan.summary}\n\n핵심 변경점은 ${firstStop}부터 ${lastStop}까지 이동 부담을 줄인 것입니다. 지도와 일정표도 같은 기준으로 업데이트했어요.\n\n추천 근거\n- ${activePlan.reasons.join('\n- ')}`;
}

export default ChatWindow;
