/*
File    : src/app/components/auth/EmailVerification.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 이메일 인증 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React, { useState, useRef } from 'react';
import { Input, Button } from "@shared/ui/forms";
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

export const VerificationStep = ({ email, onChange, onVerify, onResend, onBack, isLoading }: Props) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusNext = (index: number) => {
    if (index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }, 10);
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      setTimeout(() => {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }, 10);
    }
  };

  // 6자리가 모두 채워지면 자동으로 인증 완료 함수 호출
  React.useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && code.every((c) => c !== '')) {
      const timer = setTimeout(() => {
        onVerify();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [code, onVerify]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        focusPrev(index);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusPrev(index);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusNext(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const chars = pastedData.split('');
    const newCode = [...code];
    chars.forEach((c, i) => {
      newCode[i] = c;
    });
    setCode(newCode);
    
    const fullCode = newCode.join('');
    onChange({ target: { name: 'verificationCode', value: fullCode } } as any);

    if (fullCode.length === 6) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-5`);
        if (nextInput) nextInput.focus();
      }, 10);
    } else {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-${Math.min(chars.length, 5)}`);
        if (nextInput) nextInput.focus();
      }, 10);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length === 6) {
      const chars = value.split('');
      setCode(chars);
      onChange({ target: { name: 'verificationCode', value } } as any);
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-5`);
        if (nextInput) nextInput.focus();
      }, 10);
      return;
    }

    // 입력된 마지막 글자만 가져옵니다.
    const char = value.slice(-1);
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    
    const fullCode = newCode.join('');
    onChange({ target: { name: 'verificationCode', value: fullCode } } as any);

    // 문자가 입력되었을 때만 다음으로 포커스 이동
    if (char) {
      focusNext(index);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pt-0 pb-4">
      <div className="flex items-center space-x-2 text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors" onClick={onBack}>
        <ArrowLeft size={16} /> <span className="text-sm">뒤로 가기</span>
      </div>
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-[#0071e3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-[#0071e3]" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">이메일 인증</h3>
        <p className="text-sm text-zinc-500">{email}로 발송된<br />6자리 인증 코드를 입력해주세요.</p>
      </div>
      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              id={`otp-input-${index}`}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className="w-10 h-12 sm:w-12 sm:h-14 px-0 bg-zinc-50 border-zinc-200 text-zinc-900 text-center text-xl font-bold rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:bg-white transition-all"
            />
          ))}
        </div>
        <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12" onClick={onVerify} disabled={isLoading}>
          {isLoading ? '확인 중...' : '인증 완료'}
        </Button>
        <p className="text-xs text-zinc-500 text-center">
          메일을 받지 못하셨나요? <button className="text-[#0071e3] hover:underline font-semibold" onClick={onResend}>다시 보내기</button>
        </p>
      </div>
    </motion.div>
  );
};