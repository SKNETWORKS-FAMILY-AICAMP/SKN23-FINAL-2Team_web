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
    - 2026-04-27 (송주엽) : 라이트 테마 전환
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
    <nav className="fixed top-0 w-full z-[100] border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
          <span className="w-2 h-8 bg-[#0071e3] group-hover:scale-y-110 transition-transform" />
          <span className="text-xl font-bold tracking-tighter text-zinc-900 group-hover:text-[#0071e3] transition-colors">Cadence AI</span>
        </div>

        <div className="hidden md:flex gap-10">
          <a href="#showcase" className="text-zinc-500 font-medium hover:text-zinc-900 transition-colors text-sm uppercase tracking-widest">Showcase</a>
          <a href="#features" className="text-zinc-500 font-medium hover:text-zinc-900 transition-colors text-sm uppercase tracking-widest">Features</a>
          <a href="#how-it-works" className="text-zinc-500 font-medium hover:text-zinc-900 transition-colors text-sm uppercase tracking-widest">How It Works</a>
          <a href="#pricing" className="text-zinc-500 font-medium hover:text-zinc-900 transition-colors text-sm uppercase tracking-widest">Pricing</a>
          <button onClick={() => navigate('/inquiries', { state: { tab: 'faq' } })} className="text-zinc-500 font-medium hover:text-zinc-900 transition-colors text-sm uppercase tracking-widest">Support</button>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-zinc-100 p-1 rounded-full pl-4 border border-zinc-200">
              <span className="text-xs font-bold text-zinc-700">{user?.companyName || 'Member'}</span>
              <div className="flex gap-2">
                <div className="relative group/nav">
                  <button
                    onClick={() => navigate((user?.role === 'admin' || user?.role === 'superuser') ? '/admin' : '/profile')}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/nav:opacity-100 -translate-y-2 group-hover/nav:translate-y-0 transition-all duration-300 whitespace-nowrap z-[110] border border-zinc-700"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45 border-l border-t border-zinc-700" />
                    {(user?.role === 'admin' || user?.role === 'superuser') ? '관리자 페이지' : '마이페이지'}
                  </button>
                  <button
                    onClick={() => navigate((user?.role === 'admin' || user?.role === 'superuser') ? '/admin' : '/profile')}
                    className="p-2 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition-all"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative group/logout">
                  <button
                    onClick={logout}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/logout:opacity-100 -translate-y-2 group-hover/logout:translate-y-0 transition-all duration-300 whitespace-nowrap z-[110]"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45" />
                    Logout
                  </button>
                  <button
                    onClick={logout}
                    className="bg-red-50 p-2 rounded-full hover:bg-red-100 transition-all group"
                  >
                    <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2"
              >
                로그인
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))}
                className="bg-zinc-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-zinc-800 transition-all text-sm"
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
