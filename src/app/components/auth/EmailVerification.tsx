/*
File    : src/app/components/auth/EmailVerification.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 이메일 인증 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  email: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const VerificationStep = ({ email, onChange, onVerify, onResend, onBack, isLoading }: Props) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 py-4">
    <div className="flex items-center space-x-2 text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={onBack}>
      <ArrowLeft size={16} /> <span className="text-sm">뒤로 가기</span>
    </div>
    <div className="text-center space-y-2">
      <div className="w-12 h-12 bg-[#0071e3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="text-[#0071e3]" />
      </div>
      <h3 className="text-xl font-bold">이메일 인증</h3>
      <p className="text-sm text-zinc-400">{email}로 발송된<br />6자리 인증 코드를 입력해주세요.</p>
    </div>
    <div className="space-y-4">
      <Input name="verificationCode" placeholder="000000" maxLength={6} onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white text-center text-2xl tracking-[1em] font-mono h-16" />
      <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={onVerify} disabled={isLoading}>
        {isLoading ? '확인 중...' : '인증 완료'}
      </Button>
      <p className="text-xs text-zinc-500 text-center">
        메일을 받지 못하셨나요? <button className="text-[#0071e3] hover:underline" onClick={onResend}>다시 보내기</button>
      </p>
    </div>
  </motion.div>
);