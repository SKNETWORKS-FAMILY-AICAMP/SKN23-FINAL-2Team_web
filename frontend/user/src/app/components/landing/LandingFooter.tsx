import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-zinc-200 py-6 px-8 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="max-w-xl space-y-2">
          <p className="text-zinc-500 text-xs leading-relaxed">
            Cadence AI는 도면 검토와 업무 흐름을 더 안정적으로 관리하기 위한 엔터프라이즈 설계 보조 서비스입니다.
            계정, 결제, API Key, 기기 등록 흐름은 사용자 권한 기준으로 분리되어 관리됩니다.
          </p>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">
            © 2026 SKN23 Family Networks Inc. Seoul, KR.
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <h5 className="text-zinc-900 text-xs font-bold uppercase tracking-widest w-20">Solutions</h5>
            <nav className="flex flex-wrap items-center gap-3">
              {['Architecture', 'Electrical', 'Fire Safety', 'Piping'].map((item, index) => (
                <React.Fragment key={item}>
                  {index > 0 && <span className="text-zinc-300 text-[10px]">|</span>}
                  <a href="#" className="text-zinc-500 text-xs hover:text-[#0071e3] transition-colors">
                    {item}
                  </a>
                </React.Fragment>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <h5 className="text-zinc-900 text-xs font-bold uppercase tracking-widest w-20">Company</h5>
            <nav className="flex flex-wrap items-center gap-3">
              {['Documentation', 'Safety Standard', 'Terms'].map((item, index) => (
                <React.Fragment key={item}>
                  {index > 0 && <span className="text-zinc-300 text-[10px]">|</span>}
                  <a href="#" className="text-zinc-500 text-xs hover:text-[#0071e3] transition-colors">
                    {item}
                  </a>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};
