import { Receipt, Plus, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function DutchPay() {
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
          <Receipt className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          복잡한 여행 경비, <span className="text-indigo-600">간편하게 정산하세요</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          일행과 함께한 여행의 모든 지출 내역을 기록하고, 버튼 한 번으로 깔끔하게 더치페이 금액을 나눌 수 있습니다.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">아직 정산 중인 여행이 없습니다</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          새로운 정산 그룹을 만들고 일행을 초대하여 손쉽게 경비를 관리해보세요.
        </p>
        
        <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-md">
          <Plus className="w-5 h-5" />
          <span>새 정산 그룹 만들기</span>
        </button>

        <div className="mt-8 pt-8 border-t border-slate-100 w-full text-center">
          <p className="text-sm text-slate-500 mb-3">더치페이 내역을 저장하고 언제든 확인하려면?</p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:text-indigo-700">
            <span>로그인 하러가기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
