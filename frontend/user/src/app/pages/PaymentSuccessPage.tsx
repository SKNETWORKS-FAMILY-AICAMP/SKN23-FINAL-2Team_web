/*
File    : src/app/pages/PaymentSuccessPage.tsx
Author  : 김민정
Create  : 2026-04-21
Description : 결제 승인 성공 시 처리 및 자동 API 키 발급 안내 페이지

Modification History:
    - 2026-04-21 (김민정) : 초기 생성 및 토스 페이먼츠 승인 연동
    - 2026-04-22 (김민정) : 자동 API 키 발급 결과 전시 및 UI 개선
    - 2026-04-26 (김민정) : 결제수단 추가 및 결제취소 기능 추가
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { API_BASE_URL } from '@/app/api/client';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isConfirming, setIsConfirming] = useState(true);
  const [autoKey, setAutoKey] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const plan_name = localStorage.getItem('pending_plan_name') || 'Basic';

      if (!paymentKey || !orderId || !amount) {
        toast.error('결제 정보가 올바르지 않습니다.');
        navigate('/payment');
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        const pending_added_seats = localStorage.getItem('pending_added_seats') || '0';
        const pending_incremental_added_seats = localStorage.getItem('pending_incremental_added_seats') || pending_added_seats;
        const pending_payment_mode = localStorage.getItem('pending_payment_mode') || 'plan';

        const response = await fetch(`${API_BASE_URL}/payments/toss-confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            plan_name,
            added_seats: Number(pending_added_seats),
            incremental_added_seats: Number(pending_incremental_added_seats),
            payment_type: pending_payment_mode === 'addSeats' ? 'seat_addon' : 'subscription'
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success(data.auto_key ? '결제 완료 및 첫 API 키 발급 완료!' : '결제 완료!');
          if (data.auto_key) {
            setAutoKey(data.auto_key);
          }
          if (refreshUser) await refreshUser();
          localStorage.removeItem('pending_payment_mode');
          localStorage.removeItem('pending_added_seats');
          localStorage.removeItem('pending_incremental_added_seats');
          localStorage.removeItem('pending_total_seats');
          localStorage.removeItem('pending_amount');
          localStorage.removeItem('pending_plan_name');
          setIsConfirming(false);
          // 꿀팁: 자동 발급된 키가 있으면 조금 더 오래 보여줌
          setTimeout(() => navigate('/profile'), data.auto_key ? 6000 : 3000);
        } else {
          toast.error(data.message || '결제 승인 중 오류가 발생했습니다.');
          navigate('/payment/fail');
        }
      } catch (error) {
        console.error('Payment Confirm Error', error);
        toast.error('서버 승인 요청 중 오류가 발생했습니다.');
        navigate('/payment/fail');
      }
    };

    confirmPayment();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-zinc-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-zinc-200 p-10 rounded-2xl text-center space-y-6 shadow-xl shadow-zinc-200/70"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-16 h-16 text-[#0071e3] animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black">결제 최종 승인 중</h2>
              <p className="text-zinc-500">잠시만 기다려주세요. 결제와 구독 정보를 안전하게 확인하고 있습니다.</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black">결제 완료</h2>
              <p className="text-zinc-500">구독이 성공적으로 시작되었습니다.</p>

              {autoKey && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-[10px] text-[#0071e3] font-bold uppercase tracking-widest text-left flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3" />
                    Auto-Generated API Key
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border border-blue-100 text-xs text-zinc-700 font-mono text-left break-all select-all">
                      {autoKey}
                    </code>
                  </div>
                  <p className="text-[10px] text-zinc-500 text-left leading-relaxed">
                    첫 API 키가 자동으로 발급되었습니다.<br />
                    마이페이지의 API Key 관리 탭에서 확인할 수 있습니다.
                  </p>
                </div>
              )}

              <p className="text-xs text-zinc-400 pt-4">잠시 후 마이페이지로 이동합니다.</p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
