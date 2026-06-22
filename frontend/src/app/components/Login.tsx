import { useState } from "react";
import { useNavigate } from "react-router";
import { Plane, Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("가입 완료! 이메일을 확인해 인증 링크를 클릭하면 로그인됩니다.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        navigate("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-20 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            {isSignUp ? <UserPlus className="w-8 h-8 text-white" /> : <Plane className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isSignUp ? "투웨이트립 시작하기" : "다시 만나서 반가워요!"}
          </h1>
          <p className="text-indigo-100 text-sm">
            {isSignUp
              ? "계정을 만들고 나만의 여행을 저장하세요."
              : "투웨이트립과 함께 나만의 여행을 저장하고 관리하세요."}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}
            {message && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2 shadow-md disabled:opacity-60"
            >
              {loading ? (
                <span>처리 중...</span>
              ) : (
                <>
                  <span>{isSignUp ? "회원가입" : "로그인하기"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              className="font-bold text-indigo-600 hover:text-indigo-500"
            >
              {isSignUp ? "로그인" : "회원가입"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
