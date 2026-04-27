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
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, User, CreditCard, Key, Activity, Monitor, FileDown,
  LogOut, ShieldCheck, MessageSquare, Trash2, Lock, X, CheckCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

import { UserAccountTab } from '@/app/components/profile/user/UserAccountTab';
import { UserPaymentTab } from '@/app/components/profile/user/UserPaymentTab';
import { UserAPIKeyTab } from '@/app/components/profile/user/UserAPIKeyTab';
import { UserUsageTab } from '@/app/components/profile/user/UserUsageTab';
import { UserDeviceTab } from '@/app/components/profile/user/UserDeviceTab';
import { UserInquiriesTab } from '@/app/components/profile/user/UserInquiriesTab';


type TabType = 'account' | 'billing' | 'api' | 'usage' | 'devices' | 'downloads' | 'my_inquiries';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // 권한 기반 라우팅 방어 로직 (비로그인자 튕기기 및 관리자 계정 자동 리다이렉트)
  useEffect(() => {
    if (!user && !isAuthenticated) {
      // 0.5초 등 약간의 딜레이가 있을 수 있으나 단순하게 처리
    } else if (user?.role === 'admin' || user?.role === 'superuser') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate, isAuthenticated]);

  // URL 쿼리 스트링에서 탭 정보를 가져와 초기 상태로 설정
  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab') as TabType;
  const initialTab = queryTab || (location.state?.tab as TabType) || 'account';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 탭 변경 시 URL 갱신
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
        const response = await fetch('http://localhost:8001/api/v1/payments/current', {
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

  useEffect(() => {
    fetchPayment();
  }, [activeTab]);

  // --- 2. Usage Dashboard State ---
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageDateRange, setUsageDateRange] = useState({
    start: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'calls' | 'tokens'>('all');

  useEffect(() => {
    const fetchUsage = async () => {
      if (activeTab === 'usage' && !isLoadingUsage) {
        setIsLoadingUsage(true);
        try {
          const token = localStorage.getItem('access_token');
          const url = `http://localhost:8001/api/v1/usage/stats?start_date=${usageDateRange.start}&end_date=${usageDateRange.end}`;
          const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
          const data = await response.json();
          if (data && data.success) {
            setUsageStats(data);
          }
        } catch (error) {
          console.error("Usage Fetch Error", error);
        } finally {
          setIsLoadingUsage(false);
        }
      }
    };
    fetchUsage();
  }, [activeTab, usageDateRange]);

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    if (!value || !isValid(parseISO(value))) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (type === 'start' && value > usageDateRange.end) {
      toast.error('시작 날짜는 종료 날짜보다 늦을 수 없습니다.');
      return;
    }
    if (type === 'end' && value < usageDateRange.start) {
      toast.error('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      return;
    }
    if (value > today) {
      toast.error('미래 날짜는 조회할 수 없습니다.');
      return;
    }
    setUsageDateRange(prev => ({ ...prev, [type]: value }));
  };

  const setQuickRange = (days: number | 'month') => {
    let start: Date;
    const end = new Date();
    if (days === 'month') start = startOfMonth(new Date());
    else start = subDays(new Date(), days - 1);
    setUsageDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
  };

  // --- 3. API Keys & Devices State ---
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
          const response = await fetch('http://localhost:8001/api/v1/keys', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (Array.isArray(data)) setApiKeys(data);
        } catch (error) {
          console.error("Keys Fetch Error", error);
        } finally {
          setIsLoadingKeys(false);
        }
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
          const response = await fetch('http://localhost:8001/api/v1/devices/', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (Array.isArray(data)) setDevices(data);
        } catch (error) {
          console.error("Devices Fetch Error", error);
        } finally {
          setIsLoadingDevices(false);
        }
      }
    };
    fetchDevices();
  }, [activeTab]);

  const isVerified = user?.verification_status === 'verified';

  // --- 4. Modals & Handlers ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);

  // --- 5. My Inquiries States ---
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  useEffect(() => {
    if (activeTab === 'my_inquiries') {
      const fetchMyTickets = async () => {
        setIsLoadingInquiries(true);
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch('http://localhost:8001/api/v1/support/tickets/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) setMyTickets(data.tickets);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingInquiries(false);
        }
      };
      fetchMyTickets();
    }
  }, [activeTab]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>({ title: '', message: '', onConfirm: () => { }, type: 'blue' });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'blue' | 'red' = 'blue') => {
    setConfirmConfig({ title, message, onConfirm, type });
    setShowConfirmModal(true);
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

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

  const handlePasswordResetComplete = () => {
    if (newPassword.length < 8) { toast.error('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (newPassword !== newPasswordConfirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
    toast.success('비밀번호가 성공적으로 변경되었습니다.');
    setShowPasswordModal(false);
    setIsEmailVerified(false);
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8001/api/v1/keys', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setApiKeys(data);
    } catch (e) { }
  };

  const handleGenerateKey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8001/api/v1/keys/generate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
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
        const res = await fetch(`http://localhost:8001/api/v1/keys/${keyId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          toast.success('API 키가 즉시 폐기되었습니다.');
          fetchKeys();
        } else {
          const data = await res.json();
          toast.error(data.detail || '삭제 실패');
        }
      } catch (e) { toast.error('오류가 발생했습니다.'); }
    }, 'red');
  };


  const renderTabContent = () => {
    // 승인 대기 중일 때 (account 탭 제외) 모든 탭에 제한 화면 표시
    if (user?.verification_status !== 'verified' && activeTab !== 'account') {
      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl text-center space-y-6">
            <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">서비스 승인 대기 중</h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                현재 사업자등록증 검토가 진행 중입니다.<br />
                관리자의 승인이 완료된 후 모든 기능을 이용하실 수 있습니다.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={() => setActiveTab('account')}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-all"
              >
                정보 확인하기
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'account':
        return <UserAccountTab user={user} setShowPasswordModal={setShowPasswordModal} setShowDeleteModal={setShowDeleteModal} setCertFile={setCertFile} certFile={certFile} />;
      case 'billing':
        return (
          <UserPaymentTab
            isLoadingPayment={isLoadingPayment}
            paymentInfo={paymentInfo}
            isVerified={isVerified}
            triggerConfirm={triggerConfirm}
            navigate={navigate}
            refetchPayment={() => fetchPayment(true)}
          />
        );
      case 'api':
        return <UserAPIKeyTab user={user} apiKeys={apiKeys} isLoadingKeys={isLoadingKeys} handleGenerateKey={handleGenerateKey} handleDeleteKey={handleDeleteKey} setActiveTab={setActiveTab} />;
      case 'usage':
        return <UserUsageTab isLoadingUsage={isLoadingUsage} usageStats={usageStats} usageDateRange={usageDateRange} handleCustomDateChange={handleCustomDateChange} setQuickRange={setQuickRange} selectedMetric={selectedMetric} setSelectedMetric={setSelectedMetric} />;
      case 'devices':
        return <UserDeviceTab isLoadingDevices={isLoadingDevices} devices={devices} />;
      case 'my_inquiries':
        return <UserInquiriesTab isLoadingInquiries={isLoadingInquiries} myTickets={myTickets} />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'account', label: '계정 설정', icon: User },
    { id: 'billing', label: '요금제 정보', icon: CreditCard },
    { id: 'api', label: 'API Key 관리', icon: Key },
    { id: 'usage', label: '실시간 사용량', icon: Activity },
    { id: 'devices', label: '기기 등록 현황', icon: Monitor },
    { id: 'my_inquiries', label: '내 문의 내역', icon: MessageSquare },
    { id: 'downloads', label: '감리 리포트 다운로드', icon: FileDown },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-200">
      <nav className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        {!isVerified && (
          <div className="bg-[#0071e3] text-white py-2 text-center text-xs font-bold animate-pulse">
            현재 사업자 등록 승인 대기 상태입니다. 일부 기능 이용이 제한됩니다.
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-bold text-lg text-white">마이페이지</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white">{user?.companyName || 'N/A'}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"><LogOut className="w-4 h-4" /> 로그아웃</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#0071e3]/10 text-[#abc7ff] shadow-[inset_2px_0_0_#0071e3]' : 'text-zinc-400 hover:bg-white/5'}`}
            >
              <tab.icon className="w-5 h-5" />{tab.label}
            </button>
          ))}
        </aside>
        <main className="flex-1 min-w-0">{renderTabContent()}</main>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
              <div className="text-center space-y-2"><h3 className="text-xl font-bold text-white">{confirmConfig.title}</h3><p className="text-sm text-zinc-400 whitespace-pre-wrap">{confirmConfig.message}</p></div>
              <div className="flex gap-3"><button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-zinc-900 text-zinc-400 font-bold rounded-xl">취소</button><button onClick={() => { confirmConfig.onConfirm(); setShowConfirmModal(false); }} className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmConfig.type === 'red' ? 'bg-red-500' : 'bg-[#0071e3]'}`}>확인</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white text-center">비밀번호 변경</h3>
              <div className="space-y-4">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl text-sm focus:border-[#0071e3] outline-none" placeholder="새 비밀번호" />
                <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl text-sm focus:border-[#0071e3] outline-none" placeholder="비밀번호 확인" />
                <button onClick={handlePasswordResetComplete} className="w-full py-3 bg-[#47e266] text-zinc-950 font-bold rounded-xl hover:brightness-110">변경 완료</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto bg-red-500/10 p-3 rounded-full" />
              <h3 className="text-xl font-bold text-white">회원 탈퇴</h3>
              <p className="text-sm text-zinc-400">데이터가 모두 삭제됩니다. 계속하시겠습니까?</p>
              <div className="space-y-4">
                <input type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl text-sm outline-none" placeholder="이메일 확인" />
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl text-sm outline-none" placeholder="비밀번호 확인" />
                <button onClick={handleDeleteAccountSubmit} className="w-full py-3 bg-red-500 text-white font-bold rounded-xl">탈퇴 신청</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newGeneratedKey && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-[#47e266]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#47e266]" />
                </div>
                <h3 className="text-xl font-bold text-white">API 키 발급 완료</h3>
                <p className="text-sm text-red-400 font-bold">이 키는 보안을 위해 지금 한 번만 표시됩니다.<br />반드시 안전한 곳에 복사해 두시기 바랍니다.</p>
              </div>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 break-all text-center font-mono text-white text-sm select-all">
                {newGeneratedKey}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newGeneratedKey);
                      toast.success('API 키가 클립보드에 복사되었습니다.');
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 transition-colors"
                  >
                    키 복사하기
                  </button>
                  {devices?.length === 0 && (
                    <button
                      onClick={() => { /* 플러그인 다운로드 로직 수행 */ }}
                      className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl border border-white/10 transition-colors"
                    >
                      플러그인 다운로드
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setNewGeneratedKey(null)}
                  className="w-full py-3 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-sm rounded-xl transition-colors"
                >
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
