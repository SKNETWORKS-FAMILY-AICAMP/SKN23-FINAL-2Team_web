/*
File    : src/app/pages/PaymentPage.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 결제 페이지 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 결제 페이지 UI 초기 구현
    - 2026-04-21 (김민정) : 실제 결제 완료 DB 연동 및 모달/토스트 적용
    - 2026-04-22 (김민정) : 토스 페이먼츠 연동
    - 2026-04-26 (김민정) : 결제 테스트 환경 설정 및 UI 개선
*/
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ShieldCheck,
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { loadTossPayments } from '@tosspayments/payment-sdk';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string || '';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  const currentPlan = location.state?.currentPlan || 'None';

  const plans = {
    Basic: {
      name: 'Basic(평생 소장)',
      price: 1,
      features: ['평생 5개의 API 키 지원', '4개 전 도메인 지원 (건축, 전기, 소방, 배관)', '14일 무료 체험 가능', '기본 법규 DB 업데이트 포함']
    },
    Pro: {
      name: 'Pro(구독형)',
      price: 1,
      features: ['Basic의 모든 혜택 포함', '5개 초과 API 키 무제한 등록 및 관리', '시방서 무제한 저장 공간 (DB 구축)', '우선 순위 기술 지원', '팀 협업 기능 제공']
    }
  };

  const availablePlans = Object.fromEntries(
    Object.entries(plans).filter(([id]) => id.toLowerCase() !== currentPlan.toLowerCase())
  );

  const initialTargetPlan = location.state?.plan && availablePlans[location.state.plan as keyof typeof availablePlans]
    ? location.state.plan
    : Object.keys(availablePlans)[0] || 'Basic';

  const [selectedPlan, setSelectedPlan] = useState<string>(initialTargetPlan);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 결제 승인 후 돌아올 때 플랜 정보를 기억하기 위해 로컬 스토리지에 임시 저장
      localStorage.setItem('pending_plan_name', selectedPlan);

      const tossPayments = await loadTossPayments(clientKey);
      const amount = plans[selectedPlan as keyof typeof plans].price;
      const orderId = `order_${new Date().getTime()}`;

      const isSwitch = currentPlan !== 'None';
      const actionLabel = isSwitch
        ? (plans[selectedPlan as keyof typeof plans].price > (plans[currentPlan as keyof typeof plans]?.price || 0) ? '업그레이드' : '변경')
        : '구독';

      const orderName = `Cadence AI ${selectedPlan} Plan ${actionLabel}`;

      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user?.email || '',
        customerName: user?.companyName || '고객님',
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        toast.info('결제가 취소되었습니다.');
      } else {
        console.error("Payment request failed", error);
        toast.error('결제 창을 여는 중 장치가 응답하지 않거나 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl text-center space-y-6"
        >
          <div className="w-20 h-20 bg-[#47e266]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#47e266]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black">결제 완료</h2>
            <p className="text-zinc-400">성공적으로 <span className="text-white font-bold">{selectedPlan} Plan</span> 구독이 시작되었습니다.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2 border border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">결제 금액</span>
              <span className="text-[#0071e3] font-black text-xl">₩{plans[selectedPlan as keyof typeof plans].price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-2">
              <span className="text-zinc-500">결제 수단</span>
              <span className="text-zinc-300">신용카드 (**** 1234)</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-4 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#0071e3]/20"
          >
            마이페이지로 이동
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-200">
      <nav className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">뒤로가기</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0071e3] rounded-lg flex items-center justify-center font-black text-white">C</div>
            <span className="font-black text-white tracking-tighter text-xl">CADENCE AI</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 1. Plan Selection & Payment Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0071e3]/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#0071e3]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">요금제 선택</h2>
                  <p className="text-sm text-zinc-500">사용 목적에 맞는 플랜을 선택해주세요.</p>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${Object.keys(availablePlans).length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
                {Object.entries(availablePlans).map(([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedPlan(id)}
                    className={`relative p-6 rounded-3xl text-left transition-all border-2 ${selectedPlan === id
                      ? 'bg-[#0071e3]/10 border-[#0071e3] shadow-lg shadow-[#0071e3]/10'
                      : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                      }`}
                  >
                    {selectedPlan === id && (
                      <div className="absolute top-4 right-4 bg-[#0071e3] text-white p-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${selectedPlan === id ? 'text-[#0071e3]' : 'text-zinc-600'}`} />
                          <span className={`text-xs font-black uppercase tracking-widest ${selectedPlan === id ? 'text-[#0071e3]' : 'text-zinc-500'}`}>{id} Plan</span>
                        </div>
                        <h3 className="text-2xl font-black text-white">₩{info.price.toLocaleString()}</h3>
                        <p className="text-xs text-zinc-500">부가가치세 포함 / {id === 'Basic' ? '평생 소장' : '월'}</p>
                      </div>
                      <ul className="space-y-2">
                        {info.features.slice(0, 5).map((f: string) => (
                          <li key={f} className="text-xs text-zinc-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-zinc-700 rounded-full" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* 2. Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sticky top-32 space-y-8">
              <h3 className="text-xl font-black text-white">결제 요약</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">선택한 플랜</span>
                  <span className="font-bold text-white">{selectedPlan} Plan</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">결제 주기</span>
                  <span className="text-zinc-300">{selectedPlan === 'Basic' ? '1회 결제' : '매월 정기 결제'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">다음 결제일</span>
                  <span className="text-zinc-300">2026.05.22</span>
                </div>
                <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                  <span className="text-zinc-500 text-sm mb-1">총 결제 금액</span>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#0071e3]">₩{plans[selectedPlan as keyof typeof plans].price.toLocaleString()}</div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">VAT 10% Included</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ShieldCheck className="w-4 h-4 text-[#47e266]" />
                  <span>보안 결제 시스템이 적용 중입니다.</span>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${isProcessing
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-[#0071e3] hover:text-white shadow-xl shadow-white/5'
                    }`}
                >
                  {isProcessing ? (
                    '처리 중...'
                  ) : (
                    <>
                      {currentPlan !== 'None' ? `${selectedPlan} 플랜으로 변경하기` : '결제 완료하기'} <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-[10px] text-zinc-600 text-center leading-relaxed">
                '결제 완료하기' 버튼을 누름으로써 귀하는 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
