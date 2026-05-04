/*
File    : src/app/components/profile/user/UserPaymentTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 요금제 및 결제 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 현재 플랜 정보 내 결제일, 다음 구독일, 남은 일수 표시 기능 추가, 구독 해지 버튼 추가
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
 */
import React from 'react';
import { CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';

const formatCurrency = (value: number) => value.toLocaleString('ko-KR');

interface BillingTabProps {
  isLoadingPayment: boolean;
  paymentInfo: any;
  isVerified: boolean;
  triggerConfirm: (title: string, message: string, onConfirm: () => void, type?: 'blue' | 'red') => void;
  navigate: any;
  refetchPayment: () => void;
}

export const UserPaymentTab: React.FC<BillingTabProps> = ({
  isLoadingPayment,
  paymentInfo,
  isVerified,
  triggerConfirm,
  navigate,
  refetchPayment
}) => {
  if (isLoadingPayment || !paymentInfo) {
    return (
      <div className="py-16 text-center text-sm text-zinc-400">
        정보를 불러오는 중입니다...
      </div>
    );
  }

  if (paymentInfo.noPlan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">요금제 정보</h1>
          <p className="mt-1 text-sm text-zinc-500">구독 중인 요금제가 없습니다. 플랜을 선택하여 시작하세요.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              id: 'Basic',
              price: '600,000',
              desc: '필수적인 법규 검토 기능을 합리적인 가격에 이용해보세요.',
              features: ['기본 5개 시트 포함', '4개 전 도메인 지원', '기본 법규 DB 업데이트', '이메일 기술 지원'],
            },
            {
              id: 'Pro',
              price: '1,200,000',
              desc: '무제한 API 키와 고급 기능으로 팀 전체 생산성을 높이세요.',
              features: ['기본 10개 시트 포함', 'API 키 무제한 등록', '시방서 무제한 저장', '우선 순위 기술 지원'],
            },
          ].map((plan) => (
            <div key={plan.id} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">{plan.id} Plan</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  ₩{plan.price}
                  <span className="text-sm font-normal text-zinc-400 ml-1">/ 연</span>
                </p>
                <p className="text-xs text-zinc-500">{plan.desc}</p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/payment', { state: { plan: plan.id } })}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {plan.id} 플랜으로 시작하기
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const planAmount = Number(paymentInfo?.amount ?? 0);
  const planPrice = planAmount > 0
    ? formatCurrency(planAmount)
    : paymentInfo?.plan_name?.toLowerCase() === 'basic' ? '600,000' : '1,200,000';
  const nextDate = paymentInfo?.next_payment_date?.split('T')[0];
  const lastDate = paymentInfo?.last_payment_date?.split('T')[0];
  const totalSeats = paymentInfo?.max_seats ?? paymentInfo?.seats ?? 0;
  const addedSeats = paymentInfo?.added_seats ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">요금제 정보</h1>
        <p className="mt-1 text-sm text-zinc-500">현재 구독 상태와 결제 내역을 확인하세요.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-900">현재 플랜</span>
          </div>
          {paymentInfo.is_cancelling && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 ring-1 ring-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              해지 예약됨
            </span>
          )}
        </div>

        <div className="px-6 py-5">
          <div className="flex items-end gap-3 mb-5">
            <span className="text-3xl font-semibold text-zinc-900">{paymentInfo.plan_name}</span>
            <span className="text-sm text-zinc-500 mb-1">₩{planPrice} / 연</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '최근 결제일', value: lastDate || '-' },
              { label: '다음 결제일', value: nextDate || '-' },
              { label: '시트', value: `${totalSeats}개${addedSeats > 0 ? ` (+${addedSeats})` : ''}` },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-zinc-700">
                  {value}
                  {label === '다음 결제일' && paymentInfo.remaining_days > 0 && (
                    <span className="text-zinc-400 ml-1 text-xs">({paymentInfo.remaining_days}일 남음)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {paymentInfo.is_cancelling
              ? `${nextDate} 이후 서비스 이용이 종료됩니다.`
              : '현재 결제 주기 종료일까지 모든 기능을 정상 이용하실 수 있습니다.'}
          </p>
          <button
            disabled={!isVerified}
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (paymentInfo.is_cancelling) {
                triggerConfirm('구독 유지', '해지 예약을 취소하고 구독을 유지하시겠습니까?', async () => {
                  const res = await fetch(`${API_BASE_URL}/payments/resume`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) { toast.success('구독 유지가 확정되었습니다.'); refetchPayment(); }
                }, 'blue');
              } else {
                triggerConfirm('구독 해지', '정말 구독을 해지하시겠습니까? 해지 후에도 현재 주기가 끝날 때까지는 이용 가능합니다.', async () => {
                  const res = await fetch(`${API_BASE_URL}/payments/cancel`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) { toast.success('해지 예약되었습니다.'); refetchPayment(); }
                }, 'red');
              }
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              !isVerified
                ? 'text-zinc-300 cursor-not-allowed'
                : paymentInfo.is_cancelling
                  ? 'text-[#0071e3] hover:bg-blue-50'
                  : 'text-red-500 hover:bg-red-50'
            }`}
          >
            {!isVerified ? '승인 대기 중' : paymentInfo.is_cancelling ? '해지 취소' : '구독 해지'}
          </button>
        </div>
      </div>

      {/* Plan Change */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-900">요금제 변경</p>
        {['Basic', 'Pro']
          .filter(p => p.toLowerCase() !== paymentInfo?.plan_name?.toLowerCase())
          .map(p => (
            <div key={p} className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#0071e3] uppercase tracking-wide">
                  {p === 'Pro' ? 'Upgrade to Pro' : 'Switch to Basic'}
                </p>
                <p className="text-sm font-semibold text-zinc-900">
                  ₩{p === 'Basic' ? '600,000' : '1,200,000'}
                  <span className="text-xs font-normal text-zinc-400 ml-1">/ 연</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {p === 'Pro' ? '무제한 API 키 및 고급 협업 기능을 이용해보세요.' : '필수 기능을 합리적인 가격에 이용해보세요.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/payment', { state: { plan: p, currentPlan: paymentInfo?.plan_name } })}
                className="shrink-0 ml-6 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {p === 'Pro' ? 'Pro로 업그레이드' : 'Basic으로 변경'}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
