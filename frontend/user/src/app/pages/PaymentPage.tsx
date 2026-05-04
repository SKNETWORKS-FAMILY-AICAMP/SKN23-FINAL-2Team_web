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
import { useEffect, useMemo, useState } from 'react';
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

type PlanTier = 'Basic' | 'Pro' | 'Enterprise';

const normalizePlanTier = (value?: string): PlanTier => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized.includes('enterprise')) return 'Enterprise';
  if (normalized.includes('pro')) return 'Pro';
  return 'Basic';
};

const PLAN_COPY: Record<PlanTier, { title: string; subtitle: string; features: string[] }> = {
  Basic: {
    title: 'Basic Plan',
    subtitle: '소규모 팀을 위한 기본 구독',
    features: ['기본 5개 시트 포함', '4개 전 도메인 지원', '법령 DB 정기 업데이트', '이메일 기술 지원']
  },
  Pro: {
    title: 'Pro Plan',
    subtitle: '성장하는 조직을 위한 확장 구독',
    features: ['기본 10개 시트 포함', '추가 시트 확장 지원', 'API Key 및 사용량 관리', '우선 기술 지원']
  },
  Enterprise: {
    title: 'Enterprise Plan',
    subtitle: '대규모 운영과 전담 지원 구독',
    features: ['기본 30개 시트 포함', '대량 사용량 운영 지원', '전담 기술 지원', '조직 맞춤 확장 옵션']
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
  const { user } = useAuth();

  const currentPlan = location.state?.currentPlan || 'None';
  const paymentMode = location.state?.mode === 'addSeats' ? 'addSeats' : 'plan';
  const existingAddedSeats = Math.max(0, Number(location.state?.addedSeats || 0));
  const minAdditionalSeats = paymentMode === 'addSeats' ? 1 : 0;
  const [planOptions, setPlanOptions] = useState<PlanOption[]>(DEFAULT_PLANS);
  const [additionalSeats, setAdditionalSeats] = useState(minAdditionalSeats);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/plans`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.plans) && data.plans.length > 0) {
          // 같은 tier 플랜 중복 제거 — 가장 높은 가격(정식 플랜) 유지
          const seen = new Map<string, PlanOption>();
          for (const plan of data.plans as PlanOption[]) {
            const tier = normalizePlanTier(plan.plan_code || plan.plan_name);
            const existing = seen.get(tier);
            if (!existing || plan.base_price > existing.base_price) {
              seen.set(tier, plan);
            }
          }
          setPlanOptions(Array.from(seen.values()));
        }
      } catch (error) {
        console.error('Failed to load payment plans', error);
      }
    };
    fetchPlans();
  }, []);

  const availablePlans = useMemo(() => {
    const currentTier = currentPlan && currentPlan !== 'None' ? normalizePlanTier(currentPlan) : null;
    if (paymentMode === 'addSeats' && currentTier) {
      return planOptions.filter((plan) => normalizePlanTier(plan.plan_code || plan.plan_name) === currentTier);
    }
    return planOptions.filter((plan) => normalizePlanTier(plan.plan_code || plan.plan_name) !== currentTier);
  }, [currentPlan, paymentMode, planOptions]);

  const initialTargetPlan = location.state?.plan
    ? normalizePlanTier(location.state.plan)
    : normalizePlanTier(availablePlans[0]?.plan_code || availablePlans[0]?.plan_name || 'Basic');

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(initialTargetPlan);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!availablePlans.some((plan) => normalizePlanTier(plan.plan_code || plan.plan_name) === selectedPlan)) {
      setSelectedPlan(normalizePlanTier(availablePlans[0]?.plan_code || availablePlans[0]?.plan_name || 'Basic'));
      setAdditionalSeats(minAdditionalSeats);
    }
  }, [availablePlans, minAdditionalSeats, selectedPlan]);

  const selectedPlanInfo = planOptions.find((plan) => normalizePlanTier(plan.plan_code || plan.plan_name) === selectedPlan) || DEFAULT_PLANS[0];
  const selectedCopy = PLAN_COPY[selectedPlan];
  const finalAddedSeats = paymentMode === 'addSeats'
    ? existingAddedSeats + additionalSeats
    : additionalSeats;
  const totalSeats = selectedPlanInfo.base_seats + finalAddedSeats;
  const addonAmount = selectedPlanInfo.addon_price_per_seat * additionalSeats;
  const totalAmount = paymentMode === 'addSeats'
    ? addonAmount
    : selectedPlanInfo.base_price + addonAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('로그인이 필요합니다.');
        navigate('/');
        return;
      }

      localStorage.setItem('pending_plan_name', selectedPlan);
      localStorage.setItem('pending_payment_mode', paymentMode);
      localStorage.setItem('pending_added_seats', String(finalAddedSeats));
      localStorage.setItem('pending_incremental_added_seats', String(additionalSeats));
      localStorage.setItem('pending_total_seats', String(totalSeats));
      localStorage.setItem('pending_amount', String(totalAmount));

      if (TOSS_CLIENT_KEY) {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        await tossPayments.requestPayment('카드', {
          amount: totalAmount,
          orderId: `cadence_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          orderName: paymentMode === 'addSeats'
            ? `${selectedPlan} 추가 시트 ${additionalSeats}개`
            : `${selectedPlan} 연간 구독${additionalSeats > 0 ? ` + 추가 시트 ${additionalSeats}개` : ''}`,
          customerName: user?.companyName || user?.email || 'Cadence 고객',
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
        return;
      }

      toast.error('토스 결제 클라이언트 키가 설정되지 않았습니다.');
    } catch (error) {
      console.error('Payment request failed', error);
      toast.error('결제창을 여는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-zinc-900">
            {paymentMode === 'addSeats' ? '좌석 추가' : '요금제 선택'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {paymentMode === 'addSeats'
              ? '현재 구독 플랜에 필요한 시트를 추가하고 결제하세요.'
              : '사용 목적에 맞는 플랜을 선택하고 구독을 시작하세요.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 플랜 카드들 */}
          <div className="lg:col-span-2">
            {paymentMode === 'addSeats' ? (
              /* 좌석 추가 모드: 현재 플랜 정보 표시 (선택 불가) */
              <div className="relative p-6 rounded-xl border-2 border-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.08)] bg-white">
                <div className="absolute top-4 right-4 text-[#0071e3]">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#0071e3]">
                        {selectedCopy.title} · 현재 구독 중
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-zinc-900">
                        ₩{formatCurrency(selectedPlanInfo.addon_price_per_seat)}
                      </p>
                      <span className="text-sm text-zinc-400">/ 좌석 · 연간</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-500">{selectedCopy.subtitle}</p>
                    <p className="text-xs text-zinc-400">
                      기본 {selectedPlanInfo.base_seats}개 시트 포함
                      {existingAddedSeats > 0 ? ` · 현재 추가 ${existingAddedSeats}개` : ''}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {selectedCopy.features.map((f: string) => (
                      <li key={f} className="text-xs text-zinc-500 flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* 요금제 선택 모드: 플랜 카드 선택 */
              <div className={`grid gap-4 ${
                availablePlans.length === 1 ? 'grid-cols-1' :
                availablePlans.length === 2 ? 'md:grid-cols-2' :
                'md:grid-cols-2 xl:grid-cols-3'
              }`}>
                {availablePlans.map((info) => {
                  const id = normalizePlanTier(info.plan_code || info.plan_name);
                  const copy = PLAN_COPY[id];
                  return (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedPlan(id);
                      setAdditionalSeats(minAdditionalSeats);
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
                            {copy.title}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-zinc-900">₩{formatCurrency(info.base_price)}</p>
                        <p className="text-xs font-medium text-zinc-500">{copy.subtitle}</p>
                        <p className="text-xs text-zinc-400">
                          기본 {info.base_seats}개 시트 · VAT 포함 / 연간
                        </p>
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
            )}
          </div>

          {/* 결제 요약 */}
          <div>
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-24 space-y-5 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">결제 요약</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">선택한 플랜</span>
                  <span className="font-semibold text-zinc-800">{selectedCopy.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">결제 유형</span>
                  <span className="text-zinc-700">{paymentMode === 'addSeats' ? '추가 시트 결제' : '연간 구독'}</span>
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
                        onClick={() => setAdditionalSeats((value) => Math.max(minAdditionalSeats, value - 1))}
                        className="h-7 w-7 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={minAdditionalSeats}
                        max={99}
                        value={additionalSeats}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setAdditionalSeats(Number.isFinite(value) ? Math.max(minAdditionalSeats, Math.min(99, Math.floor(value))) : minAdditionalSeats);
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
                  {paymentMode === 'addSeats' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">기존 추가 시트</span>
                      <span className="font-semibold text-zinc-800">{existingAddedSeats}개</span>
                    </div>
                  )}
                </div>
                {(additionalSeats > 0 || paymentMode === 'addSeats') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{paymentMode === 'addSeats' ? '이번 추가 결제 금액' : '추가 시트 금액'}</span>
                    <span className="text-zinc-700">₩{formatCurrency(addonAmount)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-100 pt-3 flex justify-between items-end">
                  <span className="text-zinc-500">총 결제 금액</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900">
                      ₩{formatCurrency(totalAmount)}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
                      VAT 포함 · {paymentMode === 'addSeats' ? '추가 시트' : '연간'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">
                  {TOSS_CLIENT_KEY ? '결제 버튼을 누르면 토스 결제창이 열립니다' : '토스 결제 클라이언트 키가 필요합니다'}
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
                    {paymentMode === 'addSeats'
                      ? `시트 ${additionalSeats}개 추가 결제`
                      : currentPlan !== 'None' ? `${selectedCopy.title}으로 변경 및 결제` : '결제창 열기'}
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
