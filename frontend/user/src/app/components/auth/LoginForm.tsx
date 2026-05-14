/*
File    : src/app/components/auth/LoginForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 로그인 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
    - 2026-05-14 (김지우) : 분할 인증 모달 레이아웃에 맞춰 하단 회원가입 링크 중복 제거
*/
import React, { useState } from 'react';
import { Input, Button, Label } from "@shared/ui/forms";
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  mode: 'login' | 'forgot_password';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (type: 'login') => void;
  onRequestReset: () => void;
  onSetTab: (tab: any) => void;
  isLoading: boolean;
}

export const LoginForm = ({ mode, onChange, onSubmit, onRequestReset, onSetTab, isLoading }: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  if (mode === 'forgot_password') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 pt-0 pb-4">
        <div className="flex items-center space-x-2 text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors" onClick={() => onSetTab('login')}>
          <ArrowLeft size={16} /> <span className="text-sm">로그인으로 돌아가기</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-900">비밀번호 찾기</h3>
          <p className="text-sm text-zinc-500">가입하신 이메일 주소를 입력하시면 인증 코드를 보내드립니다.</p>
        </div>
        <div className="space-y-4">
          <Input name="email" placeholder="이메일을 입력하세요" onChange={onChange} className="bg-zinc-50 border-zinc-200 text-zinc-900" />
          <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={onRequestReset} disabled={isLoading}>
            {isLoading ? '발송 중...' : '인증 코드 발송'}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 outline-none">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-900 font-semibold">아이디</Label>
        <Input id="email" name="email" placeholder="이메일을 입력하세요" onChange={onChange} className="bg-zinc-50 border-zinc-200 text-zinc-900" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-900 font-semibold">비밀번호</Label>
        <div className="relative">
          <Input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="비밀번호을 입력하세요" 
            onChange={onChange} 
            className="bg-zinc-50 border-zinc-200 text-zinc-900 pr-10" 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="keep-login" className="rounded border-zinc-300 text-[#0071e3] focus:ring-[#0071e3] w-4 h-4 bg-zinc-50" />
          <Label htmlFor="keep-login" className="text-xs text-zinc-600 cursor-pointer font-medium">로그인 유지</Label>
        </div>
        <button type="button" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors font-medium" onClick={() => onSetTab('forgot_password')}>
          비밀번호를 잊으셨나요?
        </button>
      </div>
      <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 flex items-center justify-center gap-2" onClick={() => onSubmit('login')} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : '로그인'}
      </Button>
    </div>
  );
};
