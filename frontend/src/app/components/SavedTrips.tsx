import { useEffect, useState } from "react";
import { Bookmark, Plane, MapPin, Calendar, Trash2, Loader2 } from "lucide-react";
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

export function SavedTrips() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
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
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            저장된 여행 일정을 보려면 로그인해주세요.
          </p>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md"
          >
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
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          마음에 드는 여행 일정을 보관하고 언제든지 다시 확인하세요.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Plane className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">아직 보관된 일정이 없습니다</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            추천받은 여행 코스 중 마음에 드는 일정을 저장해보세요!
          </p>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md"
          >
            여행 검색하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${trip.theme_id === "theme1" ? "bg-blue-600" : "bg-emerald-600"}`}>
                    {trip.theme_id === "theme1" ? "Plan A" : trip.theme_id === "theme2" ? "Plan B" : "나만의 경로"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{trip.theme_title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {trip.destination}
                  </span>
                  {trip.start_date && trip.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {trip.start_date} ~ {trip.end_date}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTrip(trip.id)}
                className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
