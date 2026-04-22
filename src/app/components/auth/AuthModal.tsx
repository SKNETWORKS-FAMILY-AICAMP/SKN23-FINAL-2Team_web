/*
File    : src/app/components/auth/AuthModal.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 로그인 및 회원가입 모달 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 로그인 및 회원가입 모달 UI 초기 구현
    - 2026-04-21 (김민정) : 자동 닫기 성공 모달 및 UI 개선
    - 2026-04-22 (김민정) : 로그인/회원가입 후 구독 상태에 따른 지능형 내비게이션(onSuccess) 연동
*/
import React, { useState, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface AuthModalProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export const AuthModal = forwardRef<HTMLDivElement, AuthModalProps>(
  ({ children, onSuccess }, ref) => {
    const { login, register } = useAuth();
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      companyName: '',
      passwordConfirm: '',
      certificateFile: null as File | null
    });

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFormData({
          ...formData,
          certificateFile: e.target.files[0]
        });
      }
    };

    const validatePassword = (pw: string) => {
      const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      return regex.test(pw);
    };

    const handleSubmit = async (type: 'login' | 'signup') => {
      try {
        if (type === 'signup') {
          if (!formData.companyName || !formData.email || !formData.password || !formData.passwordConfirm) {
            toast.error('모든 필드를 입력해주세요.');
            return;
          }
          if (!formData.certificateFile) {
            toast.error('사업자등록증을 첨부해주세요.');
            return;
          }
          if (!validatePassword(formData.password)) {
            toast.error('비밀번호는 최소 8자이며, 영문 + 숫자 + 특수문자 조합이어야 합니다.');
            return;
          }
          if (formData.password !== formData.passwordConfirm) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return;
          }
          
          await register(formData.companyName, formData.email, formData.password);
          setSuccessMessage('회원가입 신청이 완료되었습니다!');
        } else {
          if (!formData.email || !formData.password) {
            toast.error('이메일과 비밀번호를 입력해주세요.');
            return;
          }
          await login(formData.email, formData.password);
          setSuccessMessage('로그인 되었습니다!');
        }

        // toast 알림 표시 후 즉시 이동
        toast.success(type === 'signup' ? '회원가입 신청이 완료되었습니다!' : '로그인 되었습니다!');
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Auth Request Failed", error);
      }
    };

    return (
      <>
        <Dialog>
          <DialogTrigger asChild>
            <div ref={ref} className="inline-block w-full">
              {children ? children : <Button variant="outline">로그인 / 회원가입</Button>}
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[450px] bg-zinc-950 text-white border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Cadence AI</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-900">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" name="email" placeholder="example@cadence.ai" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">비밀번호</Label>
                    <button
                      type="button"
                      className="text-xs text-[#0071e3] hover:underline"
                      onClick={() => toast.info('비밀번호 찾기 기능은 현재 준비 중입니다.')}
                    >
                      비밀번호를 잊었나요?
                    </button>
                  </div>
                  <Input id="password" name="password" type="password" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={() => handleSubmit('login')}>
                  로그인
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">기업명</Label>
                  <Input id="companyName" name="companyName" placeholder="주식회사 케이던스" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate">사업자등록증 파일 첨부 (.pdf)</Label>
                  <Input
                    id="certificate"
                    name="certificate"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="bg-zinc-900 border-zinc-800 text-white file:bg-[#0071e3] file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:hover:cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">담당자 이메일</Label>
                  <Input id="signup-email" name="email" placeholder="manager@cadence.ai" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호 (8자 이상, 영문+숫자+특수문자)</Label>
                  <Input id="signup-password" name="password" type="password" placeholder="조합하여 8자 이상" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                  <Input id="passwordConfirm" name="passwordConfirm" type="password" onChange={handleChange} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <Button className="w-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold h-12" onClick={() => handleSubmit('signup')}>
                  회원가입 신청
                </Button>
                <p className="text-[10px] text-zinc-500 text-center">
                  가입 신청 후 관리자의 승인이 완료되어야 서비스를 이용하실 수 있습니다.
                </p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Success Modal Overlay */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 p-10 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs w-full"
              >
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
