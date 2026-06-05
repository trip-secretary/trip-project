import { useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";

interface Region {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  path: string;
}

// ── 본토 외곽선 (3D depth 레이어용) ──────────────────────────────
const MAINLAND = `M 48,70 L 80,66 L 112,60 L 148,52 L 185,46 L 218,44
  L 260,38 L 285,28 L 305,20 L 315,18
  L 316,35 L 320,62 L 324,92 L 330,122 L 338,152 L 346,182 L 352,195
  L 356,210 L 365,238 L 374,264 L 382,288 L 390,300
  L 392,310 L 397,325 L 404,358 L 415,374
  L 405,390 L 392,406 L 375,420 L 356,432 L 334,440 L 310,444 L 284,444 L 260,434
  L 240,440 L 218,450 L 196,458 L 172,460
  L 150,455 L 130,444 L 110,430 L 92,412 L 78,392 L 66,372
  L 58,350 L 52,328 L 50,306 L 50,285 L 54,266 L 62,248
  L 56,232 L 50,215 L 46,195 L 45,175
  L 38,162 L 32,148 L 28,130 L 28,108 L 30,86 L 34,70 Z`;

const JEJU = `M 108,482 L 142,475 L 178,471 L 213,471
  L 240,477 L 252,488 L 248,500 L 226,508 L 198,512 L 168,512 L 140,507 L 120,498 Z`;

const INCHEON_ISLAND = `M 24,175 L 38,166 L 50,174 L 52,186 L 40,194 L 26,186 Z`;

// ── 17개 행정구역 경계 ──────────────────────────────────────────
const regions: Region[] = [
  // ── 광역도 ──
  {
    id: "gangwon",
    name: "강원도",
    labelX: 355,
    labelY: 148,
    path: `M 218,44 L 260,38 L 285,28 L 305,20 L 315,18
      L 316,35 L 320,62 L 324,92 L 330,122 L 338,152 L 346,182 L 352,195
      L 324,190 L 296,184 L 272,178 L 255,170 L 246,200
      L 234,182 L 226,162 L 220,140 L 217,115 L 216,88 L 217,65 Z`,
  },
  {
    id: "gyeonggi",
    name: "경기도",
    labelX: 128,
    labelY: 135,
    // 서울·인천이 위에 덮임
    path: `M 48,70 L 80,66 L 112,60 L 148,52 L 185,46 L 218,44
      L 217,65 L 216,88 L 217,115 L 220,140 L 226,162 L 234,182 L 246,200
      L 234,206 L 218,213 L 200,218 L 180,222 L 158,220 L 138,212
      L 116,203 L 94,193 L 72,182 L 52,174 L 45,175
      L 38,162 L 32,148 L 28,130 L 28,108 L 30,86 L 34,70 Z
      M 24,175 L 38,166 L 50,174 L 52,186 L 40,194 L 26,186 Z`,
  },
  {
    id: "chungnam",
    name: "충청남도",
    labelX: 88,
    labelY: 242,
    path: `M 45,175 L 52,174 L 72,182 L 94,193 L 116,203 L 138,212 L 155,218
      L 155,308
      L 140,298 L 118,283 L 96,266 L 76,250 L 62,248
      L 56,232 L 50,215 L 46,195 Z`,
  },
  {
    id: "chungbuk",
    name: "충청북도",
    labelX: 215,
    labelY: 272,
    path: `M 155,218 L 158,220 L 180,222 L 200,218 L 218,213 L 234,206 L 246,200
      L 255,170 L 272,178 L 296,184 L 324,190 L 352,195
      L 356,210 L 365,238 L 374,264 L 382,288 L 390,300
      L 375,300 L 355,295 L 335,290 L 312,286 L 292,282 L 270,278
      L 268,312 L 270,318
      L 256,323 L 240,327 L 222,328 L 204,326 L 184,320 L 162,310 L 155,308 Z`,
  },
  {
    id: "gyeongbuk",
    name: "경상북도",
    labelX: 348,
    labelY: 268,
    path: `M 270,278 L 292,282 L 312,286 L 335,290 L 355,295 L 375,300 L 390,300
      L 392,310 L 397,325
      L 372,325 L 345,325 L 318,325 L 292,322 L 270,318
      L 268,312 L 270,278 Z`,
  },
  {
    id: "gyeongnam",
    name: "경상남도",
    labelX: 348,
    labelY: 390,
    path: `M 270,318 L 292,322 L 318,325 L 345,325 L 372,325 L 397,325
      L 404,358 L 415,374
      L 405,390 L 392,406 L 375,420 L 356,432 L 334,440 L 310,444 L 284,444 L 260,434
      L 262,416 L 268,396 L 270,374 L 270,354 L 268,338 L 268,334 L 270,318 Z`,
  },
  {
    id: "jeonbuk",
    name: "전라북도",
    labelX: 145,
    labelY: 310,
    path: `M 62,248 L 76,250 L 96,266 L 118,283 L 140,298 L 155,308
      L 162,310 L 184,320 L 204,326 L 222,328 L 240,327 L 256,323 L 270,318
      L 268,334 L 268,338
      L 245,340 L 218,340 L 192,340 L 165,340 L 138,340 L 110,338 L 84,337 L 54,338
      L 52,325 L 50,308 L 50,285 L 54,266 Z`,
  },
  {
    id: "jeonnam",
    name: "전라남도",
    labelX: 132,
    labelY: 415,
    path: `M 54,338 L 84,337 L 110,338 L 138,340 L 165,340 L 192,340 L 218,340 L 245,340 L 268,338
      L 270,354 L 270,374 L 268,396 L 262,416 L 260,434
      L 240,440 L 218,450 L 196,458 L 172,460
      L 150,455 L 130,444 L 110,430 L 92,412 L 78,392 L 66,372
      L 58,350 L 52,328 Z`,
  },
  {
    id: "jeju",
    name: "제주특별자치도",
    labelX: 178,
    labelY: 493,
    path: JEJU,
  },

  // ── 특별·광역시 (도 위에 덮임) ──
  {
    id: "seoul",
    name: "서울특별시",
    labelX: 148,
    labelY: 108,
    path: `M 138,94 L 153,102 L 153,120 L 138,128 L 123,120 L 123,102 Z`,
  },
  {
    id: "incheon",
    name: "인천광역시",
    labelX: 72,
    labelY: 120,
    path: `M 90,106 L 104,114 L 104,128 L 90,136 L 76,128 L 76,114 Z
      M 24,175 L 38,166 L 50,174 L 52,186 L 40,194 L 26,186 Z`,
  },
  {
    id: "sejong",
    name: "세종특별자치시",
    labelX: 157,
    labelY: 204,
    path: `M 157,197 L 165,201 L 165,211 L 157,215 L 149,211 L 149,201 Z`,
  },
  {
    id: "daejeon",
    name: "대전광역시",
    labelX: 175,
    labelY: 227,
    path: `M 175,216 L 185,222 L 185,234 L 175,240 L 165,234 L 165,222 Z`,
  },
  {
    id: "gwangju",
    name: "광주광역시",
    labelX: 122,
    labelY: 326,
    path: `M 122,316 L 132,322 L 132,334 L 122,340 L 112,334 L 112,322 Z`,
  },
  {
    id: "daegu",
    name: "대구광역시",
    labelX: 312,
    labelY: 310,
    path: `M 312,300 L 322,306 L 322,318 L 312,324 L 302,318 L 302,306 Z`,
  },
  {
    id: "ulsan",
    name: "울산광역시",
    labelX: 395,
    labelY: 332,
    path: `M 393,322 L 403,328 L 403,340 L 393,346 L 383,340 L 383,328 Z`,
  },
  {
    id: "busan",
    name: "부산광역시",
    labelX: 375,
    labelY: 370,
    path: `M 373,360 L 385,366 L 385,380 L 373,386 L 361,380 L 361,366 Z`,
  },
];

interface KoreaMapProps {
  onRegionClick?: (regionName: string) => void;
}

export function KoreaMap({ onRegionClick }: KoreaMapProps) {
  const navigate = useNavigate();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [clickedRegion, setClickedRegion] = useState<string | null>(null);
  const [formPos, setFormPos] = useState({ x: 0, y: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("관광");

  const handleRegionClick = (e: React.MouseEvent, region: Region) => {
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 480;
    const y = ((e.clientY - rect.top) / rect.height) * 520;
    setFormPos({ x, y });
    setClickedRegion(region.id);
    onRegionClick?.(region.name);
  };

  const handleSearch = () => {
    const region = regions.find((r) => r.id === clickedRegion);
    if (!region || !startDate || !endDate) return;
    navigate(
      `/results?dest=${encodeURIComponent(region.name)}&start=${startDate}&end=${endDate}&purpose=${encodeURIComponent(purpose)}`
    );
    setClickedRegion(null);
  };

  const closeForm = () => setClickedRegion(null);

  return (
    <div className="relative w-full max-w-xl mx-auto py-12">
      <div className="relative">
        <svg
          viewBox="0 0 480 520"
          className="w-full h-auto drop-shadow-xl"
          style={{ background: "transparent" }}
        >
          <defs>
            <filter id="mapDrop" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#888" floodOpacity="0.25" />
            </filter>
            <linearGradient id="faceGrad" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#d8d8d8" />
            </linearGradient>
            <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </linearGradient>
          </defs>

          {/* ── 3D 측면 레이어 (오프셋) ── */}
          <g transform="translate(5,8)" opacity="1">
            <path d={MAINLAND} fill="#b0b0b0" />
            <path d={JEJU} fill="#b0b0b0" />
            <path d={INCHEON_ISLAND} fill="#b0b0b0" />
          </g>

          {/* ── 메인 맵 면 ── */}
          <g filter="url(#mapDrop)">
            {/* 도 배경면 */}
            <path d={MAINLAND} fill="url(#faceGrad)" />
            <path d={JEJU} fill="url(#faceGrad)" />
            <path d={INCHEON_ISLAND} fill="url(#faceGrad)" />

            {/* 행정구역 오버레이 */}
            {regions.map((region) => {
              const isHov = hoveredRegion === region.id;
              const isCity = ["seoul","incheon","sejong","daejeon","gwangju","daegu","ulsan","busan"].includes(region.id);
              return (
                <g key={region.id}>
                  <path
                    d={region.path}
                    fill={
                      isHov
                        ? "rgba(100,140,210,0.35)"
                        : isCity
                        ? "url(#cityGrad)"
                        : "transparent"
                    }
                    stroke={isHov ? "#4466bb" : "#b8b8b8"}
                    strokeWidth={isHov ? "1.8" : isCity ? "0.8" : "0.8"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-100"
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={(e) => handleRegionClick(e, region)}
                  />
                  {isHov && (
                    <text
                      x={region.labelX}
                      y={region.labelY}
                      textAnchor="middle"
                      fontSize={isCity ? "10" : "12"}
                      fontWeight="700"
                      fill="#1a2a5e"
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
          </g>
        </svg>
      </div>

      {/* ── 클릭 팝업 폼 ── */}
      {clickedRegion && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeForm} />
          <div
            className="absolute bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 w-64"
            style={{
              left: `${(formPos.x / 480) * 100}%`,
              top: `${(formPos.y / 520) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-indigo-700 mb-3">
              {regions.find((r) => r.id === clickedRegion)?.name}
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-0.5">가는 날</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-0.5">오는 날</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-0.5">여행 목적</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>관광</option>
                  <option>휴양</option>
                  <option>미식</option>
                  <option>액티비티</option>
                  <option>쇼핑</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSearch}
                disabled={!startDate || !endDate}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-3 h-3" />
                검색
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
