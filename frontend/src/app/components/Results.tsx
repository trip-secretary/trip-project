import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { Loader2, MapPin, Calendar as CalendarIcon, Clock, Coffee, Camera, Compass, Utensils, Moon, CheckCircle2, Target, Plus, X, Sparkles } from "lucide-react";
import TravelMap from "./TravelMap";

// Mock data generator
const generateMockItineraries = (dest: string, days: number, purposes: string[]) => {
  const themes = [
    {
      id: "theme1",
      title: purposes.includes("미식") ? "🔥 로컬 맛집 & 핫플 탐험" : "🔥 열정의 액티비티 & 핫플 탐험",
      description: `에너지가 넘치는 당신을 위한 완벽한 코스. ${dest}의 유명 명소와 숨겨진 핫플레이스를 부지런히 돌아다니며 알차게 보내는 일정입니다.`,
      color: "blue",
      estimatedCost: 850000
    },
    {
      id: "theme2",
      title: purposes.includes("휴양") ? "🍃 완벽한 프라이빗 휴식" : "🍃 여유로운 힐링 & 미식 여행",
      description: `바쁜 일상에서 벗어나 온전한 휴식을 원하는 당신. ${dest}의 아름다운 풍경을 감상하며 여유롭게 커피 한 잔과 미식을 즐기는 일정입니다.`,
      color: "emerald",
      estimatedCost: 1200000
    }
  ];

  const activities = [
    { time: "09:00", icon: <Coffee className="w-4 h-4" />, title: "현지 감성 카페에서 조식", type: "food", lat: 37.5800, lng: 126.9800 },
    { time: "11:00", icon: <Camera className="w-4 h-4" />, title: "랜드마크 인증샷 투어", type: "activity", lat: 37.5820, lng: 126.9850 },
    { time: "13:00", icon: <Utensils className="w-4 h-4" />, title: "로컬 맛집에서 점심 식사", type: "food", lat: 37.5750, lng: 126.9820 },
    { time: "15:00", icon: <Compass className="w-4 h-4" />, title: "유명 명소/테마파크 관람", type: "activity", lat: 37.5600, lng: 126.9900 },
    { time: "19:00", icon: <Moon className="w-4 h-4" />, title: "야경 명소 산책 및 저녁 식사", type: "activity", lat: 37.5500, lng: 126.9800 },
  ];

  const healingActivities = [
    { time: "10:30", icon: <Coffee className="w-4 h-4" />, title: "늦잠 후 여유로운 브런치", type: "food", lat: 37.5500, lng: 126.9700 },
    { time: "13:00", icon: <Compass className="w-4 h-4" />, title: "해변이나 공원에서 산책", type: "activity", lat: 37.5450, lng: 126.9750 },
    { time: "15:30", icon: <Coffee className="w-4 h-4" />, title: "경치 좋은 디저트 카페", type: "food", lat: 37.5400, lng: 126.9800 },
    { time: "18:00", icon: <Moon className="w-4 h-4" />, title: "고급 레스토랑에서 저녁 만찬", type: "food", lat: 37.5350, lng: 126.9900 },
    { time: "20:30", icon: <Moon className="w-4 h-4" />, title: "숙소에서 스파 및 휴식", type: "activity", lat: 37.5300, lng: 126.9950 },
  ];

  return themes.map(theme => ({
    ...theme,
    days: Array.from({ length: days }).map((_, i) => ({
      day: i + 1,
      items: theme.id === "theme1" ? activities : healingActivities
    }))
  }));
};

