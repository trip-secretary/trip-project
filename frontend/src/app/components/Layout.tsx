import { Outlet, Link, useNavigate } from "react-router";
import { Plane, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Plane className="w-6 h-6" />
            <span>투웨이트립 (TwoWayTrip)</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/saved-trips" className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors hidden sm:block">
              저장된 여행
            </Link>
            <Link to="/dutch-pay" className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors">
              더치페이
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block truncate max-w-[120px]">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Plane className="w-5 h-5" />
            <span>투웨이트립</span>
          </div>
          <p>© 2026 TwoWayTrip. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
