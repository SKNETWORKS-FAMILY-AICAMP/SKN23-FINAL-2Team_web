/*
File    : src/app/components/auth/SignupForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 비밀번호 재설정 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ResetPasswordStep = ({ onChange, onSubmit, isLoading }: Props) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-4">
    <div className="text-center space-y-2">
      <div className="w-12 h-12 bg-[#0071e3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <KeyRound className="text-[#0071e3]" />
      </div>
      <h3 className="text-xl font-bold">새 비밀번호 설정</h3>
      <p className="text-sm text-zinc-400">보안을 위해 새로운 비밀번호를 입력해주세요.</p>
    </div>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>새 비밀번호</Label>
        <Input name="newPassword" type="password" placeholder="영문+숫자+특수문자 8자 이상" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
      </div>
      <div className="space-y-2">
        <Label>비밀번호 확인</Label>
        <Input name="newPasswordConfirm" type="password" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
      </div>
      <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={onSubmit} disabled={isLoading}>
        {isLoading ? '변경 중...' : '비밀번호 변경 완료'}
      </Button>
    </div>
  </motion.div>
);