import { useEffect, useState } from "react";
import { Bookmark, Plane, MapPin, Calendar, Trash2, Loader2, ChevronDown, ChevronUp, Clock, Coins } from "lucide-react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface SavedTrip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  theme_id: string;
  theme_title: string;
  plan_data: any;
  created_at: string;
}

function planBadge(themeId: string) {
  if (themeId === "A") return { label: "Plan A ☀️", cls: "bg-blue-600" };
  if (themeId === "B") return { label: "Plan B 🌧️", cls: "bg-emerald-600" };
  if (themeId === "C") return { label: "Plan C 🌤️", cls: "bg-amber-500" };
  if (themeId === "custom") return { label: "나만의 경로 ✨", cls: "bg-indigo-600" };
  return { label: themeId, cls: "bg-slate-500" };
}

export function SavedTrips() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_trips")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTrips(data);
    setLoading(false);
  };

  const deleteTrip = async (id: string) => {
    await supabase.from("saved_trips").delete().eq("id", id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
            <Bookmark className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">저장된 여행</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            마음에 드는 여행 일정을 보관하고 언제든지 다시 확인하세요.
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Plane className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">로그인이 필요합니다</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">저장된 여행 일정을 보려면 로그인해주세요.</p>
          <Link to="/login" className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md">
            로그인하고 시작하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
          <Bookmark className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">저장된 여행</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">마음에 드는 여행 일정을 보관하고 언제든지 다시 확인하세요.</p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Plane className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">아직 보관된 일정이 없습니다</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">추천받은 여행 코스 중 마음에 드는 일정을 저장해보세요!</p>
          <Link to="/" className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md">
            여행 검색하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const badge = planBadge(trip.theme_id);
            const isOpen = expandedId === trip.id;
            const days: any[] = trip.plan_data?.days ?? [];
            const cost: number | undefined = trip.plan_data?.estimated_cost;

            return (
              <div key={trip.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* 헤더 — 클릭하면 토글 */}
                <div
                  className="flex items-center gap-4 p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(trip.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 truncate">{trip.theme_title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.destination}</span>
                      {trip.start_date && trip.end_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{trip.start_date} ~ {trip.end_date}</span>
                      )}
                      {cost != null && (
                        <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" />약 {cost.toLocaleString()}원</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 펼쳐지는 일정 상세 */}
                {isOpen && days.length > 0 && (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-6">
                    {days.map((day: any) => (
                      <div key={day.day}>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{day.day}</span>
                          Day {day.day}
                          <span className="text-sm font-normal text-slate-400">{day.date}</span>
                        </h4>
                        <div className="space-y-2 pl-3 border-l-2 border-slate-100">
                          {day.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-3 items-start py-1.5">
                              <span className="text-xs font-bold text-slate-400 w-10 shrink-0 pt-0.5">{item.time}</span>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                                {item.place_name && item.place_name !== item.title && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />{item.place_name}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-0.5 text-xs text-slate-400">
                                  {item.duration_minutes && (
                                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.duration_minutes}분</span>
                                  )}
                                  {item.estimated_cost > 0 && (
                                    <span>{item.estimated_cost.toLocaleString()}원</span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.is_indoor ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                                    {item.is_indoor ? "실내" : "실외"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && days.length === 0 && (
                  <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-400 text-center">
                    일정 상세 정보가 없습니다.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
