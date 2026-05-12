import React, { useState, useRef, useEffect } from 'react';

function ChatWindow() {
  // 1. 대화 내역들을 담아두는 배열 상자 (처음에는 AI의 웰컴 메시지가 들어있습니다)
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: '안녕하세요! 제주도 여행 계획을 도와드릴 AI 플래너입니다. "제주 2박 3일" 또는 "감성 카페 추천" 등 편하게 말씀해주세요!' }
  ]);

  // 2. 사용자가 입력창에 치고 있는 텍스트를 기억하는 상자
  const [inputText, setInputText] = useState('');
  
  // 3. AI가 지금 한 글자씩 대답을 "생성 중(스트리밍 중)"인지 체크하는 상태
  const [isTyping, setIsTyping] = useState(false);

  // 채팅방 스크롤을 맨 아래로 내리기 위한 장치
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // [핵심 함수] 사용자가 메시지를 전송했을 때 실행되는 함수
  const handleSend = (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    if (!inputText.trim() || isTyping) return; // 빈 칸이거나 AI가 말하는 중이면 패스

    // A. 사용자가 쓴 글을 채팅방 대화 내역에 추가하기
    const userMessage = { id: Date.now(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText(''); // 입력창 비우기

    // B. AI의 실시간 가짜 SSE 스트리밍 답변 시작하기
    setIsTyping(true);
    simulateAIResponse(inputText);
  };

  // [가짜 SSE 함수] AI 대답이 한 글자씩 추가되는 마법의 함수
  const simulateAIResponse = (userQuery) => {
    const fullAnswer = `🤖 [플로우 B: RAG 기반 추천] "${userQuery}"에 대한 추천 장소입니다.\n\n맑은 날(Plan A)이라면 바다가 보이는 '용두암 카페거리'를, 우천 시(Plan B)라면 실내 복합 문화공간인 '아라리오뮤지엄'을 추천합니다! 지도의 버튼을 눌러 동선을 확인해보세요.`;
    
    // 먼저 채팅방에 비어있는 AI 메시지 칸을 하나 만듭니다.
    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

    let currentText = '';
    let index = 0;

    // 타이머를 돌리면서 한 글자씩 글자를 이어 붙입니다 (SSE 스트리밍 흉내내기)
    const interval = setInterval(() => {
      if (index < fullAnswer.length) {
        currentText += fullAnswer[index];
        
        // 특정 ID를 가진 AI 메시지의 텍스트만 실시간으로 업데이트해줍니다.
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: currentText } : msg))
        );
        index++;
      } else {
        clearInterval(interval); // 글자가 다 나오면 타이머 종료
        setIsTyping(false); // AI 말하기 끝
      }
    }, 30); // 30ms마다 한 글자씩 출력 (속도 조절 가능)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '550px', backgroundColor: '#f9f9f9', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
      
      {/* 채팅창 헤더 */}
      <div style={{ padding: '15px 20px', backgroundColor: '#4A90E2', color: '#fff', fontWeight: 'bold' }}>
        🤖 Agentic AI 플래너
      </div>

      {/* 대화 내역이 보여지는 구역 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              backgroundColor: msg.sender === 'user' ? '#4A90E2' : '#fff',
              color: msg.sender === 'user' ? '#fff' : '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              whiteSpace: 'pre-line', // 줄바꿈(\n)이 화면에 먹히도록 설정
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          >
            {msg.text}
          </div>
        ))}
        {/* 스크롤 하단 자동 고정용 타겟 */}
        <div ref={chatEndRef} />
      </div>

      {/* 메시지 입력창 폼 */}
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isTyping ? "AI가 답변을 생성 중입니다..." : "메시지를 입력하세요 (예: 감성 카페 추천)"}
          disabled={isTyping}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          style={{
            marginLeft: '10px',
            padding: '0 20px',
            backgroundColor: isTyping || !inputText.trim() ? '#ccc' : '#4A90E2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isTyping || !inputText.trim() ? 'default' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          전송
        </button>
      </form>

    </div>
  );
}

export default ChatWindow;