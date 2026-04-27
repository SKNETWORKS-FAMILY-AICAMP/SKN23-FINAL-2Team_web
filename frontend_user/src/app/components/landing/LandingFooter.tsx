/*
File    : src/app/components/landing/LandingFooter.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 하단 푸터 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
      <footer className="bg-zinc-950 border-t border-white/5 py-24 px-8 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-8 bg-zinc-600"></span>
              <span className="text-xl font-black tracking-tight text-white">Cadence AI</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Cadence는 CAD와 Essence(본질)을 합쳐 도면의 흐름을 완벽하게 관리한다는 의미를 가지며, 단순한 플러그인을 넘어, 도면 위의 모든 엔티티를 법적 관점에서 이해하는 지능형 코파일럿입니다.
            </p>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">© 2026 skn23 family networks inc. Seoul, KR.</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h5 className="text-white text-sm font-bold uppercase tracking-widest">Solutions</h5>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Architecture</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Electrical</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Fire Safety</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Piping</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h5 className="text-white text-sm font-bold uppercase tracking-widest">Company</h5>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Documentation</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Safety Standard</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
  );
};
