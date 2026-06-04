import { useState } from "react";
import { Search } from "lucide-react";

// ── 좌표 변환 기준 ─────────────────────────────────────────────
// viewBox 480 × 520
// 경도 125.7°E ~ 130.1°E  →  x = (lon - 125.7) * 109.1
// 위도 38.8°N  ~  33.0°N  →  y = (38.8 - lat) * 89.7
// ────────────────────────────────────────────────────────────────

// 내부 경계 교점 (5개)
// A = (218, 44)  DMZ 위 강원·경기 경계
// B = (246,200)  강원·경기·충청 3도 교점
// C = (390,300)  강원·경상 동해안 경계
// D = (270,318)  충청·전라·경상 3도 교점
// G = ( 45,175)  경기·충청 서해안 경계
// H = ( 62,248)  충청·전라 서해안 경계

interface Region {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  path: string;
}

const regions: Region[] = [
  {
    id: "gangwon",
    name: "강원특별자치도",
    labelX: 348,
    labelY: 168,
    // 북: DMZ A→동해안, 동: 동해안→C, 남·서: C→B→A (태백산맥)
    path: `M 218,44 L 260,38 L 285,28 L 305,20 L 315,18
      L 316,35 L 320,62 L 324,92 L 330,122 L 338,152
      L 346,182 L 356,210 L 365,238 L 374,264 L 382,288 L 390,300
      L 374,290 L 356,280 L 336,272 L 315,264 L 296,257
      L 278,248 L 264,234 L 254,218 L 246,200
      L 234,182 L 226,162 L 220,140 L 217,115 L 216,88 L 217,65 Z`,
  },
  {
    id: "gyeonggi-incheon",
    name: "경기도·인천",
    labelX: 130,
    labelY: 138,
    // 북: DMZ 서쪽→A, 동: A→B(강원경계), 남: B→G(충청경계), 서: 해안
    path: `M 48,70 L 80,66 L 112,60 L 148,52 L 185,46 L 218,44
      L 217,65 L 216,88 L 217,115 L 220,140 L 226,162
      L 234,182 L 246,200
      L 234,206 L 218,213 L 200,218 L 180,222 L 158,220
      L 138,212 L 116,203 L 94,193 L 72,182 L 52,174 L 45,175
      L 38,162 L 32,148 L 28,130 L 28,108 L 30,86 L 34,70 Z
      M 24,175 L 38,166 L 50,174 L 52,186 L 40,194 L 26,186 Z`,
  },
  {
    id: "chungcheong",
    name: "충청도",
    labelX: 162,
    labelY: 268,
    // 북: G→B, 동: B→D(경상경계), 남: D→H, 서: 해안
    path: `M 45,175 L 52,174 L 72,182 L 94,193 L 116,203
      L 138,212 L 158,220 L 180,222 L 200,218 L 218,213 L 234,206 L 246,200
      L 254,218 L 264,234 L 270,252 L 272,272 L 270,292 L 268,312 L 270,318
      L 256,323 L 240,327 L 222,328 L 204,326 L 184,320
      L 162,310 L 140,298 L 118,283 L 96,266 L 76,250 L 62,248
      L 56,232 L 50,215 L 46,195 Z`,
  },
  {
    id: "gyeongsang",
    name: "경상도",
    labelX: 358,
    labelY: 365,
    // 북서: B→C(강원경계), 동: 동해안 C→SE, 남: 남해안→I, 서: I→D(전라경계), 북: D→B(충청경계)
    path: `M 246,200 L 264,234 L 278,248 L 296,257
      L 315,264 L 336,272 L 356,280 L 374,290 L 390,300
      L 392,310 L 398,335 L 404,358 L 415,374
      L 405,390 L 392,406 L 375,420 L 356,432
      L 334,440 L 310,444 L 284,444 L 260,434
      L 262,416 L 268,396 L 270,374 L 270,354
      L 268,334 L 270,318
      L 268,312 L 270,292 L 272,272 L 270,252 L 264,234 Z`,
  },
  {
    id: "jeolla",
    name: "전라도",
    labelX: 148,
    labelY: 375,
    // 북: H→D, 동: D→I(경상경계), 남: 남해안, 서: 서해안
    path: `M 62,248 L 76,250 L 96,266 L 118,283 L 140,298
      L 162,310 L 184,320 L 204,326 L 222,328 L 240,327 L 256,323 L 270,318
      L 268,334 L 270,354 L 270,374 L 268,396 L 262,416 L 260,434
      L 240,440 L 218,450 L 196,458 L 172,460
      L 150,455 L 130,444 L 110,430 L 92,412 L 78,392 L 66,372
      L 58,350 L 52,328 L 50,306 L 50,285 L 54,266 Z`,
  },
  {
    id: "jeju",
    name: "제주특별자치도",
    labelX: 178,
    labelY: 492,
    path: `M 108,482 L 142,475 L 178,471 L 213,471
      L 240,477 L 252,488 L 248,500
      L 226,508 L 198,512 L 168,512 L 140,507 L 120,498 Z`,
  },
];

