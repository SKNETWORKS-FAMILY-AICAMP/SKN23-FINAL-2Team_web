/*
File    : src/app/components/auth/AuthModal.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 로그인 및 회원가입 모달 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 로그인 및 회원가입 모달 UI 초기 구현
    - 2026-04-21 (김민정) : 자동 닫기 성공 모달 및 UI 개선
    - 2026-04-22 (김민정) : 로그인/회원가입 후 구독 상태에 따른 지능형 내비게이션(onSuccess) 연동
    - 2026-04-24 (김민정) : Redis 기반 이메일 인증 및 비밀번호 재설정 UX 구현
    - 2026-04-26 (김민정) : 인증 성공 시 메인 대시보드 연동
    - 2026-05-14 (김지우) : 인증 모달 전역 제어 및 이미지 기반 분할 레이아웃 적용
*/
import React, { useState, forwardRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@shared/ui/overlay";
import { Button } from "@shared/ui/forms";
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import landingMainImage from '@/assets/landing-main.png';
import logoMark from '@/assets/chat_logo_mark.png';

import { LoginForm } from '@/app/components/auth/LoginForm';
import { SignupForm } from '@/app/components/auth/SignupForm';
import { VerificationStep } from '@/app/components/auth/EmailVerification';
import { ResetPasswordStep } from '@/app/components/auth/ResetPassword';

interface AuthModalProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: AuthStep;
}

export type AuthStep = 'login' | 'signup' | 'verify' | 'forgot_password' | 'reset_password';

