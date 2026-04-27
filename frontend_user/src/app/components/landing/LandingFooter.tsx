/*
File    : src/app/components/landing/LandingFooter.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 하단 푸터 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-27 (송주엽) : 라이트 테마 전환
 */
import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 py-6 px-8 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="max-w-xl space-y-2">
          <p className="text-zinc-400 text-xs leading-relaxed">
            Cadence는 CAD와 Essence(본질)을 합쳐 도면의 흐름을 완벽하게 관리한다는 의미를 가지며,
            단순한 플러그인을 넘어, 도면 위의 모든 엔티티를 법적 관점에서 이해하는 지능형 코파일럿입니다.
          </p>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">© 2026 skn23 family networks inc. Seoul, KR.</div>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <h5 className="text-white text-xs font-bold uppercase tracking-widest w-20">Solutions</h5>
            <nav className="flex flex-wrap items-center gap-3">
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Architecture</a>
              <span className="text-zinc-700 text-[10px]">|</span>
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Electrical</a>
              <span className="text-zinc-700 text-[10px]">|</span>
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Fire Safety</a>
              <span className="text-zinc-700 text-[10px]">|</span>
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Piping</a>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <h5 className="text-white text-xs font-bold uppercase tracking-widest w-20">Company</h5>
            <nav className="flex flex-wrap items-center gap-3">
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Documentation</a>
              <span className="text-zinc-700 text-[10px]">|</span>
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Safety Standard</a>
              <span className="text-zinc-700 text-[10px]">|</span>
              <a href="#" className="text-zinc-500 text-xs hover:text-white transition-colors">Terms</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};
