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
*/
import React, { useState, forwardRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { LoginForm } from '@/app/components/auth/LoginForm';
import { SignupForm } from '@/app/components/auth/SignupForm';
import { VerificationStep } from '@/app/components/auth/EmailVerification';
import { ResetPasswordStep } from '@/app/components/auth/ResetPassword';

interface AuthModalProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

type AuthStep = 'login' | 'signup' | 'verify' | 'forgot_password' | 'reset_password';

export const AuthModal = forwardRef<HTMLDivElement, AuthModalProps>(
  ({ children, onSuccess }, ref) => {
    const { login, register, verifyEmail, requestPasswordReset, resetPassword } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<AuthStep>('login');
    const [prevStep, setPrevStep] = useState<AuthStep>('login');

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
        setIsOpen(true);
      };
      window.addEventListener('open-auth-modal', handleOpen);
      return () => window.removeEventListener('open-auth-modal', handleOpen);
    }, []);

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
          toast.success('인증 메일이 발송되었습니다.');
          setPrevStep('signup'); setActiveTab('verify');
        } else {
          if (!formData.email || !formData.password) {
            toast.error('이메일과 비밀번호를 입력해주세요.'); setIsLoading(false); return;
          }
          try {
            await login(formData.email, formData.password);
            handleSuccess('로그인 되었습니다!');
          } catch (err: any) {
            if (err.message.includes('인증이 완료되지 않았습니다')) {
              toast.info('이메일 인증이 필요합니다.');
              setPrevStep('login'); setActiveTab('verify');
            }
          }
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
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
        setShowSuccessModal(false); setIsOpen(false);
        if (onSuccess) onSuccess();
      }, 2000);
    };

    // --- Render ---
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div ref={ref} className={children ? "inline-block w-full" : "hidden"}>
              {children ? children : <Button variant="outline">로그인 / 회원가입</Button>}
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[450px] bg-zinc-950 text-white border-zinc-800 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Cadence AI</DialogTitle>
            </DialogHeader>

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
                <motion.div key="main-tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {activeTab !== 'forgot_password' && (
                    <Tabs value={activeTab as string} onValueChange={(v) => setActiveTab(v as AuthStep)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-900">
                        <TabsTrigger value="login">로그인</TabsTrigger>
                        <TabsTrigger value="signup">회원가입</TabsTrigger>
                      </TabsList>

                      <TabsContent value="login">
                        <LoginForm
                          mode="login"
                          onChange={handleChange}
                          onSubmit={handleSubmit}
                          onRequestReset={handleRequestReset}
                          onSetTab={setActiveTab}
                          isLoading={isLoading}
                        />
                      </TabsContent>

                      <TabsContent value="signup">
                        <SignupForm
                          onChange={handleChange}
                          onFileChange={handleFileChange}
                          onSubmit={handleSubmit}
                          isLoading={isLoading}
                        />
                      </TabsContent>
                    </Tabs>
                  )}

                  {/* 비밀번호 찾기 UI (탭이 없을 때 노출) */}
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
          </DialogContent>
        </Dialog>

        {/* 성공 모달 Overlay (기존 유지) */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-zinc-900 border border-white/10 p-10 rounded-3xl text-center space-y-4 max-w-sm w-full">
                <div className="w-16 h-16 bg-[#47e266]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-8 h-8 text-[#47e266]" />
                </div>
                <h3 className="text-xl font-bold text-white">{successMessage}</h3>
                <p className="text-sm text-zinc-500">잠시 후 대시보드로 이동합니다...</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

AuthModal.displayName = "AuthModal";