/*
File    : src/app/components/auth/PinLoginForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 4자리 PIN 관리자 로그인 폼
Modification History:
    - 2026-04-27 : 라이트 테마, 4자리 자동 제출로 개선
*/
import React, { useState, useRef } from 'react';
import { useAdminAuth } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface PinLoginFormProps {
  onSuccess: () => void;
}

export const PinLoginForm: React.FC<PinLoginFormProps> = ({ onSuccess }) => {
  const { adminLogin } = useAdminAuth();
  const [pins, setPins] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPins = [...pins];
    newPins[index] = value.slice(-1);
    setPins(newPins);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // 4자리 완성 시 자동 제출
    if (value && index === 3) {
      const fullPin = [...newPins.slice(0, 3), value.slice(-1)].join('');
      if (fullPin.length === 4) {
        await submitPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      const fullPin = pins.join('');
      if (fullPin.length === 4) submitPin(fullPin);
    }
  };

  const submitPin = async (pin: string) => {
    setIsLoading(true);
    const result = await adminLogin(pin);
    setIsLoading(false);
    if (result.success) {
      toast.success('인증되었습니다.');
      onSuccess();
    } else {
      toast.error(result.message ?? 'PIN이 올바르지 않습니다.');
      setPins(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pins.join('');
    if (fullPin.length < 4) {
      toast.error('4자리 PIN을 모두 입력해주세요.');
      return;
    }
    submitPin(fullPin);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-1">
          <ShieldCheck className="w-7 h-7 text-[#1e40af]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">관리자 인증</h2>
        <p className="text-sm text-slate-500">4자리 PIN 번호를 입력하세요</p>
      </div>

      {/* 4자리 PIN 입력 박스 */}
      <div className="flex gap-3">
        {pins.map((pin, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={pin}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isLoading}
            autoFocus={i === 0}
            className="w-14 h-16 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:border-[#1e40af] focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading || pins.join('').length < 4}
        className="w-full bg-[#1e40af] text-white py-3.5 rounded-xl font-bold text-sm
                   hover:bg-[#1d3a9e] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            인증 중...
          </>
        ) : '입장하기'}
      </button>
    </form>
  );
};
