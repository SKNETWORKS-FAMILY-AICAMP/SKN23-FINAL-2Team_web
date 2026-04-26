/*
File    : src/app/components/landing/LandingNav.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 상단 네비게이션바 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-23 (김민정) : FAQ, Q&A 페이지로 이동하는 버튼 추가
    - 2026-04-26 (김민정) : 내비게이션 경로 및 권한별 접근 제어 점검
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

interface LandingNavProps {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ isAuthenticated, user, logout }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0 });
    } else {
      navigate('/');
    }
  };
  return (
    <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
          <span className="w-2 h-8 bg-[#0071e3] group-hover:scale-y-110 transition-transform"></span>
          <span className="text-xl font-bold tracking-tighter text-zinc-100 group-hover:text-[#0071e3] transition-colors">Cadence AI</span>
        </div>

        <div className="hidden md:flex gap-10">
          <a href="#features" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Features</a>
          <a href="#showcase" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Showcase</a>
          <a href="#how-it-works" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">How It Works</a>
          <a href="#pricing" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Pricing</a>
          <button onClick={() => navigate('/inquiries', { state: { tab: 'faq' } })} className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Support</button>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full pl-4 border border-white/5">
              <span className="text-xs font-bold text-zinc-300">{user?.companyName || 'Member'}</span>
              <div className="flex gap-2">
                <div className="relative group/nav">
                  <button
                    onClick={() => navigate((user?.role === 'admin' || user?.role === 'superuser') ? '/admin' : '/profile')}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/nav:opacity-100 -translate-y-2 group-hover/nav:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110] border border-white/10"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45 border-l border-t border-white/10"></div>
                    {(user?.role === 'admin' || user?.role === 'superuser') ? '관리자 페이지' : '마이페이지'}
                  </button>
                  <button
                    onClick={() => navigate((user?.role === 'admin' || user?.role === 'superuser') ? '/admin' : '/profile')}
                    className={`p-2 rounded-full transition-all ${(user?.role === 'admin' || user?.role === 'superuser')
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative group/logout">
                  <button
                    onClick={logout}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/logout:opacity-100 -translate-y-2 group-hover/logout:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110]"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                    Logout
                  </button>
                  <button
                    onClick={logout}
                    className="bg-red-500/10 p-2 rounded-full hover:bg-red-500/20 transition-all group"
                  >
                    <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
              className="bg-[#0071e3] text-white px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
            >
              시작하기
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
