/*
File    : src/app/components/landing/LandingNav.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 상단 네비게이션바 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
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

  return (
    <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0071e3] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">C</span>
            </div>
            CADENCE AI
          </div>
          <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <a href="#showcase" className="hover:text-white transition-colors">Solutions</a>
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Resources</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full pl-4 border border-white/5">
              <span className="text-xs font-bold text-zinc-300">{user?.companyName || 'Member'}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => navigate('/profile')}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"
                  title="마이페이지"
                >
                  <User className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={logout}
                  className="bg-red-500/10 p-2 rounded-full hover:bg-red-500/20 transition-all group"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'register' } }))}
                className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#0071e3]/20"
              >
                GET STARTED
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
