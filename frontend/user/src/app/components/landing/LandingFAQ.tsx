import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: "Cadence AI는 어떤 도면을 검토하나요?", a: "AutoCAD 도면을 기준으로 건축, 전기, 소방, 배관 영역의 충돌, 치수 불일치, 기준 위반 가능성을 검토합니다. 결과는 항목별로 확인할 수 있고, 사용자가 승인한 수정 제안만 적용하는 흐름을 목표로 합니다." },
  { q: "서비스를 이용하려면 무엇이 필요한가요?", a: "회원가입 후 사업자등록증 승인이 완료되면 마이페이지에서 API Key를 발급할 수 있습니다. AutoCAD 플러그인에 API Key를 등록하면 해당 기기가 자동으로 연결됩니다." },
  { q: "Basic과 Pro 요금제는 어떻게 다른가요?", a: "Basic은 핵심 도면 검토 기능과 기본 API Key 이용에 적합합니다. Pro는 더 많은 API Key 관리와 고급 협업 기능, 확장된 사용량이 필요한 설계 팀을 위한 구독형 플랜입니다." },
  { q: "웹사이트에서 도면을 직접 편집하나요?", a: "아니요. Cadence AI는 웹 대시보드에서 계정, 결제, API Key, 기기 상태를 관리하고, 실제 도면 검토와 수정 흐름은 AutoCAD 플러그인을 통해 진행하는 구조입니다." }
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
