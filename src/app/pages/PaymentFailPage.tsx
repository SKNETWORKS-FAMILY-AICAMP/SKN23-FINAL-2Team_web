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
import { XCircle, ChevronLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const errorMessage = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
  const errorCode = searchParams.get('code');

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl text-center space-y-6"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black">결제 실패</h2>
          <p className="text-zinc-400">{errorMessage}</p>
          {errorCode && <p className="text-xs text-zinc-600 font-mono italic">Error Code: {errorCode}</p>}
        </div>
        
        <div className="pt-6 space-y-3">
          <button 
            onClick={() => navigate('/payment')} 
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-2xl transition-all"
          >
            다시 시도하기
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-transparent border border-white/10 hover:bg-white/5 text-zinc-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> 메인으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
