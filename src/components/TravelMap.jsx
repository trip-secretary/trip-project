import React, { useEffect, useRef, useState } from 'react';

function TravelMap() {
  const mapContainer = useRef(null); 
  const mapRef = useRef(null); // 📌 생성된 지도 객체를 컴포넌트 전체에서 공유하기 위한 보관함

  // 1. 현재 사용자가 보고 있는 플랜이 무엇인지 기억하는 상자 (기본값: 'planA')
  const [currentPlan, setCurrentPlan] = useState('planA');

  // 2. 지도 위에 그려진 마커들과 선들을 보관해두는 기억 장치
  // 새로운 플랜을 그릴 때 '이전 흔적들을 싹 지우기 위해' 필요합니다.
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // 3. 테스트용 가짜 데이터 (Mock Data)
  // 이미지 속 아키텍처의 플로우 A를 그대로 흉내 낸 데이터입니다.
  const mockPlans = {
    planA: {
      name: "Plan A (맑음 - 야외 중심 코스)",
      lineColor: '#4A90E2', // 파란색 선
      places: [
        { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523 },
        { title: '용두암 (야외)', lat: 33.5132714, lng: 126.511942 },
        { title: '이호테우 해변 (야외)', lat: 33.497555, lng: 126.452613 }
      ]
    },
    planB: {
      name: "Plan B (우천 - 실내 중심 코스)",
      lineColor: '#FF6B6B', // 빨간색 선
      places: [
        { title: '제주국제공항', lat: 33.5104135, lng: 126.4913523 },
        { title: '국립제주박물관 (실내)', lat: 33.513495, lng: 126.548956 },
        { title: '아라리오뮤지엄 (실내)', lat: 33.516805, lng: 126.527315 }
      ]
    }
  };

  // [기능 1] 지도 처음 생성하기 (딱 한 번만 실행)
  useEffect(() => {
    const { kakao } = window;
    if (!kakao || !mapContainer.current) return;

    const centerPosition = new kakao.maps.LatLng(33.5104135, 126.4913523);
    const options = {
      center: centerPosition,
      level: 6 // 동선이 넓어져서 지도를 조금 더 축소(레벨 업)했습니다.
    };

    const map = new kakao.maps.Map(mapContainer.current, options);
    mapRef.current = map; // 생성된 지도를 보관함에 잘 저장해 둡니다.
  }, []);


  // [기능 2] currentPlan(Plan A 또는 B)이 바뀔 때마다 지도를 새로 그리는 마법의 구역
  useEffect(() => {
    const { kakao } = window;
    const map = mapRef.current;
    if (!kakao || !map) return;

    // ─── 지우기 단계 ───
    // 기존에 지도에 찍혀있던 마커들을 지도에서 다 떼어냅니다.
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = []; // 보관함 비우기

    // 기존에 그려진 선이 있다면 선도 지도에서 지웁니다.
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // ─── 새로 그리기 단계 ───
    // 현재 선택된 플랜의 데이터를 가져옵니다. (Plan A 또는 Plan B)
    const activePlan = mockPlans[currentPlan];
    const linePath = []; // 선을 그릴 좌표들을 담을 바구니

    activePlan.places.forEach((place) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      linePath.push(position); // 선 좌표 바구니에 추가

      // 마커 생성 후 지도에 표시
      const marker = new kakao.maps.Marker({
        map: map,
        position: position,
        title: place.title
      });

      // 나중에 지울 수 있도록 보관함에 쏙 넣어줍니다.
      markersRef.current.push(marker);
    });

    // 좌표 바구니를 토대로 선(Polyline)을 만듭니다.
    const polyline = new kakao.maps.Polyline({
      path: linePath, // 선을 구성하는 좌표 배열
      strokeWeight: 5, // 선의 두께
      strokeColor: activePlan.lineColor, // 선의 색깔
      strokeOpacity: 0.7, // 선의 불투명도
      strokeStyle: 'solid' // 선의 스타일
    });

    // 선을 지도에 올립니다.
    polyline.setMap(map);
    polylineRef.current = polyline; // 나중에 지울 수 있도록 보관함에 저장

  }, [currentPlan]); // 📌 [중요] currentPlan이 바뀔 때마다 이 내부 코드가 다시 실행됩니다!


  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>🗺️ 날씨 기반 동선 시각화</h3>
      
      {/* 사용자가 누를 버튼 UI 구성 */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setCurrentPlan('planA')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: currentPlan === 'planA' ? '#4A90E2' : '#eee',
            color: currentPlan === 'planA' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
        >
          ☀️ 맑은 날 (Plan A) 야외 중심
        </button>
        <button 
          onClick={() => setCurrentPlan('planB')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: currentPlan === 'planB' ? '#FF6B6B' : '#eee',
            color: currentPlan === 'planB' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
        >
          ☔ 우천 시 (Plan B) 실내 중심
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
        현재 화면: <strong>{mockPlans[currentPlan].name}</strong>
      </p>

      {/* 지도가 그려지는 그릇 */}
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '500px', 
          borderRadius: '16px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
        }} 
      />
    </div>
  );
}

export default TravelMap;