import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import {
  Loader2, MapPin, Calendar as CalendarIcon, Coffee, Camera,
  Compass, Utensils, Moon, CheckCircle2, Plus, X, Sparkles,
  Sun, CloudRain, Cloud, AlertCircle, Bookmark, IndianRupee,
  Clock, Home
} from "lucide-react";
import TravelMap from "./TravelMap";
import { generateItinerary, type PlanResult, type ItineraryItem, type DayPlan, type DayWeather } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

// ---------- 로딩 화면 ----------
const LOADING_STEPS = [
  { text: "날씨 정보를 가져오는 중...", icon: "🌤️" },
  { text: "실외 중심 Plan A 설계 중...", icon: "☀️" },
  { text: "실내 중심 Plan B 설계 중...", icon: "🌧️" },
  { text: "혼합 Plan C 설계 중...", icon: "⛅" },
  { text: "동선 최적화 중...", icon: "🗺️" },
  { text: "거의 다 됐어요!", icon: "✨" },
];

function LoadingScreen({ dest }: { dest: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-4xl animate-bounce">
          {LOADING_STEPS[step].icon}
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 w-7 h-7 text-indigo-500 animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        <span className="text-indigo-600">{dest}</span> 여행 일정 생성 중
      </h2>
      <p className="text-slate-500 mb-6 transition-all duration-500">{LOADING_STEPS[step].text}</p>
      <div className="flex gap-1.5 mb-8">
        {LOADING_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-indigo-500 w-6" : "bg-slate-200 w-3"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-400">AI가 A·B·C 세 가지 플랜을 동시에 구성합니다 · 약 20~30초 소요</p>
    </div>
  );
}

function getCategoryIcon(category: string, isIndoor: boolean) {
  if (category === "food") return <Utensils className="w-4 h-4" />;
  if (category === "rest") return <Moon className="w-4 h-4" />;
  if (isIndoor) return <Home className="w-4 h-4" />;
  return <Compass className="w-4 h-4" />;
}

const PLAN_CONFIG = {
  A: {
    label: "Plan A", badge: "☀️ 실외 중심", color: "blue",
    bgHeader: "bg-blue-50", textTitle: "text-blue-900", badgeBg: "bg-blue-600",
    border: "border-blue-200", ring: "ring-blue-400",
    tab: "bg-blue-600 text-white", tabInactive: "text-blue-600 border-blue-200 hover:bg-blue-50",
    icon: <Sun className="w-4 h-4" />,
  },
  B: {
    label: "Plan B", badge: "🌧️ 실내 중심", color: "emerald",
    bgHeader: "bg-emerald-50", textTitle: "text-emerald-900", badgeBg: "bg-emerald-600",
    border: "border-emerald-200", ring: "ring-emerald-400",
    tab: "bg-emerald-600 text-white", tabInactive: "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
    icon: <CloudRain className="w-4 h-4" />,
  },
  C: {
    label: "Plan C", badge: "🌤️ 실내+실외 혼합", color: "amber",
    bgHeader: "bg-amber-50", textTitle: "text-amber-900", badgeBg: "bg-amber-500",
    border: "border-amber-200", ring: "ring-amber-400",
    tab: "bg-amber-500 text-white", tabInactive: "text-amber-600 border-amber-200 hover:bg-amber-50",
    icon: <Cloud className="w-4 h-4" />,
  },
} as const;

type PlanType = keyof typeof PLAN_CONFIG;

function makeItemId(planType: string, day: number, time: string) {
  return `${planType}-day${day}-${time}`;
}

export function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const dest = searchParams.get("dest") || "어딘가";
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const purposeParam = searchParams.get("purpose") || "관광";
  const purposes = purposeParam.split(",");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherSummary, setWeatherSummary] = useState("");
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DayWeather>>({});
  const [plans, setPlans] = useState<PlanResult[]>([]);
  const [activeTab, setActiveTab] = useState<PlanType>("A");
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const purposeOptions = [
    { value: "관광", label: "관광 & 명소 투어" },
    { value: "휴양", label: "휴식 & 힐링" },
    { value: "미식", label: "맛집 탐방" },
    { value: "액티비티", label: "스포츠 & 액티비티" },
    { value: "쇼핑", label: "쇼핑" },
  ];

  const togglePurpose = (value: string) => {
    let next: string[];
    if (purposes.includes(value)) {
      if (purposes.length <= 1) return;
      next = purposes.filter((p) => p !== value);
    } else {
      next = [...purposes, value];
    }
    navigate(`/results?dest=${encodeURIComponent(dest)}&start=${start}&end=${end}&purpose=${encodeURIComponent(next.join(","))}`);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPlans([]);
    setCustomItems([]);

    generateItinerary({ destination: dest, start_date: start, end_date: end, purposes })
      .then((data) => {
        setWeatherSummary(data.weather_summary);
        setWeatherByDate(data.weather_by_date ?? {});
        setPlans(data.plans);
        if (data.plans.length > 0) setActiveTab(data.plans[0].plan_type as PlanType);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [dest, start, end, purposeParam]);

  const toggleCustomItem = (item: ItineraryItem, planType: string, day: number) => {
    const id = makeItemId(planType, day, item.time);
    const withId = { ...item, id, planType, day };
    setCustomItems((prev) =>
      prev.some((i) => i.id === id) ? prev.filter((i) => i.id !== id) : [...prev, withId]
    );
  };

  const isSelected = (item: ItineraryItem, planType: string, day: number) =>
    customItems.some((i) => i.id === makeItemId(planType, day, item.time));

  const sortedCustom = [...customItems].sort((a, b) =>
    a.day !== b.day ? a.day - b.day : a.time.localeCompare(b.time)
  );

  const saveTripToSupabase = async (planType: string, title: string, days: DayPlan[], estimatedCost?: number) => {
    if (!user) { navigate("/login"); return; }
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      destination: dest,
      start_date: start,
      end_date: end,
      theme_id: planType,
      theme_title: title,
      plan_data: { days, estimated_cost: estimatedCost },
    });
    setSaveMsg(error ? "저장에 실패했습니다." : "저장 완료!");
    setSaving(false);
  };

  const handleSavePlan = (plan: PlanResult) => {
    saveTripToSupabase(plan.plan_type, plan.title, plan.days, plan.estimated_cost);
  };

  const handleSaveCustom = () => {
    if (sortedCustom.length === 0) return;
    const dayMap: Record<number, any[]> = {};
    sortedCustom.forEach((item) => {
      if (!dayMap[item.day]) dayMap[item.day] = [];
      dayMap[item.day].push(item);
    });
    const days: DayPlan[] = Object.entries(dayMap).map(([day, items]) => ({
      day: Number(day),
      date: plans[0]?.days[Number(day) - 1]?.date ?? start,
      items: items.map(({ id, planType, day: _d, ...rest }) => rest),
    }));
    saveTripToSupabase("custom", `${dest} 나만의 맞춤 일정`, days,
      sortedCustom.reduce((s, i) => s + (i.estimated_cost ?? 0), 0));
  };

  if (loading) return <LoadingScreen dest={dest} />;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">일정 생성에 실패했습니다</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          다시 검색하기
        </Link>
      </div>
    );
  }

  const activePlan = plans.find((p) => p.plan_type === activeTab);
  const cfg = PLAN_CONFIG[activeTab];

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 mb-12">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            <span className="text-indigo-600">{dest}</span> 여행 일정 추천
          </h1>
          {weatherSummary && <p className="text-sm text-slate-500 mb-2">🌤 {weatherSummary}</p>}
          <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
              <CalendarIcon className="w-4 h-4" /><span>{start} ~ {end}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
              <MapPin className="w-4 h-4" /><span>{dest}</span>
            </div>
          </div>
        </div>
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap text-center">
          다시 검색하기
        </Link>
      </div>

      <div className="mb-6 bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <p className="text-sm font-bold text-slate-700 mb-3">여행 목적 (변경 시 재생성)</p>
        <div className="flex flex-wrap gap-2">
          {purposeOptions.map((opt) => (
            <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
              purposes.includes(opt.value)
                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                : "bg-white border-slate-300 text-slate-700 hover:border-indigo-300"
            }`}>
              <input type="checkbox" checked={purposes.includes(opt.value)} onChange={() => togglePurpose(opt.value)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {plans.map((plan) => {
          const c = PLAN_CONFIG[plan.plan_type as PlanType];
          const isActive = activeTab === plan.plan_type;
          return (
            <button key={plan.plan_type} onClick={() => setActiveTab(plan.plan_type as PlanType)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 flex-1 justify-center ${
                isActive ? c.tab + " shadow-md border-transparent" : "bg-white " + c.tabInactive
              }`}
            >
              {c.icon}<span>{c.label}</span>
              <span className="hidden sm:inline text-xs opacity-75">({plan.theme})</span>
            </button>
          );
        })}
      </div>

      {activePlan && (
        <div className={`bg-white rounded-3xl overflow-hidden border-2 ${cfg.border} shadow-sm`}>
          <div className={`p-6 md:p-8 ${cfg.bgHeader} border-b border-slate-100`}>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${cfg.badgeBg} text-white`}>
              {cfg.icon}{cfg.badge}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">{activePlan.title}</h2>
            <p className={`${cfg.textTitle} opacity-90 leading-relaxed font-medium text-sm mb-4`}>{activePlan.description}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${cfg.badgeBg} text-white`}>예상 경비</span>
              <span className="text-lg font-bold text-slate-800">
                약 {activePlan.estimated_cost.toLocaleString()}원
                <span className="text-sm font-normal text-slate-500"> / 1인 기준</span>
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50">
            <div className="mb-8 rounded-2xl border border-slate-200">
              <TravelMap
                spots={activePlan.days[0]?.items
                  .filter((i) => i.lat && i.lng)
                  .map((item, idx) => ({ id: idx, name: item.place_name || item.title, lat: item.lat!, lng: item.lng! }))}
              />
            </div>

            <div className="space-y-10">
              {activePlan.days.map((dayPlan) => (
                <div key={dayPlan.day}>
                  <h3 className="font-bold text-slate-800 text-xl mb-5 flex items-center gap-3 flex-wrap">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm ${cfg.badgeBg}`}>{dayPlan.day}</span>
                    <span>Day {dayPlan.day}</span>
                    <span className="text-sm font-normal text-slate-500">{dayPlan.date}</span>
                    {weatherByDate[dayPlan.date] && (() => {
                      const w = weatherByDate[dayPlan.date];
                      const tempStr = w.min_temp != null && w.max_temp != null ? ` ${w.min_temp}°~${w.max_temp}°` : "";
                      return (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${w.is_bad_weather ? "bg-blue-100 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                          {w.emoji} {w.sky}{tempStr}
                        </span>
                      );
                    })()}
                  </h3>
                  <div className="space-y-4 pl-4 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200">
                    {dayPlan.items.map((item, idx) => {
                      const sel = isSelected(item, activePlan.plan_type, dayPlan.day);
                      return (
                        <div key={idx} className="relative pl-8 flex gap-4 group">
                          <div className={`absolute left-[-5px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 ${cfg.badgeBg} z-10 shadow-sm`} />
                          <div className="text-sm font-bold text-slate-500 w-12 shrink-0 pt-1">{item.time}</div>
                          <div className={`bg-white p-4 rounded-xl border shadow-sm flex-1 flex items-start gap-3 transition-all ${
                            sel ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-100 group-hover:border-indigo-200 group-hover:shadow-md"
                          }`}>
                            <div className={`p-2.5 rounded-lg shrink-0 ${item.category === "food" ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}>
                              {getCategoryIcon(item.category, item.is_indoor)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800">{item.title}</p>
                              {item.place_name && item.place_name !== item.title && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.place_name}</p>
                              )}
                              {item.notes && <p className="text-xs text-slate-400 mt-1">{item.notes}</p>}
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                {item.duration_minutes && (
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration_minutes}분</span>
                                )}
                                {item.estimated_cost != null && item.estimated_cost > 0 && (
                                  <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{item.estimated_cost.toLocaleString()}원</span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.is_indoor ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                  {item.is_indoor ? "실내" : "실외"}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => toggleCustomItem(item, activePlan.plan_type, dayPlan.day)}
                              className={`shrink-0 p-2 rounded-lg transition-all ${sel ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600"}`}
                            >
                              {sel ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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

          <div className="p-6 bg-white border-t border-slate-100 space-y-3">
            {saveMsg && (
              <p className={`text-sm text-center font-medium ${saveMsg.includes("완료") ? "text-green-600" : "text-red-500"}`}>{saveMsg}</p>
            )}
            <button onClick={() => handleSavePlan(activePlan)} disabled={saving}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm text-white ${cfg.badgeBg} hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              <Bookmark className="w-5 h-5" />
              {saving ? "저장 중..." : "이 일정 저장하기"}
            </button>
          </div>
        </div>
      )}

      {customItems.length > 0 && (
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">나만의 맞춤 경로</h2>
                <p className="text-sm text-slate-600">
                  {Array.from(new Set(sortedCustom.map((i) => i.planType))).map((t) => `Plan ${t}`).join(" + ")}에서 선택한 {customItems.length}개 장소
                </p>
              </div>
            </div>
            <button onClick={() => setCustomItems([])} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-white rounded-lg transition-colors">
              전체 초기화
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-6 rounded-xl border border-slate-200">
              <TravelMap
                spots={sortedCustom.filter((i) => i.lat && i.lng)
                  .map((item, idx) => ({ id: idx, name: item.place_name || item.title, lat: item.lat, lng: item.lng }))}
              />
            </div>
            <div className="space-y-8">
              {Array.from(new Set(sortedCustom.map((i) => i.day))).map((day) => {
                const dayItems = sortedCustom.filter((i) => i.day === day);
                return (
                  <div key={day}>
                    <h3 className="font-bold text-slate-800 text-xl mb-5 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-indigo-600 shadow-sm">{day}</span>
                      <span>Day {day}</span>
                    </h3>
                    <div className="space-y-4 pl-4 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200">
                      {dayItems.map((item: any) => (
                        <div key={item.id} className="relative pl-8 flex gap-4 group">
                          <div className="absolute left-[-5px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 z-10 shadow-sm" />
                          <div className="text-sm font-bold text-slate-500 w-12 shrink-0 pt-1">{item.time}</div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex items-start gap-3 group-hover:border-indigo-300 transition-all">
                            <div className={`p-2.5 rounded-lg shrink-0 ${item.category === "food" ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}>
                              {getCategoryIcon(item.category, item.is_indoor)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-700">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Plan {item.planType}에서 선택 · {item.place_name}</p>
                            </div>
                            <button onClick={() => toggleCustomItem(item, item.planType, item.day)}
                              className="shrink-0 p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
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
              {saveMsg && (
                <p className={`text-sm text-center font-medium mb-3 ${saveMsg.includes("완료") ? "text-green-600" : "text-red-500"}`}>{saveMsg}</p>
              )}
              <button onClick={handleSaveCustom} disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Sparkles className="w-5 h-5" />
                {saving ? "저장 중..." : "나만의 맞춤 경로 저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
