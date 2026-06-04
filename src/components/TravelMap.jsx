import { useEffect, useRef } from 'react';

function TravelMap({ activePlan }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    const { kakao } = window;
    if (!kakao || !mapContainer.current || mapRef.current) return;

    const centerPosition = new kakao.maps.LatLng(33.5104135, 126.4913523);
    mapRef.current = new kakao.maps.Map(mapContainer.current, {
      center: centerPosition,
      level: 8,
    });
  }, []);

  useEffect(() => {
    const { kakao } = window;
    const map = mapRef.current;
    if (!kakao || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new kakao.maps.LatLngBounds();
    const linePath = activePlan.places.map((place, index) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);

      const marker = new kakao.maps.Marker({
        map,
        position,
        title: place.title,
      });

      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div class="map-info"><strong>${index + 1}. ${place.title}</strong><span>${place.time} ${place.memo}</span></div>`,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      return position;
    });

    polylineRef.current = new kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: activePlan.lineColor,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
    });

    polylineRef.current.setMap(map);
    map.setBounds(bounds);
  }, [activePlan]);

  return (
    <section className="map-panel">
      <div className="panel-header">
        <div>
          <span>동선 시각화</span>
          <h2>{activePlan.label} 코스</h2>
        </div>
        <strong style={{ color: activePlan.accentColor }}>{activePlan.weather}</strong>
      </div>

      <div className="map-shell">
        <div ref={mapContainer} className="map-canvas" />
        <div className="map-overlay">
          <strong>{activePlan.places[0].title}</strong>
          <span>출발지 기준으로 코스를 자동 재정렬합니다.</span>
        </div>
      </div>
    </section>
  );
}

export default TravelMap;