// 본토 외곽 (전체 해안선)
const MAINLAND_PATH = `
  M 48,70 L 80,66 L 112,60 L 148,52 L 185,46 L 218,44
  L 260,38 L 285,28 L 305,20 L 315,18
  L 316,35 L 320,62 L 324,92 L 330,122 L 338,152
  L 346,182 L 356,210 L 365,238 L 374,264 L 382,288 L 390,300
  L 392,310 L 398,335 L 404,358 L 415,374
  L 405,390 L 392,406 L 375,420 L 356,432
  L 334,440 L 310,444 L 284,444 L 260,434
  L 240,440 L 218,450 L 196,458 L 172,460
  L 150,455 L 130,444 L 110,430 L 92,412 L 78,392 L 66,372
  L 58,350 L 52,328 L 50,306 L 50,285 L 54,266 L 62,248
  L 56,232 L 50,215 L 46,195 L 45,175
  L 38,162 L 32,148 L 28,130 L 28,108 L 30,86 L 34,70 Z
`;

const JEJU_PATH = `
  M 108,482 L 142,475 L 178,471 L 213,471
  L 240,477 L 252,488 L 248,500
  L 226,508 L 198,512 L 168,512 L 140,507 L 120,498 Z
`;

// 인천 앞바다 섬
const INCHEON_ISLAND_PATH = `M 24,175 L 38,166 L 50,174 L 52,186 L 40,194 L 26,186 Z`;

interface KoreaMapProps {
  onRegionClick?: (regionName: string) => void;
}

export function KoreaMap({ onRegionClick }: KoreaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [clickedRegion, setClickedRegion] = useState<string | null>(null);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });

  const handleRegionClick = (e: React.MouseEvent, region: Region) => {
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 480;
    const y = ((e.clientY - rect.top) / rect.height) * 520;
    setFormPosition({ x, y });
    setClickedRegion(region.id);
    onRegionClick?.(region.name);
  };

  const closeForm = () => setClickedRegion(null);

  return (
    <div className="relative w-full max-w-xl mx-auto py-12">
      <div className="relative rounded-2xl overflow-visible shadow-lg">
        <svg viewBox="0 0 480 520" className="w-full h-auto" style={{ display: "block" }}>
          <defs>
            <linearGradient id="seaGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b8d8ea" />
              <stop offset="100%" stopColor="#cae8f5" />
            </linearGradient>
            <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8ebb5" />
              <stop offset="100%" stopColor="#c8e0a2" />
            </linearGradient>
            <filter id="landShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#4a7c3f" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* 바다 배경 */}
          <rect width="480" height="520" fill="url(#seaGrad)" />

          {/* 본토 육지 */}
          <path d={MAINLAND_PATH} fill="url(#landGrad)" stroke="#7aaa5e" strokeWidth="1.8" filter="url(#landShadow)" />
          {/* 인천 섬 */}
          <path d={INCHEON_ISLAND_PATH} fill="url(#landGrad)" stroke="#7aaa5e" strokeWidth="1.2" />
          {/* 제주도 */}
          <path d={JEJU_PATH} fill="url(#landGrad)" stroke="#7aaa5e" strokeWidth="1.5" filter="url(#landShadow)" />

          {/* 행정구역 오버레이 */}
          {regions.map((region) => {
            const isHovered = hoveredRegion === region.id;
            return (
              <g key={region.id}>
                <path
                  d={region.path}
                  fill={isHovered ? "rgba(99,102,241,0.22)" : "transparent"}
                  stroke={isHovered ? "#4338ca" : "rgba(71,85,105,0.35)"}
                  strokeWidth={isHovered ? "2.2" : "1.2"}
                  strokeLinejoin="round"
                  strokeDasharray={isHovered ? "none" : "4,3"}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={(e) => handleRegionClick(e, region)}
                />
                {isHovered && (
                  <text
                    x={region.labelX}
                    y={region.labelY}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#1e1b4b"
                    stroke="white"
                    strokeWidth="3"
                    paintOrder="stroke"
                    className="pointer-events-none select-none"
                  >
                    {region.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 클릭 팝업 */}
      {clickedRegion && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeForm} />
          <div
            className="absolute bg-white border-2 border-slate-200 rounded-xl shadow-2xl p-4 z-50 w-64"
            style={{
              left: `${(formPosition.x / 480) * 100}%`,
              top: `${(formPosition.y / 520) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                {regions.find((r) => r.id === clickedRegion)?.name}
              </h3>
            </div>
            <form className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">가는 날</label>
                <input type="date" className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">오는 날</label>
                <input type="date" className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">여행 목적</label>
                <select className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option>관광</option>
                  <option>휴양</option>
                  <option>미식</option>
                  <option>액티비티</option>
                  <option>쇼핑</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors">
                  취소
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">
                  <Search className="w-3 h-3" />
                  검색
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
