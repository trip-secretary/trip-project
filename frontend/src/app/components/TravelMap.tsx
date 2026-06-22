import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Spot {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface TravelMapProps {
  spots?: Spot[];
}

const defaultSpots: Spot[] = [
  { id: 1, name: '경복궁',   lat: 37.5796, lng: 126.9770 },
  { id: 2, name: '인사동',   lat: 37.5744, lng: 126.9850 },
  { id: 3, name: '남산타워', lat: 37.5512, lng: 126.9882 },
  { id: 4, name: '명동',     lat: 37.5636, lng: 126.9869 },
];

export default function TravelMap({ spots = defaultSpots }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const renderMarkers = (kakao: any, map: any, spots: Spot[]) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (!spots || spots.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    const linePath = spots.map((spot, index) => {
      const position = new kakao.maps.LatLng(spot.lat, spot.lng);
      bounds.extend(position);

      const marker = new kakao.maps.Marker({ map, position, title: spot.name });
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap">${spot.name}</div>`,
      });
      kakao.maps.event.addListener(marker, 'click', () => infoWindow.open(map, marker));
      markersRef.current.push(marker);

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: `<div style="width:26px;height:26px;background:#185FA5;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;pointer-events:none">${index + 1}</div>`,
        yAnchor: 0.5, xAnchor: 0.5, zIndex: 3,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
      return position;
    });

    polylineRef.current = new kakao.maps.Polyline({
      path: linePath, strokeWeight: 4, strokeColor: '#185FA5',
      strokeOpacity: 0.8, strokeStyle: 'dash',
    });
    polylineRef.current.setMap(map);
    map.setBounds(bounds);
  };

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const tryInit = () => {
      if (cancelled) return;
      const kakao = window.kakao;
      if (!kakao) {
        retryTimer = setTimeout(tryInit, 200);
        return;
      }
      kakao.maps.load(() => {
        if (cancelled || !mapContainer.current) return;
        if (mapRef.current) {
          renderMarkers(kakao, mapRef.current, spots);
          return;
        }
        const center = new kakao.maps.LatLng(37.5665, 126.9780);
        const map = new kakao.maps.Map(mapContainer.current, { center, level: 8 });
        mapRef.current = map;
        renderMarkers(kakao, map, spots);
      });
    };

    tryInit();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [spots]);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '256px' }}
      className="z-0"
    />
  );
}
