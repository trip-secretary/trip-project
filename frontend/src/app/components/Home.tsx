import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Calendar, CreditCard, Search, Target } from "lucide-react";
import { KoreaMap } from "./KoreaMap";

export function Home() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purposes, setPurposes] = useState<string[]>(["관광"]);

  const purposeOptions = [
    { value: "관광", label: "관광 & 명소 투어" },
    { value: "휴양", label: "휴식 & 힐링" },
    { value: "미식", label: "맛집 탐방 (미식)" },
    { value: "액티비티", label: "스포츠 & 액티비티" },
    { value: "쇼핑", label: "쇼핑" }
  ];

  const togglePurpose = (value: string) => {
    if (purposes.includes(value)) {
      if (purposes.length > 1) {
        setPurposes(purposes.filter(p => p !== value));
      }
    } else {
      setPurposes([...purposes, value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate || purposes.length === 0) return;

    navigate(`/results?dest=${encodeURIComponent(destination)}&start=${startDate}&end=${endDate}&purpose=${encodeURIComponent(purposes.join(','))}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative w-full h-[700px] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <img
          src="https://images.unsplash.com/photo-1606388701602-2e3727da5b28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjB2YWNhdGlvbiUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3NzgzOTUxMDR8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Travel Landscape"
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />

        <div className="relative z-30 max-w-4xl w-full px-4 text-center mt-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
            하나의 여행지, <span className="text-indigo-300">두 개의 다른 이야기</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-100 mb-10 max-w-2xl mx-auto drop-shadow">
            어디로, 언제 떠나시나요? 당신의 취향에 맞춘 완전히 다른 두 가지의 맞춤형 여행 경로를 추천해 드립니다.
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl flex flex-col gap-4 mx-auto max-w-5xl px-[24px] py-[50px]">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="w-full text-left">
                <label className="block text-sm font-medium text-slate-700 mb-1">어디로 떠나시나요?</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="예: 서울, 부산, 천안"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="w-full text-left">
                <label className="block text-sm font-medium text-slate-700 mb-1">가는 날</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="w-full text-left">
                <label className="block text-sm font-medium text-slate-700 mb-1">오는 날</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="w-full text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-600" />
                여행 목적 (복수 선택 가능)
              </label>
              <div className="flex flex-wrap gap-3">
                {purposeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
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

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>경로 찾기</span>
            </button>
          </form>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-20 w-full">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">국내 어디로 떠나시나요?</h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          지도에서 원하시는 지역을 확인해보세요. 마우스를 올리면 지역명이 표시됩니다.
        </p>
        <KoreaMap />
      </div>
    </div>
  );
}