export const AuthModal = forwardRef<HTMLDivElement, AuthModalProps>(
  ({ children, onSuccess, open, onOpenChange, mode }, ref) => {
    const { login, register, verifyEmail, requestPasswordReset, resetPassword } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<AuthStep>('login');
    const [prevStep, setPrevStep] = useState<AuthStep>('login');
    const isOpen = open ?? internalOpen;

    const setOpen = useCallback((nextOpen: boolean) => {
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    }, [open, onOpenChange]);

    const [formData, setFormData] = useState({
      email: '',
      password: '',
      companyName: '',
      passwordConfirm: '',
      certificateFile: null as File | null,
      verificationCode: '',
      newPassword: '',
      newPasswordConfirm: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- 기존 핸들러 로직 (수정 없이 그대로 유지) ---
    useEffect(() => {
      const handleOpen = (e: any) => {
        if (e.detail?.mode) setActiveTab(e.detail.mode as AuthStep);
        setOpen(true);
      };
      window.addEventListener('open-auth-modal', handleOpen);
      return () => window.removeEventListener('open-auth-modal', handleOpen);
    }, [setOpen]);

    useEffect(() => {
      if (isOpen && mode) setActiveTab(mode);
    }, [isOpen, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFormData({ ...formData, certificateFile: e.target.files[0] });
      }
    };

    const validatePassword = (pw: string) => {
      const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      return regex.test(pw);
    };

    const handleSubmit = async (type: 'login' | 'signup') => {
      setIsLoading(true);
      try {
        if (type === 'signup') {
          if (!formData.companyName || !formData.email || !formData.password || !formData.passwordConfirm) {
            toast.error('모든 필드를 입력해주세요.'); setIsLoading(false); return;
          }
          if (!formData.certificateFile) {
            toast.error('사업자등록증을 첨부해주세요.'); setIsLoading(false); return;
          }
          if (!validatePassword(formData.password)) {
            toast.error('비밀번호는 최소 8자이며, 영문 + 숫자 + 특수문자 조합이어야 합니다.'); setIsLoading(false); return;
          }
          if (formData.password !== formData.passwordConfirm) {
            toast.error('비밀번호가 일치하지 않습니다.'); setIsLoading(false); return;
          }
          await register(formData.companyName, formData.email, formData.password, formData.certificateFile);
          handleSuccess('회원가입이 신청되었습니다! 관리자 승인 후 이용 가능합니다.');
        } else {
          if (!formData.email || !formData.password) {
            toast.error('이메일과 비밀번호를 입력해주세요.'); setIsLoading(false); return;
          }
          try {
            await login(formData.email, formData.password);
            setOpen(false);
            if (onSuccess) onSuccess();
          } catch (err: any) {
            if (err.message.includes('인증이 완료되지 않았습니다')) {
              toast.info('이메일 인증이 필요합니다.');
              setPrevStep('login'); setActiveTab('verify');
            }
          }
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || '요청 처리 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleVerify = async () => {
      if (formData.verificationCode.length !== 6) { toast.error('인증 번호 6자리를 입력해주세요.'); return; }
      setIsLoading(true);
      try {
        if (prevStep === 'forgot_password') {
          setActiveTab('reset_password');
        } else {
          await verifyEmail(formData.email, formData.verificationCode);
          handleSuccess('회원가입이 성공적으로 완료되었습니다!');
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleRequestReset = async () => {
      if (!formData.email) { toast.error('이메일을 입력해주세요.'); return; }
      setIsLoading(true);
      try {
        await requestPasswordReset(formData.email);
        toast.success('비밀번호 재설정 코드가 발송되었습니다.');
        setPrevStep('forgot_password'); setActiveTab('verify');
      } catch (err) { } finally { setIsLoading(false); }
    };

    const handleConfirmReset = async () => {
      if (!validatePassword(formData.newPassword)) { toast.error('비밀번호 규칙을 확인해주세요.'); return; }
      if (formData.newPassword !== formData.newPasswordConfirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
      setIsLoading(true);
      try {
        await resetPassword(formData.email, formData.verificationCode, formData.newPassword);
        handleSuccess('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        setActiveTab('login');
      } catch (err) { } finally { setIsLoading(false); }
    };

    const handleSuccess = (msg: string) => {
      setSuccessMessage(msg); setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false); setOpen(false);
        if (onSuccess) onSuccess();
      }, 2000);
    };

    const authCopy: Record<AuthStep, { title: string; subtitle: string; action?: string; nextTab?: AuthStep }> = {
      login: {
        title: '로그인',
        subtitle: '신규 사용자이신가요?',
        action: '계정 만들기',
        nextTab: 'signup'
      },
      signup: {
        title: '회원가입',
        subtitle: '이미 계정이 있으신가요?',
        action: '로그인',
        nextTab: 'login'
      },
      verify: {
        title: '이메일 인증',
        subtitle: '메일로 받은 인증 코드를 입력해주세요.'
      },
      forgot_password: {
        title: '비밀번호 찾기',
        subtitle: '가입한 이메일로 재설정 코드를 받을 수 있습니다.'
      },
      reset_password: {
        title: '새 비밀번호 설정',
        subtitle: '앞으로 사용할 새 비밀번호를 입력해주세요.'
      }
    };

    const currentCopy = authCopy[activeTab];

    // --- Render ---
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div ref={ref} className={children ? "inline-block w-full" : "hidden"}>
              {children ? children : <Button variant="outline">로그인 / 회원가입</Button>}
            </div>
          </DialogTrigger>

          <DialogContent className="h-[min(760px,calc(100vh-32px))] max-h-[calc(100vh-32px)] w-[min(1120px,calc(100vw-32px))] max-w-none overflow-hidden border-0 bg-transparent p-0 text-zinc-900 shadow-2xl sm:rounded-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Cadence AI 계정</DialogTitle>
              <DialogDescription className="sr-only">
                Cadence AI 계정 로그인, 회원가입, 이메일 인증, 비밀번호 재설정을 진행합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="grid h-full min-h-0 w-full bg-white md:grid-cols-[minmax(0,1fr)_460px] lg:grid-cols-[minmax(0,1fr)_500px]">
              <div className="relative hidden overflow-hidden bg-zinc-950 md:block">
                <img
                  src={landingMainImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white lg:p-12">
                  <div className="mb-5 flex items-center gap-3">
                    <img src={logoMark} alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
                    <span className="text-2xl font-black tracking-tight">Cadence AI</span>
                  </div>
                  <h2 className="max-w-md text-3xl font-black leading-tight tracking-tight">
                    설계 검토를 더 빠르고 정확하게
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                    도면 검토, 수정 제안, 기준 검색까지 하나의 에이전트에서 시작하세요.
                  </p>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto bg-white px-7 py-10 md:px-10 lg:px-12">
                <div className={`mx-auto flex min-h-full max-w-[440px] flex-col ${activeTab === 'signup' ? 'justify-start py-2' : 'justify-center'}`}>
                  <div className="mb-9">
                    <div className="mb-7 flex items-center gap-2 md:hidden">
                      <img src={logoMark} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
                      <span className="text-xl font-black tracking-tight text-zinc-900">Cadence AI</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-zinc-900">
                      {currentCopy.title}
                    </h2>
                    <p className="mt-5 text-sm font-medium text-zinc-500">
                      {currentCopy.subtitle}
                      {currentCopy.action && currentCopy.nextTab && (
                        <>
                          {' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab(currentCopy.nextTab!)}
                            className="font-bold text-[#0071e3] underline-offset-4 hover:underline"
                          >
                            {currentCopy.action}
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* 1. 인증 코드 입력 단계 */}
                    {activeTab === 'verify' && (
                      <VerificationStep
                        email={formData.email}
                        onChange={handleChange}
                        onVerify={handleVerify}
                        onResend={handleRequestReset}
                        onBack={() => setActiveTab(prevStep)}
                        isLoading={isLoading}
                      />
                    )}

                    {/* 2. 새 비밀번호 설정 단계 */}
                    {activeTab === 'reset_password' && (
                      <ResetPasswordStep
                        onChange={handleChange}
                        onSubmit={handleConfirmReset}
                        isLoading={isLoading}
                      />
                    )}

                    {/* 3. 메인 로그인/회원가입/비밀번호찾기 탭 */}
                    {(activeTab === 'login' || activeTab === 'signup' || activeTab === 'forgot_password') && (
                      <motion.div key={activeTab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                        {activeTab === 'login' && (
                          <LoginForm
                            mode="login"
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            onRequestReset={handleRequestReset}
                            onSetTab={setActiveTab}
                            isLoading={isLoading}
                          />
                        )}

                        {activeTab === 'signup' && (
                          <SignupForm
                            onChange={handleChange}
                            onFileChange={handleFileChange}
                            onSubmit={handleSubmit}
                            onSetTab={setActiveTab}
                            isLoading={isLoading}
                          />
                        )}

                        {/* 비밀번호 찾기 UI */}
                        {activeTab === 'forgot_password' && (
                          <LoginForm
                            mode="forgot_password"
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            onRequestReset={handleRequestReset}
                            onSetTab={setActiveTab}
                            isLoading={isLoading}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 성공 모달 Overlay (기존 유지) */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                className="bg-white border border-zinc-200 p-10 rounded-[32px] text-center space-y-4 max-w-sm w-full shadow-2xl"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">{successMessage}</h3>
                <p className="text-sm text-zinc-500 font-medium">잠시 후 대시보드로 이동합니다...</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

AuthModal.displayName = "AuthModal";
