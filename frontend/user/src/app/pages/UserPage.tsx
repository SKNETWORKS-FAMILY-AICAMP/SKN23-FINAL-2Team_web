/*
File    : src/app/pages/UserPage.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 사용자용 대시보드(마이페이지) 및 결제, 계정, API Key 관리 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 마이페이지 초기 구현
    - 2026-04-21 (김민정) : 실시간 DB 연동 및 대시보드 고도화 (최종 안정화 버전)
    - 2026-04-22 (김민정) : 요금제 변경(업그레이드/다운그레이드) 로직 및 가격 정책 업데이트
    - 2026-04-23 (김민정) : 컴포넌트 기능별 추출(Account, Billing, API, Usage, Device, QnA) 및 대규모 최적화
    - 2026-04-24 (김민정) : 마이페이지 내 결제 및 계정 관리 UI/UX 개선
    - 2026-04-26 (김민정) : device 더미 데이터 삭제 및 DB 연동
    - 2026-04-27 (송주엽) : 라이트 테마 전환
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, User, CreditCard, Key, Monitor, FileDown,
  LogOut, ShieldCheck, Trash2, Lock, X, CheckCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

import { UserAccountTab } from '@/app/components/profile/user/UserAccountTab';
import { UserPaymentTab } from '@/app/components/profile/user/UserPaymentTab';
import { UserAPIKeyTab } from '@/app/components/profile/user/UserAPIKeyTab';
import { UserDeviceTab } from '@/app/components/profile/user/UserDeviceTab';


type TabType = 'account' | 'billing' | 'api' | 'devices';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [user, setUser] = useState<any>(authUser);

  // 마운트 시 DB에서 최신 프로필(business_reg_s3_url 포함) 가져오기
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUser(data.user);
        }
      } catch { /* 조용히 실패 */ }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    if (!user && !isAuthenticated) {
    } else if (user?.role === 'admin' || user?.role === 'superuser') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate, isAuthenticated]);

  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab') as TabType;
  const initialTab = queryTab || (location.state?.tab as TabType) || 'account';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

