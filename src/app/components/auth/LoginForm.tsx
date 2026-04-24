/*
File    : src/app/components/auth/LoginForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 로그인 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft } from 'lucide-react';
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
  if (mode === 'forgot_password') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 py-4">
        <div className="flex items-center space-x-2 text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={() => onSetTab('login')}>
          <ArrowLeft size={16} /> <span className="text-sm">로그인으로 돌아가기</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">비밀번호 찾기</h3>
          <p className="text-sm text-zinc-400">가입하신 이메일 주소를 입력하시면 인증 코드를 보내드립니다.</p>
        </div>
        <div className="space-y-4">
          <Input name="email" placeholder="example@cadence.ai" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
          <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={onRequestReset} disabled={isLoading}>
            {isLoading ? '발송 중...' : '인증 코드 발송'}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 outline-none">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" placeholder="example@cadence.ai" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">비밀번호</Label>
          <button type="button" className="text-xs text-[#0071e3] hover:underline" onClick={() => onSetTab('forgot_password')}>
            비밀번호를 잊었나요?
          </button>
        </div>
        <Input id="password" name="password" type="password" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
      </div>
      <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={() => onSubmit('login')} disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </div>
  );
};