import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: "Cadence AI Pro란 무엇인가요?", a: "Pro 도면 에이전트는 전문 건축사무소 및 설계 팀을 위해 구축된 고급 기능을 갖춘 AI 어시스턴트입니다. 기본 무료 버전 대비 무제한 외부 API 연동 기능과 사내 표준 시방서 집중 튜닝 기능이 추가됩니다." },
  { q: "Enterprise 요금제란 무엇인가요?", a: "Enterprise 요금제는 대규모 설계 법인 또는 강력한 보안(온프레미스)이 필요한 건설사를 위한 전용 솔루션입니다. 24/7 전담 엔지니어 지원과 기업 내부 망에 커스텀 LLM을 직접 배포해 드립니다." },
  { q: "Cadence AI 시스템은 모바일 앱에서 작동하나요?", a: "현재 Cadence AI는 도면 검토 및 수정을 위한 복잡한 워크플로우를 처리하므로 데스크톱 PC(버전 3.0 이상) 접속에 최적화되어 있습니다. 향후 모바일 및 태블릿 뷰어 앱이 지원될 예정입니다." }
];

export const LandingFAQ = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="bg-white py-24 border-t border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
          {/* 하프 레이아웃 좌측 (제목) */}
          <div className="md:w-1/3 shrink-0">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight pl-2">자주 묻는 질문(FAQ)</h2>
          </div>

          {/* 하프 레이아웃 우측 (아코디언 리스트) */}
          <div className="md:w-2/3 w-full flex flex-col">
            {faqs.map((faq, i) => (
              <div key={i} className={`border-b ${openFaq === i ? 'border-[#0071e3] border-b-2' : 'border-zinc-200'} transition-colors`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full py-6 flex items-center justify-between text-left outline-none ${openFaq === i ? 'text-[#0071e3]' : 'text-zinc-900'} hover:text-black transition-colors`}
                >
                  <span className="text-[15px] font-bold tracking-tight">{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }}>
                    <ChevronDown className={`w-5 h-5 ${openFaq === i ? 'text-[#0071e3]' : 'text-zinc-500'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="pb-6 pr-8">
                        <p className="text-zinc-600 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