// --- 1. Subscription & Payment State ---
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const fetchPayment = useCallback(async (force = false) => {
    if ((activeTab === 'billing' || force) && (!paymentInfo || force) && !isLoadingPayment) {
      setIsLoadingPayment(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/v1/payments/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data && data.success) {
          setPaymentInfo(data);
          setCurrentPlan(data.plan_name);
        } else {
          setPaymentInfo({ noPlan: true });
        }
      } catch (error) {
        console.error("Payment Fetch Error", error);
        setPaymentInfo({ noPlan: true });
      } finally {
        setIsLoadingPayment(false);
      }
    }
  }, [activeTab, paymentInfo, isLoadingPayment]);

  useEffect(() => { fetchPayment(); }, [activeTab]);

  // --- 2. API Keys & Devices State ---
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (activeTab === 'api' && !isLoadingKeys) {
        setIsLoadingKeys(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://localhost:8000/api/v1/keys', { headers: { 'Authorization': `Bearer ${token}` } });
          const data = await response.json();
          if (Array.isArray(data)) setApiKeys(data);
        } catch (error) { console.error("Keys Fetch Error", error); }
        finally { setIsLoadingKeys(false); }
      }
    };
    fetchApiKeys();
  }, [activeTab]);

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  useEffect(() => {
    const fetchDevices = async () => {
      if (activeTab === 'devices' && !isLoadingDevices) {
        setIsLoadingDevices(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://localhost:8000/api/v1/devices/', { headers: { 'Authorization': `Bearer ${token}` } });
          const data = await response.json();
          if (Array.isArray(data)) setDevices(data);
        } catch (error) { console.error("Devices Fetch Error", error); }
        finally { setIsLoadingDevices(false); }
      }
    };
    fetchDevices();
  }, [activeTab]);

  const isVerified = user?.verification_status === 'verified';

  // --- 3. Modals & Handlers ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'verify' | 'reset'>('verify');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessingPassword, setIsProcessingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>({ title: '', message: '', onConfirm: () => { }, type: 'blue' });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'blue' | 'red' = 'blue') => {
    setConfirmConfig({ title, message, onConfirm, type });
    setShowConfirmModal(true);
  };


  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);

  const handleDeleteAccountSubmit = () => {
    if (!user) return;
    if (deleteEmail === user.email && deletePassword.length >= 8) {
      triggerConfirm('계정 삭제 확인', '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', () => {
        toast.success('탈퇴 처리가 완료되었습니다.');
        setShowDeleteModal(false);
        handleLogout();
      }, 'red');
    } else {
      toast.error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const { requestPasswordReset, resetPassword } = useAuth();
  const validatePassword = (pw: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pw);
  };

  const handleSendCode = async () => {
    if (!user?.email) return;
    setIsProcessingPassword(true);
    try {
      const res = await requestPasswordReset(user.email);
      if (res.success) {
        toast.success('이메일로 인증 코드가 발송되었습니다.');
      } else {
        toast.error(res.detail || '코드 발송 실패');
      }
    } catch (e) {
      toast.error('코드 발송 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingPassword(false);
    }
  };

  const handleVerifyCodeNext = () => {
    if (verificationCode.length !== 6) {
      toast.error('6자리 인증 코드를 입력해주세요.');
      return;
    }
    setPasswordStep('reset');
  };

  const handlePasswordResetComplete = async () => {
    if (!validatePassword(newPassword)) {
      toast.error('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsProcessingPassword(true);
    try {
      const res = await resetPassword(user!.email, verificationCode, newPassword);
      if (res.success) {
        toast.success('비밀번호가 성공적으로 변경되었습니다.');
        setShowPasswordModal(false);
        setPasswordStep('verify');
        setVerificationCode('');
        setNewPassword('');
        setNewPasswordConfirm('');
      } else {
        toast.error(res.detail || '비밀번호 변경 실패');
      }
    } catch (e) {
      toast.error('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingPassword(false);
    }
  };

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/keys', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setApiKeys(data);
    } catch (e) { }
  };

  const handleGenerateKey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/keys/generate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        toast.success('새 API 키가 생성되었습니다.');
        const data = await res.json();
        setNewGeneratedKey(data.key);
        fetchKeys();
      } else {
        const data = await res.json();
        toast.error(data.detail || '발급 실패');
      }
    } catch (e) { toast.error('오류가 발생했습니다.'); }
  };

  const handleDeleteKey = async (keyId: string) => {
    triggerConfirm('API 키 폐기', '해당 키를 영구 삭제합니다. 외부 서비스 연동이 끊어질 수 있습니다. 계속하시겠습니까?', async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://localhost:8000/api/v1/keys/${keyId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { toast.success('API 키가 즉시 폐기되었습니다.'); fetchKeys(); }
        else { const data = await res.json(); toast.error(data.detail || '삭제 실패'); }
      } catch (e) { toast.error('오류가 발생했습니다.'); }
    }, 'red');
  };

  const renderTabContent = () => {
    if (user?.verification_status !== 'verified' && activeTab !== 'account') {
      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-amber-50 border border-amber-200 p-12 rounded-2xl text-center space-y-6">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">서비스 승인 대기 중</h3>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                현재 사업자등록증 검토가 진행 중입니다.<br />
                관리자의 승인이 완료된 후 모든 기능을 이용하실 수 있습니다.
              </p>
            </div>
            <button onClick={() => setActiveTab('account')} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold transition-all hover:bg-zinc-700">
              정보 확인하기
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'account':
        return <UserAccountTab user={user} setShowPasswordModal={setShowPasswordModal} setShowDeleteModal={setShowDeleteModal} setCertFile={setCertFile} certFile={certFile} />;
      case 'billing':
        return <UserPaymentTab isLoadingPayment={isLoadingPayment} paymentInfo={paymentInfo} isVerified={isVerified} triggerConfirm={triggerConfirm} navigate={navigate} refetchPayment={() => fetchPayment(true)} />;
      case 'api':
        return <UserAPIKeyTab user={user} apiKeys={apiKeys} isLoadingKeys={isLoadingKeys} handleGenerateKey={handleGenerateKey} handleDeleteKey={handleDeleteKey} setActiveTab={setActiveTab} />;
      case 'devices':
        return <UserDeviceTab isLoadingDevices={isLoadingDevices} devices={devices} />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'account', label: '계정 설정', icon: User },
    { id: 'billing', label: '요금제 정보', icon: CreditCard },
    { id: 'api', label: 'API Key 관리', icon: Key },
    { id: 'devices', label: '기기 등록 현황', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900">
      <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        {!isVerified && (
          <div className="bg-[#0071e3] text-white py-2 text-center text-xs font-bold">
            현재 사업자 등록 승인 대기 상태입니다. 일부 기능 이용이 제한됩니다.
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg text-zinc-900">마이페이지</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-zinc-700">{user?.companyName ? `${user.companyName}님` : 'N/A'}</span>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-blue-50 text-[#0071e3] font-semibold border-l-2 border-[#0071e3] pl-3.5'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />{tab.label}
            </button>
          ))}
        </aside>
        <main className="flex-1 min-w-0">{renderTabContent()}</main>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-zinc-900">{confirmConfig.title}</h3>
                <p className="text-sm text-zinc-500 whitespace-pre-wrap">{confirmConfig.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors">취소</button>
                <button onClick={() => { confirmConfig.onConfirm(); setShowConfirmModal(false); }} className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmConfig.type === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0071e3] hover:brightness-110'}`}>확인</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPasswordModal(false); setPasswordStep('verify'); setVerificationCode(''); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900">비밀번호 변경</h3>
                <button onClick={() => { setShowPasswordModal(false); setPasswordStep('verify'); setVerificationCode(''); }} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {passwordStep === 'verify' ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-500 font-medium px-1">등록된 이메일로 인증 코드를 발송합니다.</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-400 select-none">
                          {user?.email}
                        </div>
                        <button
                          onClick={handleSendCode}
                          disabled={isProcessingPassword}
                          className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                        >
                          코드 발송
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 outline-none transition-all"
                      placeholder="인증 코드 6자리"
                    />
                    <button
                      onClick={handleVerifyCodeNext}
                      className="w-full py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:brightness-110 transition-all"
                    >
                      다음 단계
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 outline-none transition-all"
                      placeholder="새 비밀번호 (영문+숫자+특수문자 8자 이상)"
                    />
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 outline-none transition-all"
                      placeholder="비밀번호 확인"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setPasswordStep('verify')}
                        className="flex-1 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                      >
                        이전
                      </button>
                      <button
                        onClick={handlePasswordResetComplete}
                        disabled={isProcessingPassword}
                        className="flex-2 py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {isProcessingPassword ? '변경 중...' : '변경 완료'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-8 space-y-6 text-center">
              <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">회원 탈퇴</h3>
              <p className="text-sm text-zinc-500">데이터가 모두 삭제됩니다. 계속하시겠습니까?</p>
              <div className="space-y-4">
                <input type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 outline-none focus:border-red-300 transition-all" placeholder="이메일 확인" />
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 outline-none focus:border-red-300 transition-all" placeholder="비밀번호 확인" />
                <button onClick={handleDeleteAccountSubmit} className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">탈퇴 신청</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New API Key Modal */}
      <AnimatePresence>
        {newGeneratedKey && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">API 키 발급 완료</h3>
                <p className="text-sm text-red-500 font-bold">이 키는 보안을 위해 지금 한 번만 표시됩니다.<br />반드시 안전한 곳에 복사해 두시기 바랍니다.</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl break-all text-center font-mono text-zinc-800 text-sm select-all">
                {newGeneratedKey}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(newGeneratedKey); toast.success('API 키가 클립보드에 복사되었습니다.'); }} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm rounded-xl border border-zinc-200 transition-colors">
                    키 복사하기
                  </button>
                  {devices?.length === 0 && (
                    <button onClick={() => { }} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm rounded-xl border border-zinc-200 transition-colors">
                      플러그인 다운로드
                    </button>
                  )}
                </div>
                <button onClick={() => setNewGeneratedKey(null)} className="w-full py-3 bg-[#0071e3] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all">
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
