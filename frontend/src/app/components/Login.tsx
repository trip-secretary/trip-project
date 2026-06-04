import { useState } from "react";
import { Link } from "react-router";
import { Plane, Mail, Lock, ArrowRight } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 로그인 로직 (Mock)
    alert("테스트 환경이므로 로그인 로직이 생략되었습니다.");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-20 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">다시 만나서 반가워요!</h1>
          <p className="text-indigo-100 text-sm">투웨이트립과 함께 나만의 여행을 저장하고 관리하세요.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2 shadow-md"
            >
              <span>로그인하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute border-t border-slate-200 w-full"></div>
            <span className="relative bg-white px-4 text-xs font-medium text-slate-500">간편 로그인</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700 text-sm">
              Google
            </button>
            <button className="flex items-center justify-center py-2.5 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black/85 rounded-xl transition-colors font-medium text-sm">
              카카오 로그인
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            아직 계정이 없으신가요?{" "}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
