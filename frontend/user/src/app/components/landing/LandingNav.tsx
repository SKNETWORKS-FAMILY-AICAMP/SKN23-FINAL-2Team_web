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
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import logoMark from '@/assets/chat_logo_mark.png';

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
    <nav className="fixed top-0 w-full z-[100] border-b border-zinc-100 bg-white shadow-sm">
      <div className="flex justify-between items-center w-full px-4 py-3 md:px-8 md:py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-6 md:gap-10 min-w-0">
          <div className="flex items-center gap-2.5 cursor-pointer group min-w-0" onClick={handleLogoClick}>
            <img
              src={logoMark}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 md:h-9 md:w-9 object-contain transition-transform group-hover:scale-105 shrink-0"
            />
            <span className="text-lg md:text-xl font-bold tracking-tighter text-zinc-900 group-hover:text-[#0071e3] transition-colors pr-2 md:pr-4 whitespace-nowrap">Cadence AI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pricing')} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2 hidden md:block">
            가격 책정
          </button>
          <button
            onClick={() => navigate('/inquiries', { state: { tab: 'faq' } })}
            className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2 hidden md:block"
          >
            문의하기
          </button>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 bg-white hover:bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-200 cursor-pointer transition-all shadow-sm group outline-none">
                  <span className="text-sm font-bold text-zinc-700">
                    {user?.companyName ? `${user.companyName}님` : 'Member'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={0} className="w-[var(--radix-dropdown-menu-trigger-width)] p-1 bg-white !rounded-sm border border-zinc-200 shadow-lg z-[200]">
                <DropdownMenuItem
                  onClick={() => navigate((user?.role === 'admin' || user?.role === 'superuser') ? '/admin' : '/profile')}
                  className="w-full text-center px-3 py-2 cursor-pointer rounded-sm font-semibold text-[13px] text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900 outline-none transition-colors"
                >
                  {(user?.role === 'admin' || user?.role === 'superuser') ? '관리자 페이지' : '마이페이지'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="w-full text-center px-3 py-2 cursor-pointer rounded-sm font-bold text-[13px] text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 outline-none transition-colors mt-0.5 border-t border-zinc-100"
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                className="hidden sm:inline-flex text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 md:px-4 py-2 whitespace-nowrap"
              >
                로그인
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))}
                className="bg-zinc-900 text-white px-4 md:px-5 py-2 rounded-lg font-semibold hover:bg-zinc-800 transition-all text-sm whitespace-nowrap"
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
