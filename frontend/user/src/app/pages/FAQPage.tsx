/*
File    : src/app/pages/FAQPage.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 자주 묻는 질문(FAQ) 페이지

Modification History:
    - 2026-04-20 (김민정) : FAQ 페이지 초기 구현
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, ChevronLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAQPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Cadence AI는 어떤 프로젝트인가요?", a: "AutoCAD 안에서 실행되는 도면 검토 에이전트 플랫폼입니다. 건축, 전기, 소방, 배관 도면의 충돌, 치수 오류, 기준 위반 가능성을 탐지하고 수정 제안을 제공합니다." },
    { q: "회원가입 후 바로 사용할 수 있나요?", a: "회원가입과 이메일 인증 후 사업자등록증 검토가 필요합니다. 관리자 승인이 완료되면 요금제 결제, API Key 발급, 기기 등록 기능을 사용할 수 있습니다." },
    { q: "API Key는 어디에 사용하나요?", a: "마이페이지의 'API Key 관리' 탭에서 발급한 키를 AutoCAD 플러그인에 입력해 계정과 기기를 연결합니다. 노출되었거나 더 이상 쓰지 않는 키는 즉시 폐기하고 새 키를 발급해 주세요." },
    { q: "기기 등록은 어떻게 이루어지나요?", a: "AutoCAD 플러그인에서 API Key를 입력하면 해당 PC가 자동으로 등록됩니다. 등록된 기기는 마이페이지의 '기기 등록 현황'에서 활성 상태와 마지막 동기화 시간을 확인할 수 있습니다." },
    { q: "요금제 변경과 구독 해지는 어디서 하나요?", a: "마이페이지의 '요금제 정보' 탭에서 현재 플랜, 다음 결제일, 남은 기간을 확인하고 요금제 변경 또는 구독 해지 예약을 진행할 수 있습니다." },
    { q: "문의는 어떻게 남기나요?", a: "상단 메뉴의 '문의하기'에서 1:1 문의를 접수할 수 있습니다. 로그인 사용자는 계정 기준으로 문의가 연결되고, 비회원 문의는 4자리 비밀번호로 본문을 확인합니다." }
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-200">
      <nav className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-[#0071e3]" /> 자주 묻는 질문 (FAQ)</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            무엇을 도와드릴까요?
          </h1>
          <p className="text-zinc-500 mb-12">가장 자주 확인하시는 질문들을 모아두었습니다. 이외의 내용이 궁금하시다면 언제든 1:1 문의를 이용해주세요!</p>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between font-bold hover:bg-white/5 transition-colors text-left focus:outline-none"
                >
                  <span className="flex items-center gap-3"><span className="text-[#0071e3]">Q.</span> {faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-zinc-400 bg-black/20 text-sm leading-relaxed"
                    >
                      <div className="p-6 pr-8 border-t border-white/5 flex gap-3">
                        <span className="text-[#47e266] font-bold">A.</span>
                        <span>{faq.a}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
