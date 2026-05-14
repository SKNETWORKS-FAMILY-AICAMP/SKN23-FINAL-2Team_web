/*
File    : src/app/components/auth/SignupForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 회원가입 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
    - 2026-04-27 (지우개) : B2B SaaS 모던 콤팩트 UI (세로 길이 축소, 2단 그리드 적용) 및 실시간 중복 체크 추가
    - 2026-05-14 (김지우) : 분할 인증 모달 레이아웃에 맞춰 하단 로그인 링크 중복 제거
*/
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input, Button, Label } from "@shared/ui/forms";

import { toast } from 'sonner';
import { verifyApi } from '@/app/api/email_verify';

interface Props {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (type: 'signup') => void;
  onSetTab: (tab: any) => void;
  isLoading: boolean;
}

export const SignupForm = ({ onChange, onFileChange, onSubmit, onSetTab, isLoading }: Props) => {
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy' | null>(null);
  const [mounted, setMounted] = useState(false);

  const [localEmail, setLocalEmail] = useState("");
  const [localPw, setLocalPw] = useState("");
  const [localPwConfirm, setLocalPwConfirm] = useState("");
  const [emailState, setEmailState] = useState<'idle' | 'available' | 'sent' | 'verified'>('idle');
  const [verifyCode, setVerifyCode] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [localCompanyName, setLocalCompanyName] = useState("");
  const [companyMessage, setCompanyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!localCompanyName) {
      setCompanyMessage(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await verifyApi.checkCompany(localCompanyName);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setCompanyMessage({ text: "사용 가능한 기업명입니다.", type: 'success' });
      } catch (e: any) {
        setCompanyMessage({ text: "이미 사용중인 이름입니다.", type: 'error' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localCompanyName]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
    onFileChange(e);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'companyName') setLocalCompanyName(value);
    if (name === 'email') {
      setLocalEmail(value);
      setEmailState('idle'); // 이메일 수정 시 상태 초기화
      setEmailMessage(null); // 메시지 초기화
    }
    if (name === 'password') setLocalPw(value);
    if (name === 'passwordConfirm') setLocalPwConfirm(value);
    onChange(e); // 부모로 전달
  };

  const handleEmailAction = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localEmail)) {
      toast.error("이메일 형식으로 입력하세요.");
      return;
    }

    if (emailState === 'idle') {
      try {
        const res = await verifyApi.checkEmail(localEmail);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setEmailMessage({ text: "사용 가능한 이메일입니다.", type: 'success' });
        setEmailState('available');
      } catch (e: any) {
        setEmailMessage({ text: "중복된 이메일입니다.", type: 'error' });
        // 에러 지속 표시 위해 setTimeout 제거 (혹은 유지 가능하므로 사용자가 명시한 빨간 문구를 유지합니다)
      }
    } else if (emailState === 'available') {
      try {
        const res = await verifyApi.sendCode(localEmail);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        toast.success("인증 번호가 발송되었습니다.");
        setEmailState('sent');
      } catch (e: any) {
        toast.error(e.message || "발송 실패");
      }
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await verifyApi.verifyCode(localEmail, verifyCode);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      toast.success("이메일 인증이 완료되었습니다.");
      setEmailState('verified');
    } catch (e: any) {
      toast.error(e.message || "인증 번호가 일치하지 않습니다.");
    }
  };

  const handleSubmit = () => {
    if (!localCompanyName) {
      toast.error("기업명을 입력해주세요.");
      return;
    }
    if (!fileName) {
      toast.error("사업자등록증을 첨부해주세요.");
      return;
    }
    if (!localEmail || !localPw || !localPwConfirm) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,25}$/;
    if (!pwRegex.test(localPw)) {
      toast.error("비밀번호는 영문, 숫자를 포함하여 8자 이상 입력해주세요.");
      return;
    }
    if (localPw !== localPwConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (companyMessage?.type === 'error') {
      toast.error("기업명이 중복되었습니다. 다른 이름을 사용해주세요.");
      return;
    }
    if (emailState !== 'verified') {
      toast.error("이메일 인증을 완료해주세요.");
      return;
    }
    if (!termsAgreed) {
      toast.error("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    onSubmit('signup');
  };

  const renderEmailButton = () => {
    if (emailState === 'idle') return '중복 확인';
    if (emailState === 'available') return '인증하기';
    if (emailState === 'sent') return '재발송';
    if (emailState === 'verified') return '인증완료';
    return '';
  };

  return (
    <>
      <div className="space-y-4 outline-none">
        {/* 1. 기업명 */}
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-[12px] font-semibold text-zinc-700">기업명</Label>
          <Input
            id="companyName"
            name="companyName"
            placeholder="기업명"
            onChange={handleLocalChange}
            className="h-10 rounded-lg px-3 bg-white border-zinc-200 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 shadow-sm"
          />
          {companyMessage && (
            <p className={`text-[11px] font-bold ${companyMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {companyMessage.text}
            </p>
          )}
        </div>

        {/* 2. 사업자등록증 */}
        <div className="space-y-1.5">
          <Label className="text-[12px] font-semibold text-zinc-700">사업자등록증 첨부</Label>
          <div className="flex gap-2">
            <Input
              placeholder="사업자등록증을 첨부해주세요"
              value={fileName}
              readOnly
              className="h-10 rounded-lg px-3 bg-zinc-50 border-zinc-200 text-[13px] text-zinc-500 flex-1 cursor-pointer shadow-sm focus-visible:ring-0 focus-visible:border-zinc-200"
              onClick={handleFileClick}
            />
            <Button
              variant="outline"
              type="button"
              onClick={handleFileClick}
              className="h-10 rounded-lg px-4 border-zinc-200 text-zinc-700 text-[13px] font-semibold bg-white hover:bg-zinc-50 shrink-0 shadow-sm transition-colors"
            >
              찾아보기
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.png"
              onChange={handleFileChangeLocal}
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-medium tracking-tight">
            가입 후 관리자 승인 완료 시 서비스가 활성화됩니다.
          </p>
        </div>

        {/* 3. 담당자 이메일 */}
        <div className="space-y-1.5">
          <Label htmlFor="signup-email" className="text-[12px] font-semibold text-zinc-700">담당자 이메일</Label>
          <div className="flex gap-2">
            <Input
              id="signup-email"
              name="email"
              type="email"
              placeholder="이메일을 입력하세요"
              onChange={handleLocalChange}
              disabled={emailState === 'verified'}
              className={`h-10 rounded-lg px-3 bg-white border-zinc-200 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 shadow-sm flex-1 ${emailState === 'verified' && 'opacity-50 cursor-not-allowed'}`}
            />
            <Button
              variant="outline"
              type="button"
              onClick={handleEmailAction}
              disabled={emailState === 'verified'}
              className={`h-10 rounded-lg w-[90px] border-zinc-200 text-[13px] font-semibold shrink-0 transition-colors ${emailState === 'verified' ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
            >
              {renderEmailButton()}
            </Button>
          </div>
          {/* 이미 등록된 이메일 등 상태 알림 즉각 표시 */}
          {emailMessage && (
            <p className={`text-[11px] font-bold ${emailMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {emailMessage.text}
            </p>
          )}
          {/* 인증번호 입력 칸 */}
          {emailState === 'sent' && (
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                maxLength={6}
                placeholder="인증번호 6자리"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="h-10 rounded-lg px-3 bg-zinc-50 border-zinc-200 text-[13px] text-zinc-900 tracking-widest flex-1 text-center font-bold"
              />
              <Button
                variant="default"
                type="button"
                onClick={handleVerifyCode}
                className="h-10 rounded-lg w-[90px] bg-zinc-900 text-white text-[13px] font-semibold shrink-0"
              >
                인증하기
              </Button>
            </div>
          )}
        </div>

        {/* 4. 비밀번호 영역 (세로 길이를 줄이기 위해 Grid 로 2칸 배치 및 경고문구 묶음) */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-[12px] font-semibold text-zinc-700">비밀번호</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="••••••••"
                onChange={handleLocalChange}
                className="h-10 rounded-lg px-3 bg-white border-zinc-200 text-[13px] text-zinc-900 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 shadow-sm tracking-widest placeholder:tracking-normal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-[12px] font-semibold text-zinc-700">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                onChange={handleLocalChange}
                className="h-10 rounded-lg px-3 bg-white border-zinc-200 text-[13px] text-zinc-900 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 shadow-sm tracking-widest placeholder:tracking-normal"
              />
            </div>
          </div>

          {/* 동일 여부 표시 */}
          {(localPw || localPwConfirm) && (
            <div className="text-left px-1">
              {localPw.length > 0 && !/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,25}$/.test(localPw) ? (
                <span className="text-[11px] font-bold text-red-500">영문, 숫자를 포함하여 8자 이상 입력해주세요.</span>
              ) : localPwConfirm.length > 0 && localPw !== localPwConfirm ? (
                <span className="text-[11px] font-bold text-red-500">비밀번호가 일치하지 않습니다.</span>
              ) : localPw.length > 0 && localPw === localPwConfirm ? (
                <span className="text-[11px] font-bold text-green-500">비밀번호가 일치합니다.</span>
              ) : null}
            </div>
          )}
        </div>

        {/* 약관 동의 */}
        <div className="flex items-center gap-1.5 pt-1 pb-1">
          <input
            type="checkbox"
            id="terms"
            className="w-3.5 h-3.5 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
          />
          <Label htmlFor="terms" className="text-[12px] text-zinc-600 font-medium cursor-pointer select-none">
            <span className="text-[#0071e3] font-semibold hover:underline" onClick={(e) => { e.preventDefault(); setModalContent('terms'); }}>이용약관</span> 및 <span className="text-[#0071e3] font-semibold hover:underline" onClick={(e) => { e.preventDefault(); setModalContent('privacy'); }}>개인정보처리방침</span> 동의
          </Label>
        </div>

        {/* 가입 버튼 */}
        <Button
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold h-11 rounded-lg text-[14px] mt-2 shadow-sm transition-all"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '가입 신청 중...' : '회원가입'}
        </Button>

      </div>

      {/* 약관 모달 (깔끔하게 정돈) */}
      {mounted && modalContent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[440px] max-h-[80vh] flex flex-col overflow-hidden text-left">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-white">
              <h2 className="text-[15px] font-bold tracking-tight text-zinc-900">
                {modalContent === 'terms' ? 'Cadence AI 이용약관' : '개인정보처리방침'}
              </h2>
              <button onClick={() => setModalContent(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto text-[13px] text-zinc-600 leading-relaxed space-y-6">
              {modalContent === 'terms' ? (
                <>
                  <section>
                    <h3 className="text-[13px] font-bold text-zinc-900 mb-1.5">제1조 (목적)</h3>
                    <p>본 약관은 주식회사 케이던스(이하 "회사")가 제공하는 Cadence AI (AutoCAD 지능형 코파일럿) 서비스의 이용 조건, 절차 및 회사와 회원 간의 권리, 의무를 규정함을 목적으로 합니다.</p>
                  </section>
                  <section>
                    <h3 className="text-[13px] font-bold text-zinc-900 mb-1.5">제2조 (서비스의 제공)</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>회사는 AutoCAD 도면 기반 법적 검토, 설계 자동화, 물량 산출 및 도면 엔티티 분석 등의 AI 서비스를 제공합니다.</li>
                      <li>회사는 서비스 품질 향상과 AI 학습을 위해 회원이 동의한 범위 내에서 업로드한 도면 메타데이터를 활용할 수 있습니다.</li>
                    </ul>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="text-[13px] font-bold text-zinc-900 mb-1.5">1. 수집하는 개인정보 항목</h3>
                    <ul className="list-disc pl-4 text-zinc-500">
                      <li><span className="font-semibold text-zinc-700">필수:</span> 기업명, 담당자 이메일, 비밀번호, 사업자등록증 첨부본</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-[13px] font-bold text-zinc-900 mb-1.5">2. 개인정보의 수집 및 이용 목적</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>B2B 기업 회원 인증 및 가입 승인 절차 진행</li>
                      <li>Cadence AI 도면 분석 서비스 제공 및 맞춤형 기술 지원</li>
                    </ul>
                  </section>
                </>
              )}
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 flex justify-end bg-white">
              <Button onClick={() => setModalContent(null)} className="bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold h-10 px-6 rounded-lg">
                확인
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
