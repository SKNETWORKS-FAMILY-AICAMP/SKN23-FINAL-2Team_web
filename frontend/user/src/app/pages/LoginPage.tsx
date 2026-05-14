/*
Modification History:
    - 2026-05-14 (김지우) : 인증 모달을 전용 페이지로 전환 — 분할 레이아웃 풀페이지 구현
*/
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import landingMainImage from '@/assets/landing-main.png';
import logoMark from '@/assets/chat_logo_mark.png';

import { LoginForm } from '@/app/components/auth/LoginForm';
import { SignupForm } from '@/app/components/auth/SignupForm';
import { VerificationStep } from '@/app/components/auth/EmailVerification';
import { ResetPasswordStep } from '@/app/components/auth/ResetPassword';
import type { AuthStep } from '@/app/components/auth/AuthModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, verifyEmail, requestPasswordReset, resetPassword } = useAuth();

  const initialMode = (searchParams.get('mode') as AuthStep) || 'login';
  const [activeTab, setActiveTab] = useState<AuthStep>(initialMode);
  const [prevStep, setPrevStep] = useState<AuthStep>('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    passwordConfirm: '',
    certificateFile: null as File | null,
    verificationCode: '',
    newPassword: '',
    newPasswordConfirm: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode') as AuthStep;
    if (mode) setActiveTab(mode);
  }, [searchParams]);

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
          navigate('/');
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
    toast.success(msg);
    setTimeout(() => navigate('/'), 1200);
  };

  const authCopy: Record<AuthStep, { title: string; subtitle: string; action?: string; nextTab?: AuthStep }> = {
    login: { title: '로그인', subtitle: '신규 사용자이신가요?', action: '계정 만들기', nextTab: 'signup' },
    signup: { title: '회원가입', subtitle: '이미 계정이 있으신가요?', action: '로그인', nextTab: 'login' },
    verify: { title: '이메일 인증', subtitle: '메일로 받은 인증 코드를 입력해주세요.' },
    forgot_password: { title: '비밀번호 찾기', subtitle: '가입한 이메일로 재설정 코드를 받을 수 있습니다.' },
    reset_password: { title: '새 비밀번호 설정', subtitle: '앞으로 사용할 새 비밀번호를 입력해주세요.' },
  };

  const currentCopy = authCopy[activeTab];

  return (
    <div className="min-h-screen grid md:grid-cols-[minmax(0,1fr)_460px] lg:grid-cols-[minmax(0,1fr)_500px]">
      {/* 왼쪽 이미지 패널 */}
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
          <button
            onClick={() => navigate('/')}
            className="absolute top-10 left-10 lg:left-12 flex items-center gap-3 group"
          >
            <img src={logoMark} alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
            <span className="text-2xl font-black tracking-tight group-hover:opacity-80 transition-opacity">Cadence AI</span>
          </button>
          <h2 className="max-w-md text-3xl font-black leading-tight tracking-tight">
            설계 검토를 더 빠르고 정확하게
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            도면 검토, 수정 제안, 기준 검색까지 하나의 에이전트에서 시작하세요.
          </p>
        </div>
      </div>

      {/* 오른쪽 폼 패널 */}
      <div className="min-h-screen overflow-y-auto bg-white px-7 py-10 md:px-10 lg:px-12">
        <div className={`mx-auto flex min-h-full max-w-[440px] flex-col ${activeTab === 'signup' ? 'justify-start py-2' : 'justify-center'}`}>
          {/* 모바일 로고 */}
          <div className="mb-7 flex items-center gap-2 md:hidden">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src={logoMark} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
              <span className="text-xl font-black tracking-tight text-zinc-900">Cadence AI</span>
            </button>
          </div>

          <div className="mb-9">
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
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    {currentCopy.action}
                  </button>
                </>
              )}
            </p>
          </div>

          <AnimatePresence mode="wait">
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

            {activeTab === 'reset_password' && (
              <ResetPasswordStep
                onChange={handleChange}
                onSubmit={handleConfirmReset}
                isLoading={isLoading}
              />
            )}

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
  );
}
