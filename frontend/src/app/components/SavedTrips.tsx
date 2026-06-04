import { Bookmark, Plane } from "lucide-react";
import { Link } from "react-router";

export function SavedTrips() {
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
          <Bookmark className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          저장된 여행
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          마음에 드는 여행 일정을 보관하고 언제든지 다시 확인하세요.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Plane className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">아직 보관된 일정이 없습니다</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          추천받은 여행 코스 중 마음에 드는 일정을 저장해보세요! (일정 저장은 로그인 후 가능합니다)
        </p>
        
        <Link to="/login" className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md">
          <span>로그인하고 시작하기</span>
        </Link>
      </div>
    </div>
  );
}
