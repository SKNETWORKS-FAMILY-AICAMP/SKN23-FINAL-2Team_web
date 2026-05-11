import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, ChevronLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAQPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Cadence AI는 어떤 서비스인가요?',
      a: 'AutoCAD 기반 도면 검토를 돕는 AI 서비스입니다. 건축, 전기, 소방, 배관 도면의 충돌, 치수 오류, 기준 위반 가능성을 확인하고 수정 방향을 제안합니다.',
    },
    {
      q: '회원가입 후 바로 사용할 수 있나요?',
      a: '회원가입과 이메일 인증 후 사업자등록증 검토가 필요합니다. 승인 완료 후 요금제 결제, API Key 발급, 기기 등록 기능을 사용할 수 있습니다.',
    },
    {
      q: 'API Key는 어디에 사용하나요?',
      a: '마이페이지의 API Key 관리에서 발급한 키를 AutoCAD 플러그인에 입력해 계정과 기기를 연결합니다. 유출이 의심되면 즉시 폐기하고 새 키를 발급하세요.',
    },
    {
      q: '기기 등록은 어떻게 이루어지나요?',
      a: 'AutoCAD 플러그인에서 API Key를 입력하면 해당 PC가 자동으로 등록됩니다. 등록된 기기는 마이페이지에서 상태와 마지막 동기화 시간을 확인할 수 있습니다.',
    },
    {
      q: '요금제 변경과 구독 해지는 어디서 하나요?',
      a: '마이페이지의 요금제 정보 탭에서 현재 플랜, 다음 결제일, 남은 기간을 확인하고 요금제 변경 또는 구독 해지를 진행할 수 있습니다.',
    },
    {
      q: '문의는 어떻게 남기나요?',
      a: '상단 메뉴의 문의하기에서 1:1 문의를 접수할 수 있습니다. 로그인 사용자는 계정 기준으로 문의가 연결되고, 비회원 문의는 4자리 PIN으로 본문을 확인합니다.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-zinc-900">
      <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
            aria-label="홈으로 돌아가기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg text-zinc-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#0071e3]" />
            자주 묻는 질문
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-sm font-bold tracking-widest uppercase text-[#0071e3] mb-3">FAQ</p>
          <h1 className="text-3xl font-black tracking-tight mb-3">무엇을 도와드릴까요?</h1>
          <p className="text-sm text-zinc-500">
            자주 확인하는 질문을 모았습니다. 더 자세한 도움이 필요하면 1:1 문의를 이용해 주세요.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-6 flex items-center justify-between gap-4 font-bold hover:bg-zinc-50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
              >
                <span className="flex items-center gap-3">
                  <span className="text-[#0071e3]">Q.</span>
                  {faq.q}
                </span>
                {openFaq === i ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-sm leading-relaxed text-zinc-600 bg-zinc-50"
                  >
                    <div className="p-6 pr-8 border-t border-zinc-200 flex gap-3">
                      <span className="text-emerald-600 font-bold">A.</span>
                      <span>{faq.a}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
