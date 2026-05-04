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
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import {
  CheckCircle,
  ChevronLeft,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';
import logoMark from '@/assets/chat_logo_mark.png';

type PlanOption = {
  plan_code: string;
  plan_name: string;
  base_seats: number;
  base_price: number;
  addon_price_per_seat: number;
};

const PLAN_COPY: Record<string, { name: string; features: string[] }> = {
  Basic: {
    name: 'Basic (연간)',
    features: ['기본 5개 시트 포함', '4개 전 도메인 지원 (건축, 전기, 소방, 배관)', '기본 법규 DB 업데이트 포함', '이메일 기술 지원']
  },
  Pro: {
    name: 'Pro (연간)',
    features: ['기본 10개 시트 포함', 'API 키 무제한 등록 및 관리', '시방서 무제한 저장 공간', '우선 순위 기술 지원']
  },
  Enterprise: {
    name: 'Enterprise (연간)',
    features: ['기본 30개 시트 포함', '연간 5,000,000 Token 제공 보장', '온프레미스 & sLLM 프라이빗 튜닝', '전담 기술 지원']
  }
};

const DEFAULT_PLANS: PlanOption[] = [
  { plan_code: 'Basic', plan_name: 'Basic', base_seats: 5, base_price: 600000, addon_price_per_seat: 60000 },
  { plan_code: 'Pro', plan_name: 'Pro', base_seats: 10, base_price: 1200000, addon_price_per_seat: 120000 },
  { plan_code: 'Enterprise', plan_name: 'Enterprise', base_seats: 30, base_price: 3600000, addon_price_per_seat: 100000 },
];

const formatCurrency = (value: number) => value.toLocaleString('ko-KR');
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, user } = useAuth();

  const currentPlan = location.state?.currentPlan || 'None';
  const [planOptions, setPlanOptions] = useState<PlanOption[]>(DEFAULT_PLANS);
  const [additionalSeats, setAdditionalSeats] = useState(0);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/plans`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlanOptions(data.plans);
        }
      } catch (error) {
        console.error('Failed to load payment plans', error);
      }
    };
    fetchPlans();
  }, []);

  const availablePlans = useMemo(
    () => planOptions.filter((plan) => plan.plan_code.toLowerCase() !== currentPlan.toLowerCase()),
    [currentPlan, planOptions]
  );

  const initialTargetPlan = location.state?.plan && DEFAULT_PLANS.some((plan) => plan.plan_code === location.state.plan)
    ? location.state.plan
    : availablePlans[0]?.plan_code || 'Basic';

  const [selectedPlan, setSelectedPlan] = useState<string>(initialTargetPlan);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ autoKey?: string } | null>(null);

  useEffect(() => {
    if (!availablePlans.some((plan) => plan.plan_code === selectedPlan)) {
      setSelectedPlan(availablePlans[0]?.plan_code || 'Basic');
      setAdditionalSeats(0);
    }
  }, [availablePlans, selectedPlan]);

  const selectedPlanInfo = planOptions.find((plan) => plan.plan_code === selectedPlan) || DEFAULT_PLANS[0];
  const totalSeats = selectedPlanInfo.base_seats + additionalSeats;
  const addonAmount = selectedPlanInfo.addon_price_per_seat * additionalSeats;
  const totalAmount = selectedPlanInfo.base_price + addonAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      localStorage.setItem('pending_plan_name', selectedPlan);
      localStorage.setItem('pending_added_seats', String(additionalSeats));
      localStorage.setItem('pending_total_seats', String(totalSeats));
      localStorage.setItem('pending_amount', String(totalAmount));

      if (TOSS_CLIENT_KEY) {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        await tossPayments.requestPayment('카드', {
          amount: totalAmount,
          orderId: `cadence_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          orderName: `${selectedPlan} 연간 구독${additionalSeats > 0 ? ` + 추가 시트 ${additionalSeats}개` : ''}`,
          customerName: user?.companyName || user?.email || 'Cadence 고객',
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/payments/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_name: selectedPlan,
          added_seats: additionalSeats,
          seats: totalSeats,
          amount: totalAmount,
        })
      });
      const data = await res.json();
      if (data.success) {
        if (refreshUser) await refreshUser();
        setResult({ autoKey: data.auto_key });
      } else {
        toast.error(data.message || data.detail || `오류: ${res.status}`);
      }
    } catch (error) {
      console.error('Activation failed', error);
      toast.error('서버 요청 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result !== null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900">구독 활성화 완료</h2>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-700">{selectedPlan} Plan</span> 구독이 시작되었습니다.
            </p>
            <p className="text-xs text-zinc-400">
              총 {totalSeats}개 시트 · ₩{formatCurrency(totalAmount)} / 연
            </p>
          </div>
          {result.autoKey && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">자동 발급된 API Key</p>
              <code className="block font-mono text-xs text-zinc-700 break-all select-all">{result.autoKey}</code>
              <p className="text-[11px] text-zinc-400">API Key 관리 탭에서 언제든 확인하실 수 있습니다.</p>
            </div>
          )}
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            마이페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로가기
          </button>
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="Cadence AI" className="h-7 w-7 object-contain" />
            <span className="font-bold text-zinc-900 tracking-tight">Cadence AI</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">요금제 선택</h1>
          <p className="mt-1 text-sm text-zinc-500">사용 목적에 맞는 플랜을 선택하고 구독을 시작하세요.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 플랜 카드들 */}
          <div className="lg:col-span-2">
            <div className={`grid gap-4 ${
              availablePlans.length === 1 ? 'grid-cols-1' :
              availablePlans.length === 2 ? 'md:grid-cols-2' :
              'md:grid-cols-2 xl:grid-cols-3'
            }`}>
              {availablePlans.map((info) => {
                const id = info.plan_code;
                const copy = PLAN_COPY[id] || PLAN_COPY.Basic;
                return (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedPlan(id);
                    setAdditionalSeats(0);
                  }}
                  className={`relative p-6 rounded-xl text-left transition-all border-2 bg-white ${
                    selectedPlan === id
                      ? 'border-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.08)]'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {selectedPlan === id && (
                    <div className="absolute top-4 right-4 text-[#0071e3]">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-3.5 h-3.5 ${selectedPlan === id ? 'text-[#0071e3]' : 'text-zinc-400'}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${selectedPlan === id ? 'text-[#0071e3]' : 'text-zinc-400'}`}>
                          {id} Plan
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">₩{formatCurrency(info.base_price)}</p>
                      <p className="text-xs text-zinc-400">기본 {info.base_seats}개 시트 · VAT 포함 / 연간</p>
                    </div>
                    <ul className="space-y-2">
                      {copy.features.map((f: string) => (
                        <li key={f} className="text-xs text-zinc-500 flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
                );
              })}
            </div>
          </div>

          {/* 결제 요약 */}
          <div>
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-24 space-y-5 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">결제 요약</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">선택한 플랜</span>
                  <span className="font-semibold text-zinc-800">{selectedPlan} Plan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">결제 주기</span>
                  <span className="text-zinc-700">연간 구독</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">기본 시트</span>
                  <span className="text-zinc-700">{selectedPlanInfo.base_seats}개 포함</span>
                </div>
                <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-zinc-700">추가 시트</p>
                      <p className="text-[10px] text-zinc-400">
                        1개당 ₩{formatCurrency(selectedPlanInfo.addon_price_per_seat)} / 연
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdditionalSeats((value) => Math.max(0, value - 1))}
                        className="h-7 w-7 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={additionalSeats}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setAdditionalSeats(Number.isFinite(value) ? Math.max(0, Math.min(99, Math.floor(value))) : 0);
                        }}
                        className="h-7 w-12 rounded-md border border-zinc-200 bg-white text-center text-xs font-semibold text-zinc-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setAdditionalSeats((value) => Math.min(99, value + 1))}
                        className="h-7 w-7 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">총 시트</span>
                    <span className="font-semibold text-zinc-800">{totalSeats}개</span>
                  </div>
                </div>
                {additionalSeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">추가 시트 금액</span>
                    <span className="text-zinc-700">₩{formatCurrency(addonAmount)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-100 pt-3 flex justify-between items-end">
                  <span className="text-zinc-500">총 결제 금액</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900">
                      ₩{formatCurrency(totalAmount)}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">VAT 포함 · 연간</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">
                  {TOSS_CLIENT_KEY ? '토스 결제창으로 이동합니다' : '테스트 환경 — 실제 결제 없음'}
                </span>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  isProcessing
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    : 'bg-[#0071e3] hover:brightness-110 text-white shadow-sm'
                }`}
              >
                {isProcessing ? '처리 중...' : (
                  <>
                    {currentPlan !== 'None' ? `${selectedPlan} 플랜으로 변경` : '구독 시작하기'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                구독 시작하기를 누르면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
