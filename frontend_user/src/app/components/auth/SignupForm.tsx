/*
File    : src/app/components/auth/SignupForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 회원가입 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React from 'react';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

interface Props {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (type: 'signup') => void;
  isLoading: boolean;
}

export const SignupForm = ({ onChange, onFileChange, onSubmit, isLoading }: Props) => (
  <div className="space-y-4 outline-none">
    <div className="space-y-2">
      <Label htmlFor="companyName">기업명</Label>
      <Input id="companyName" name="companyName" placeholder="주식회사 케이던스" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="certificate">사업자등록증 파일 첨부 (.pdf)</Label>
      <Input id="certificate" name="certificate" type="file" accept=".pdf" onChange={onFileChange} className="bg-zinc-900 border-zinc-800 text-white file:bg-[#0071e3] file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:hover:cursor-pointer" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-email">담당자 이메일</Label>
      <Input id="signup-email" name="email" placeholder="manager@cadence.ai" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-password">비밀번호 (8자 이상, 영문+숫자+특수문자)</Label>
      <Input id="signup-password" name="password" type="password" placeholder="조합하여 8자 이상" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
      <Input id="passwordConfirm" name="passwordConfirm" type="password" onChange={onChange} className="bg-zinc-900 border-zinc-800 text-white" />
    </div>
    <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={() => onSubmit('signup')} disabled={isLoading}>
      {isLoading ? '가입 신청 중...' : '회원가입 신청'}
    </Button>
    <p className="text-[10px] text-zinc-500 text-center">가입 신청 시 입력하신 이메일로 인증 코드가 발송됩니다.</p>
  </div>
);