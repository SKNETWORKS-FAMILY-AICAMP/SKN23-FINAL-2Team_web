/*
File    : src/app/components/profile/user/UserPaymentTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 요금제 및 결제 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 현재 플랜 정보 내 결제일, 다음 구독일, 남은 일수 표시 기능 추가, 구독 해지 버튼 추가
 */
import React from 'react';
import { CreditCard, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';

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
    return <div className="text-center py-12 text-zinc-500 animate-pulse">정보를 불러오는 중입니다...</div>;
  }

  if (paymentInfo.noPlan) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold mb-6">요금제 정보</h2>
        <div className="bg-white border border-zinc-200 shadow-sm p-8 rounded-3xl text-center space-y-4">
          <div className="bg-zinc-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">구독 중인 요금제가 없습니다</h3>
            <p className="text-sm text-zinc-500">서비스 이용을 위해 아래 플랜 중 하나를 선택해 주세요.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {['Basic', 'Pro'].map(p => (
            <div key={p} className="bg-white border border-zinc-200 shadow-sm p-8 rounded-3xl hover:border-[#0071e3]/50 transition-all group">
              <div className="text-[#0071e3] text-xs font-bold uppercase mb-4">{p} Plan</div>
              <div className="text-2xl font-black mb-6">
                ₩{p === 'Basic' ? '300,000' : '100,000'}
                <span className="text-xs text-zinc-500 font-normal">{p === 'Basic' ? '(평생 소장)' : '/ 월'}</span>
              </div>
              <button
                onClick={() => navigate('/payment', { state: { plan: p } })}
                className="w-full py-4 bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-900 group-hover:bg-[#0071e3] group-hover:text-white group-hover:border-[#0071e3] transition-all"
              >
                {p} 플랜으로 시작하기
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">요금제 정보</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#0071e3] to-[#0055b3] border border-[#0071e3]/30 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <CreditCard className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase">Current Plan</div>
            <div>
              <h3 className="text-4xl font-black mb-2 text-white">{paymentInfo?.plan_name}</h3>
              <p className="text-blue-100">
                ₩{paymentInfo?.plan_name?.toLowerCase() === 'basic' ? '300,000 / 평생 소장' : '100,000 / 월'}
              </p>
            </div>

            <div className="pt-3 space-y-4 border-t border-white/20">
              <div className="flex justify-between text-xs">
                <span className="text-blue-100 font-bold uppercase tracking-widest text-base">최근 결제일</span>
                <span className="text-white font-medium text-base">
                  {paymentInfo?.last_payment_date ? paymentInfo.last_payment_date.split('T')[0] : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-100 font-bold uppercase tracking-widest text-base">다음 결제일</span>
                <div className="text-right">
                  <span className="text-white font-medium text-base">
                    {paymentInfo?.plan_name?.toLowerCase() === 'pro' ? (
                      <>
                        {paymentInfo?.next_payment_date?.split('T')[0]}
                        <span className="text-blue-200 ml-1">({paymentInfo?.remaining_days}일)</span>
                      </>
                    ) : (
                      '평생 소장'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-blue-100 font-bold uppercase tracking-widest text-base">결제 수단</span>
                <span className="text-white font-medium text-base">{paymentInfo?.payment_method || '등록된 수단 없음'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          {/* 배경에 은은한 상징 아이콘 효과 */}
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            {paymentInfo?.is_cancelling ? (
              <Zap className="w-40 h-40 text-blue-500" />
            ) : (
              <AlertTriangle className="w-40 h-40 text-red-500" />
            )}
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${paymentInfo?.is_cancelling ? 'text-blue-500' : 'text-red-500'}`} />
              {paymentInfo?.is_cancelling ? '구독 해지 예약됨' : '구독 관리 및 해지'}
            </h4>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              {paymentInfo?.is_cancelling ? (
                <>  구독 해지가 예약되었습니다. <span className="text-white font-bold">{paymentInfo?.next_payment_date?.split('T')[0]}</span> 이후에는 서비스를 이용할 수 없습니다.</>
              ) : (
                <>
                  현재 결제 주기 종료일(
                  <span className="text-white font-bold">
                    {paymentInfo?.next_payment_date?.split('T')[0] || '-'}
                  </span>
                  )까지는 모든 기능을 정상적으로 이용하실 수 있습니다.
                </>
              )}
            </p>
          </div>

          <button
            disabled={!isVerified}
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (paymentInfo?.is_cancelling) {
                triggerConfirm(
                  '구독 유지',
                  '해지 예약을 취소하고 구독을 유지하시겠습니까?',
                  async () => {
                    const res = await fetch('http://localhost:8001/api/v1/payments/resume', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      toast.success('구독 유지가 확정되었습니다.');
                      refetchPayment();
                    }
                  },
                  'blue'
                );
              } else {
                triggerConfirm(
                  '구독 해지',
                  '정말 구독을 해지하시겠습니까? 해지 후에도 현재 주기가 끝날 때까지는 이용 가능합니다.',
                  async () => {
                    const res = await fetch('http://localhost:8001/api/v1/payments/cancel', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      toast.success('해지 예약되었습니다.');
                      refetchPayment();
                    }
                  },
                  'red'
                );
              }
            }}
            className={`w-full py-4 font-bold rounded-2xl transition-all border ${!isVerified
                ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : paymentInfo?.is_cancelling
                  ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
              }`}
          >
            {!isVerified ? '승인 대기 중' : paymentInfo?.is_cancelling ? '구독 해지 취소하기 (구독 유지)' : '구독 멤버십 해지하기'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <Zap className="w-5 h-5 text-yellow-400" /> 요금제 변경
        </h3>
        <div className="grid md:grid-cols-1 gap-6">
          {['Basic', 'Pro'].filter(p => p.toLowerCase() !== paymentInfo?.plan_name?.toLowerCase()).map(p => (
            <div key={p} className="bg-white border border-zinc-200 shadow-sm p-8 rounded-3xl hover:border-[#0071e3]/50 transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-[#0071e3] text-[10px] font-bold uppercase tracking-widest">
                  {p === 'Pro' ? 'Upgrade to' : 'Switch to'} {p}
                </div>
                <div className="text-2xl font-black text-zinc-900">
                  ₩{p === 'Basic' ? '300,000' : '100,000'}
                  <span className="text-xs text-zinc-500 font-normal">{p === 'Basic' ? ' (평생 소장)' : ' / 월 (VAT 포함)'}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  {p === 'Pro' ? '무제한 API 키 및 고급 협업 기능을 이용해보세요.' : '필수적인 법규 검토 기능을 합리적인 가격에 이용해보세요.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/payment', { state: { plan: p, currentPlan: paymentInfo?.plan_name } })}
                className="px-8 py-4 bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-900 group-hover:bg-[#0071e3] group-hover:text-white group-hover:border-[#0071e3] transition-all whitespace-nowrap"
              >
                {p === 'Pro' ? 'Pro로 업그레이드' : 'Basic으로 변경'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};