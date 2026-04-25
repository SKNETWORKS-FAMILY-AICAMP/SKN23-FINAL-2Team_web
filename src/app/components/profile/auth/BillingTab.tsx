/*
File    : src/app/components/profile/BillingTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 요금제 및 결제 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 현재 플랜 정보 내 결제일, 다음 구독일, 남은 일수 표시 기능 추가
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
}

export const BillingTab: React.FC<BillingTabProps> = ({
  isLoadingPayment,
  paymentInfo,
  isVerified,
  triggerConfirm,
  navigate
}) => {
  if (isLoadingPayment || !paymentInfo) {
    return <div className="text-center py-12 text-zinc-500 animate-pulse">정보를 불러오는 중입니다...</div>;
  }

  if (paymentInfo.noPlan) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold mb-6">요금제 정보</h2>
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl text-center space-y-4">
          <div className="bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">구독 중인 요금제가 없습니다</h3>
            <p className="text-sm text-zinc-400">서비스 이용을 위해 아래 플랜 중 하나를 선택해 주세요.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {['Basic', 'Pro'].map(p => (
            <div key={p} className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl hover:border-[#0071e3]/50 transition-all group">
              <div className="text-[#abc7ff] text-xs font-bold uppercase mb-4">{p} Plan</div>
              <div className="text-2xl font-black mb-6">
                ₩{p === 'Basic' ? '300,000' : '100,000'}
                <span className="text-xs text-zinc-500 font-normal">{p === 'Basic' ? '(평생 소장)' : '/ 월'}</span>
              </div>
              <button
                onClick={() => navigate('/payment', { state: { plan: p } })}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold group-hover:bg-[#0071e3] transition-all"
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
        <div className="bg-gradient-to-br from-[#0071e3]/20 to-zinc-900 border border-[#0071e3]/30 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <CreditCard className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-block px-3 py-1 bg-[#0071e3]/20 text-[#abc7ff] text-xs font-bold rounded-full uppercase">Current Plan</div>
            <div>
              <h3 className="text-4xl font-black mb-2">{paymentInfo?.plan_name}</h3>
              <p className="text-zinc-400">
                ₩{paymentInfo?.plan_name?.toLowerCase() === 'basic' ? '300,000 / 평생 소장' : '100,000 / 월'}
              </p>
            </div>

            <div className="pt-3 space-y-4 border-t border-white/20">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold uppercase tracking-widest text-base">최근 결제일</span>
                <span className="text-white font-medium text-base">
                  {paymentInfo?.last_payment_date ? paymentInfo.last_payment_date.split('T')[0] : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold uppercase tracking-widest text-base">다음 결제일</span>
                <div className="text-right">
                  <span className="text-white font-medium text-base">
                    {paymentInfo?.plan_name?.toLowerCase() === 'pro' ? (
                      <>
                        {paymentInfo?.next_payment_date?.split('T')[0]}
                        <span className="text-blue-400 ml-1">({paymentInfo?.remaining_days}일)</span>
                      </>
                    ) : (
                      '평생 소장'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold uppercase tracking-widest text-base">결제 수단</span>
                <span className="text-white font-medium text-base">{paymentInfo?.payment_method || '등록된 수단 없음'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          {/* 배경에 은은한 경고 아이콘 효과 */}
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-40 h-40 text-red-500" />
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> 구독 관리 및 해지
            </h4>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              현재 결제 주기 종료일(
              <span className="text-white font-bold">
                {paymentInfo?.next_payment_date?.split('T')[0] || '-'}
              </span>
              )까지는 모든 기능을 정상적으로 이용하실 수 있습니다.
            </p>
          </div>

          <button
            disabled={!isVerified}
            onClick={() =>
              triggerConfirm(
                '구독 해지',
                '정말 구독을 해지하시겠습니까? 해지 후에도 현재 주기가 끝날 때까지는 이용 가능합니다.',
                () => toast.success('해지 예약되었습니다.'),
                'red'
              )
            }
            className={`w-full py-4 font-bold rounded-2xl transition-all border ${
              isVerified
                ? 'border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10'
                : 'border-white/5 bg-white/5 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isVerified ? '구독 멤버십 해지하기' : '승인 대기 중'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <Zap className="w-5 h-5 text-yellow-400" /> 요금제 변경
        </h3>
        <div className="grid md:grid-cols-1 gap-6">
          {['Basic', 'Pro'].filter(p => p.toLowerCase() !== paymentInfo?.plan_name?.toLowerCase()).map(p => (
            <div key={p} className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl hover:border-[#0071e3]/50 transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-[#abc7ff] text-[10px] font-bold uppercase tracking-widest">
                  {p === 'Pro' ? 'Upgrade to' : 'Switch to'} {p}
                </div>
                <div className="text-2xl font-black">
                  ₩{p === 'Basic' ? '300,000' : '100,000'}
                  <span className="text-xs text-zinc-300 font-normal">{p === 'Basic' ? ' (평생 소장)' : ' / 월 (VAT 포함)'}</span>
                </div>
                <p className="text-xs text-zinc-400">
                  {p === 'Pro' ? '무제한 API 키 및 고급 협업 기능을 이용해보세요.' : '필수적인 법규 검토 기능을 합리적인 가격에 이용해보세요.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/payment', { state: { plan: p, currentPlan: paymentInfo?.plan_name } })}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold group-hover:bg-[#0071e3] group-hover:text-white transition-all whitespace-nowrap"
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