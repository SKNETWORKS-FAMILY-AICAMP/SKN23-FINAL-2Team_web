import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, ChevronLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAQPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "요금제 변경은 어떻게 하나요?", a: "마이페이지의 '요금제 정보' 탭에서 원하시는 플랜을 선택하여 즉시 변경하실 수 있습니다. 남은 기간은 일할 계산되어 환불 또는 청구됩니다." },
    { q: "API Key가 노출되었습니다. 어떻게 해야 하나요?", a: "즉시 'API Key 관리' 탭에서 해당 키의 [폐기] 버튼을 눌러 무효화하시고, [새 키 발급]을 진행해 주세요." },
    { q: "플러그인 설치 파일은 어디서 받나요?", a: "측면 메뉴의 '다운로드 센터' 탭 또는 랜딩 페이지 하단의 설치 바로가기를 이용해 주세요." },
    { q: "결제 영수증은 어디서 확인하나요?", a: "결제가 완료되면 가입하신 이메일로 자동 발송됩니다. 향후 업데이트에서 결제 내역 탭이 추가될 예정입니다." } 
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
