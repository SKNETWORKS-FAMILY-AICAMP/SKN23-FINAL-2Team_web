/*
File    : src/app/components/auth/SignupForm.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 회원가입 폼 UI

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
    onFileChange(e);
  };

  const handleSubmit = () => {
    if (!termsAgreed) {
      alert("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    onSubmit('signup');
  };

  return (
    <>
      <div className="space-y-2 outline-none px-1">
        <div className="space-y-1">
          <Label htmlFor="companyName" className="text-zinc-900 font-bold text-xs">기업명</Label>
          <Input id="companyName" name="companyName" placeholder="예: 지무엔지니어링" onChange={onChange} className="bg-zinc-50 border-zinc-200 text-zinc-900 text-xs h-8" />
        </div>

        <div className="space-y-1">
          <Label className="text-zinc-900 font-bold text-xs">사업자등록증 첨부</Label>
          <div className="flex gap-1.5">
            <Input 
              placeholder="사업자등록증을 첨부해주세요" 
              value={fileName} 
              readOnly 
              className="bg-zinc-50 border-zinc-200 text-zinc-500 text-xs h-8 flex-1 cursor-pointer" 
              onClick={handleFileClick}
            />
            <Button variant="outline" type="button" onClick={handleFileClick} className="h-8 text-xs px-3 border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 shrink-0">
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
          <p className="text-[10px] text-zinc-500">ⓘ 가입 후 관리자가 사업자등록증을 확인한 뒤 서비스가 활성화됩니다</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="signup-email" className="text-zinc-900 font-bold text-xs">담당자 이메일</Label>
          <div className="flex gap-1.5">
            <Input id="signup-email" name="email" placeholder="your@email.com" onChange={onChange} className="bg-zinc-50 border-zinc-200 text-zinc-900 text-xs h-8 flex-1" />
            <Button variant="outline" type="button" className="h-8 text-xs px-3 border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 shrink-0">
              중복 확인
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="signup-password" className="text-zinc-900 font-bold text-xs">비밀번호</Label>
          <Input 
            id="signup-password" 
            name="password" 
            type="password" 
            placeholder="8자 이상" 
            onChange={onChange} 
            className="bg-zinc-50 border-zinc-200 text-zinc-900 text-xs h-8" 
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="passwordConfirm" className="text-zinc-900 font-bold text-xs">비밀번호 확인</Label>
          <Input 
            id="passwordConfirm" 
            name="passwordConfirm" 
            type="password" 
            placeholder="비밀번호 재입력" 
            onChange={onChange} 
            className="bg-zinc-50 border-zinc-200 text-zinc-900 text-xs h-8" 
          />
        </div>

        <div className="flex items-center gap-2 pt-2 pb-1">
          <input 
            type="checkbox" 
            id="terms" 
            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
          />
          <Label htmlFor="terms" className="text-xs text-zinc-900 cursor-pointer">
            <span className="text-[#0071e3] font-bold hover:underline" onClick={(e) => { e.preventDefault(); setModalContent('terms'); }}>이용약관</span> 및{' '}
            <span className="text-[#0071e3] font-bold hover:underline" onClick={(e) => { e.preventDefault(); setModalContent('privacy'); }}>개인정보처리방침</span>에 동의합니다
          </Label>
        </div>

        <Button className="w-full bg-[#0a0a0a] hover:bg-zinc-800 text-white font-bold h-10 text-sm mt-1" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '가입 신청 중...' : '회원가입'}
        </Button>
        
        <div className="text-center mt-3">
          <span className="text-sm text-zinc-500">이미 계정이 있으신가요? </span>
          <button type="button" className="text-sm text-[#0071e3] hover:underline font-bold" onClick={() => onSetTab('login')}>
            로그인
          </button>
        </div>
      </div>

      {/* 약관 모달 Overlay (Portal을 사용하여 부모 제약 벗어남) */}
      {mounted && modalContent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden text-left">
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="text-base font-black tracking-tight text-zinc-900">
                {modalContent === 'terms' ? 'Cadence AI 이용약관' : '개인정보처리방침'}
              </h2>
              <button onClick={() => setModalContent(null)} className="text-zinc-400 hover:text-zinc-900 text-lg leading-none transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-zinc-600 leading-relaxed space-y-6">
              {modalContent === 'terms' ? (
                <>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">제1조 (목적)</h3>
                    <p>본 약관은 주식회사 케이던스(이하 "회사")가 제공하는 Cadence AI (AutoCAD 지능형 코파일럿) 서비스의 이용 조건, 절차 및 회사와 회원 간의 권리, 의무를 규정함을 목적으로 합니다.</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">제2조 (서비스의 제공)</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>회사는 AutoCAD 도면 기반 법적 검토, 설계 자동화, 물량 산출 및 도면 엔티티 분석 등의 AI 서비스를 제공합니다.</li>
                      <li>회사는 서비스 품질 향상과 AI 학습을 위해 회원이 동의한 범위 내에서 업로드한 도면 메타데이터를 활용할 수 있습니다.</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">제3조 (회원의 의무 및 책임)</h3>
                    <p>회원은 타인의 저작권이나 지식재산권을 침해하는 도면을 업로드하여서는 안 되며, 이로 인해 발생하는 모든 법적 책임은 회원 본인에게 있습니다.</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">1. 수집하는 개인정보 항목</h3>
                    <p className="mb-1">회사는 원활한 B2B 서비스 제공과 기업 인증을 위해 다음과 같은 정보를 수집합니다.</p>
                    <ul className="list-disc pl-4 text-zinc-500">
                      <li><span className="font-semibold text-zinc-700">필수항목:</span> 기업명, 담당자 이메일, 비밀번호, 사업자등록증 첨부본</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">2. 개인정보의 수집 및 이용 목적</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>B2B 기업 회원 인증 및 가입 승인 절차 진행</li>
                      <li>Cadence AI 도면 분석 서비스 제공 및 맞춤형 기술 지원</li>
                      <li>플러그인 이용 요금 정산 및 중요 고지사항 전달</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-zinc-900 mb-2">3. 개인정보의 보유 및 이용 기간</h3>
                    <p>원칙적으로 회원 탈퇴 시 또는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 법령에서 정한 기간 동안 보관합니다.</p>
                  </section>
                </>
              )}
            </div>
            <div className="p-4 border-t border-zinc-100 flex justify-end bg-zinc-50">
              <Button onClick={() => setModalContent(null)} className="bg-[#0a0a0a] hover:bg-zinc-800 text-white text-xs font-bold h-9 px-6">
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