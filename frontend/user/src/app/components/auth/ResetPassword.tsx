/*
File    : src/app/components/auth/SignupForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 비밀번호 재설정 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React, { useState } from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ResetPasswordStep = ({ onChange, onSubmit, isLoading }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pt-0 pb-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-[#0071e3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="text-[#0071e3]" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">새 비밀번호 설정</h3>
        <p className="text-sm text-zinc-500">보안을 위해 새로운 비밀번호를 입력해주세요.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-900 font-semibold">새 비밀번호</Label>
          <div className="relative">
            <Input 
              name="newPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="영문+숫자+특수문자 8자 이상" 
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
        <div className="space-y-2">
          <Label className="text-zinc-900 font-semibold">비밀번호 확인</Label>
          <div className="relative">
            <Input 
              name="newPasswordConfirm" 
              type={showConfirmPassword ? "text" : "password"} 
              onChange={onChange} 
              className="bg-zinc-50 border-zinc-200 text-zinc-900 pr-10" 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? '변경 중...' : '비밀번호 변경 완료'}
        </Button>
      </div>
    </motion.div>
  );
};