export function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dest = searchParams.get("dest") || "어딘가";
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const purposeParam = searchParams.get("purpose") || "관광";
  const purposes = purposeParam.split(',');
  
  const [loading, setLoading] = useState(true);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<any[]>([]);

  const purposeOptions = [
    { value: "관광", label: "관광 & 명소 투어" },
    { value: "휴양", label: "휴식 & 힐링" },
    { value: "미식", label: "맛집 탐방 (미식)" },
    { value: "액티비티", label: "스포츠 & 액티비티" },
    { value: "쇼핑", label: "쇼핑" }
  ];

  const togglePurpose = (value: string) => {
    let newPurposes: string[];
    if (purposes.includes(value)) {
      if (purposes.length > 1) {
        newPurposes = purposes.filter(p => p !== value);
      } else {
        return;
      }
    } else {
      newPurposes = [...purposes, value];
    }
    navigate(`/results?dest=${encodeURIComponent(dest)}&start=${start}&end=${end}&purpose=${encodeURIComponent(newPurposes.join(','))}`);
  };

  const toggleCustomItem = (item: any, themeId: string, day: number) => {
    const itemId = `${themeId}-day${day}-${item.time}`;
    const itemWithId = { ...item, id: itemId, themeId, day };

    const isAlreadySelected = customItems.some(i => i.id === itemId);
    if (isAlreadySelected) {
      setCustomItems(customItems.filter(i => i.id !== itemId));
    } else {
      setCustomItems([...customItems, itemWithId]);
    }
  };

  const isItemSelected = (item: any, themeId: string, day: number) => {
    const itemId = `${themeId}-day${day}-${item.time}`;
    return customItems.some(i => i.id === itemId);
  };

  const sortedCustomItems = [...customItems].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.time.localeCompare(b.time);
  });

  useEffect(() => {
    // Simulate API call to LLM
    const timer = setTimeout(() => {
      let days = 3;
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        // Cap max days for UI sake
        if (days > 7) days = 7;
      }
      setItineraries(generateMockItineraries(dest, days, purposes));
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [dest, start, end, purposeParam]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-[calc(100vh-64px)]">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-8" />
        <h2 className="text-3xl font-bold text-slate-800 mb-4">완벽한 여행 경로를 고민 중입니다...</h2>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          {dest}에서의 특별한 경험을 위해 완전히 다른 두 가지 테마의 일정을 생성하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 mb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            <span className="text-indigo-600">{dest}</span> 여행을 위한 두 가지 제안
          </h1>
          <p className="text-sm text-slate-600 mb-3">각 경로에서 원하는 장소를 선택하여 나만의 맞춤 경로를 만들어보세요!</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>{start} ~ {end} ({itineraries[0]?.days.length}일)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
              <MapPin className="w-4 h-4" />
              <span>{dest}</span>
            </div>
          </div>
        </div>
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 px-5 py-2.5 rounded-xl transition-colors inline-block text-center whitespace-nowrap">
          다시 검색하기
        </Link>
      </div>

      <div className="mb-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-900">여행 목적</h3>
          <span className="text-xs text-slate-500">(변경 가능)</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {purposeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                purposes.includes(option.value)
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-300'
              }`}
            >
              <input
                type="checkbox"
                checked={purposes.includes(option.value)}
                onChange={() => togglePurpose(option.value)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {itineraries.map((itinerary) => {
          const isSelected = selectedItinerary === itinerary.id;
          const colorClass = itinerary.color === 'blue' 
            ? 'border-blue-200 hover:border-blue-400 focus:ring-blue-500' 
            : 'border-emerald-200 hover:border-emerald-400 focus:ring-emerald-500';
          
          const bgHeader = itinerary.color === 'blue' ? 'bg-blue-50' : 'bg-emerald-50';
          const textTitle = itinerary.color === 'blue' ? 'text-blue-900' : 'text-emerald-900';
          const badgeBg = itinerary.color === 'blue' ? 'bg-blue-600' : 'bg-emerald-600';

          return (
            <div
              key={itinerary.id}
              className={`bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl ${colorClass} ${isSelected ? 'ring-2 ring-offset-2 scale-[1.02] shadow-xl' : 'border-slate-200'}`}
            >
              <div className={`p-6 md:p-8 ${bgHeader} border-b border-slate-100 flex-none relative`}>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                    <CheckCircle2 className={`w-8 h-8 ${itinerary.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`} />
                  </div>
                )}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${badgeBg}`}>
                  추천 경로 {itinerary.id === "theme1" ? "A" : "B"}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">{itinerary.title}</h2>
                <p className={`${textTitle} opacity-90 leading-relaxed font-medium text-[15px] mb-4`}>{itinerary.description}</p>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${badgeBg} text-white`}>예상 경비</div>
                  <div className="text-lg font-bold text-slate-800">
                    약 {itinerary.estimatedCost.toLocaleString()}원 <span className="text-sm font-normal text-slate-500">/ 1인 기준</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 flex-1 overflow-y-auto max-h-[500px]">
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 relative group bg-slate-200 shadow-inner h-64">
                  <TravelMap spots={itinerary.days[0].items.map((item: any, idx: number) => ({ id: idx, name: item.title, lat: item.lat, lng: item.lng }))} />
                  <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <MapPin className={`w-3.5 h-3.5 ${itinerary.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`} /> {itinerary.id === "theme1" ? "액티비티 추천 동선" : "힐링 추천 동선"}
                  </div>
                </div>

                <div className="space-y-10">
                  {itinerary.days.map((dayPlan: any) => (
                    <div key={`day-${dayPlan.day}`}>
                      <h3 className="font-bold text-slate-800 text-xl mb-5 flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm ${badgeBg}`}>
                          {dayPlan.day}
                        </span>
                        <span>Day {dayPlan.day}</span>
                      </h3>
                      
                      <div className="space-y-5 pl-4 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200">
                        {dayPlan.items.map((item: any, idx: number) => {
                          const isSelected = isItemSelected(item, itinerary.id, dayPlan.day);
                          return (
                            <div key={idx} className="relative pl-8 flex gap-4 group">
                              <div className={`absolute left-[-5px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 ${badgeBg} z-10 shadow-sm`} />
                              <div className="text-sm font-bold text-slate-500 w-12 shrink-0 pt-1">{item.time}</div>
                              <div className={`bg-white p-4 rounded-xl border shadow-sm flex-1 flex items-start gap-3 transition-all ${
                                isSelected
                                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                                  : 'border-slate-100 group-hover:border-indigo-200 group-hover:shadow-md'
                              }`}>
                                <div className={`p-2.5 rounded-lg shrink-0 ${item.type === 'food' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                  {item.icon}
                                </div>
                                <p className="font-medium text-slate-700 mt-1.5 flex-1">{item.title}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCustomItem(item, itinerary.id, dayPlan.day);
                                  }}
                                  className={`shrink-0 p-2 rounded-lg transition-all ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                                  }`}
                                  title={isSelected ? "나만의 경로에서 제거" : "나만의 경로에 추가"}
                                >
                                  {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-white border-t border-slate-100 text-center flex-none space-y-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const allItems = itinerary.days.flatMap((day: any) =>
                      day.items.map((item: any) => ({ ...item, themeId: itinerary.id, day: day.day, id: `${itinerary.id}-day${day.day}-${item.time}` }))
                    );
                    const allSelected = allItems.every((item: any) => customItems.some(i => i.id === item.id));
                    if (allSelected) {
                      setCustomItems(customItems.filter(i => !allItems.some((item: any) => item.id === i.id)));
                    } else {
                      const newItems = allItems.filter((item: any) => !customItems.some(i => i.id === item.id));
                      setCustomItems([...customItems, ...newItems]);
                    }
                  }}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm ${badgeBg} text-white hover:opacity-90`}
                >
                  {itinerary.days.flatMap((day: any) => day.items).every((item: any) =>
                    isItemSelected(item, itinerary.id, itinerary.days.find((d: any) => d.items.includes(item)).day)
                  ) ? "이 경로 전체 해제" : "이 경로 전체 선택"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItinerary(itinerary.id);
                    alert("일정을 저장하려면 로그인이 필요합니다.");
                  }}
                  className="w-full py-3 rounded-xl font-medium text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  이 일정 그대로 저장하기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {customItems.length > 0 && (
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">나만의 맞춤 경로</h2>
                <p className="text-sm text-slate-600">Plan A와 Plan B에서 선택한 {customItems.length}개의 장소</p>
              </div>
            </div>
            <button
              onClick={() => setCustomItems([])}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-white rounded-lg transition-colors"
            >
              전체 초기화
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-200 shadow-inner h-64">
              <TravelMap spots={sortedCustomItems.map((item: any, idx: number) => ({ id: idx, name: item.title, lat: item.lat, lng: item.lng }))} />
              <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> 나만의 맞춤 동선
              </div>
            </div>

            <div className="space-y-8">
              {Array.from(new Set(sortedCustomItems.map(item => item.day))).map(day => {
                const dayItems = sortedCustomItems.filter(item => item.day === day);
                return (
                  <div key={day}>
                    <h3 className="font-bold text-slate-800 text-xl mb-5 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-indigo-600 shadow-sm">
                        {day}
                      </span>
                      <span>Day {day}</span>
                    </h3>

                    <div className="space-y-4 pl-4 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200">
                      {dayItems.map((item: any) => (
                        <div key={item.id} className="relative pl-8 flex gap-4 group">
                          <div className="absolute left-[-5px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 z-10 shadow-sm" />
                          <div className="text-sm font-bold text-slate-500 w-12 shrink-0 pt-1">{item.time}</div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex items-start gap-3 group-hover:border-indigo-300 transition-all">
                            <div className={`p-2.5 rounded-lg shrink-0 ${item.type === 'food' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 mt-1">
                              <p className="font-medium text-slate-700">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {item.themeId === 'theme1' ? 'Plan A' : 'Plan B'}에서 선택
                              </p>
                            </div>
                            <button
                              onClick={() => toggleCustomItem(item, item.themeId, item.day)}
                              className="shrink-0 p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                              title="제거"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => alert("일정을 저장하려면 로그인이 필요합니다.")}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                나만의 맞춤 경로 저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
