/*
File    : src/app/pages/PaymentFailPage.tsx
Author  : 김민정
Create  : 2026-04-21
Description : 결제 실패 시 사유 전시 및 재시도 안내 페이지

Modification History:
    - 2026-04-21 (김민정) : 초기 생성
    
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { XCircle, ChevronLeft } from 'lucide-react';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const errorMessage = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
  const errorCode = searchParams.get('code');

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-zinc-900 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-zinc-200 p-10 rounded-2xl text-center space-y-6 shadow-xl shadow-zinc-200/70"
      >
        <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black">결제 실패</h2>
          <p className="text-zinc-500">{errorMessage}</p>
          {errorCode && <p className="text-xs text-zinc-400 font-mono italic">Error Code: {errorCode}</p>}
        </div>
        
        <div className="pt-6 space-y-3">
          <button 
            onClick={() => navigate('/payment')} 
            className="w-full py-4 bg-[#0071e3] text-white hover:brightness-110 font-bold rounded-xl transition-all"
          >
            다시 시도하기
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> 메인으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
