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
    - 2026-05-13 (김민정) : 바로가기 버튼 활성화
    - 2026-05-14 (김지우) : 마이페이지 좌측 사이드바 기반 대시보드 레이아웃 적용
    - 2026-05-14 (김지우) : 토큰 존재 시 마이페이지 초기 진입 리다이렉트 방지
    - 2026-05-14 (김지우) : 하단 고정 푸터 및 약관/개인정보/고객센터 모달 추가
    - 2026-05-14 (김지우) : 마이페이지 좌측 사이드바 고정 및 본문 독립 스크롤 적용
    - 2026-05-14 (김지우) : Cadence AI 가이드 문서 모달 추가
    - 2026-05-14 (김지우) : API Key 발급 모달 연동을 위한 생성 결과 반환 처리
    - 2026-05-14 (김지우) : API 키 생성 요청에 이름 본문 전달 처리
    - 2026-05-14 (김지우) : API 키 생성 요청 본문을 이름만 전달하도록 단순화
    - 2026-05-14 (김지우) : 마스킹된 API 키의 실제 키 복사 요청 처리
    - 2026-05-15 (김지우) : 계정 설정을 계정 정보로 변경하고 보안 탭 및 프로필 변경 연동 추가
    - 2026-05-15 (김지우) : 마이페이지 공통 하단 링크 글씨 크기 축소
    - 2026-05-15 (김지우) : 모든 탭의 상단 인사말 및 빠른 링크 헤더 제거
    - 2026-05-15 (김지우) : 인사말/설명 제외한 상단 빠른 링크와 사용자 영역 복원
    - 2026-05-15 (김지우) : 담당자 이름/이메일 프로필 변경 payload 지원
    - 2026-05-15 (김지우) : 마이페이지 알림 조회/읽음 처리 및 벨 드롭다운 연동
    - 2026-05-15 (김지우) : 상단 사용자 메뉴 클릭 시 로그아웃 메뉴 표시
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, CreditCard, Key, Monitor, FileText,
  ShieldCheck, Trash2, X, CheckCircle,
  Bell, BookOpen, ChevronDown, Download, HelpCircle, LogOut, Server, RefreshCw, Database, LockKeyhole
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

import { UserAccountTab } from '@/app/components/profile/user/UserAccountTab';
import { UserPaymentTab } from '@/app/components/profile/user/UserPaymentTab';
import { UserAPIKeyTab } from '@/app/components/profile/user/UserAPIKeyTab';
import { UserDeviceTab } from '@/app/components/profile/user/UserDeviceTab';
import { UserSecurityTab } from '@/app/components/profile/user/UserSecurityTab';
import { UserDocumentTab } from '@/app/components/profile/user/UserDocumentTab';
import { API_BASE_URL } from '@/app/api/client';
import logoMark from '@/assets/chat_logo_mark.png';


const profileTabs = ['account', 'security', 'billing', 'documents', 'api', 'devices'] as const;
type TabType = typeof profileTabs[number];
type FooterModalType = 'terms' | 'privacy' | 'support';
type NotificationItem = {
  id: number | string;
  type?: string;
  title: string;
  message: string;
  action_url?: string;
  is_read?: boolean;
  created_at?: string;
  local?: boolean;
};

const isProfileTab = (tab: unknown): tab is TabType => (
  typeof tab === 'string' && (profileTabs as readonly string[]).includes(tab)
);


export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [user, setUser] = useState<any>(authUser);
  const didHandleUnauthorized = useRef(false);

  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('access_token');
    return token && token !== 'null' && token !== 'undefined' ? token : null;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleUnauthorized = useCallback(() => {
    if (didHandleUnauthorized.current) return;
    didHandleUnauthorized.current = true;
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // 마운트 시 DB에서 최신 프로필(business_reg_s3_url 포함) 가져오기
  useEffect(() => {
    const fetchMe = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUser(data.user);
        }
      } catch { /* 조용히 실패 */ }
    };
    fetchMe();
  }, [getAuthToken, handleUnauthorized]);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    if (!isAuthenticated && !getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate, isAuthenticated, getAuthToken]);

  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab');
  const stateTab = location.state?.tab;
  const initialTab = isProfileTab(queryTab) ? queryTab : isProfileTab(stateTab) ? stateTab : 'account';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setNotifications((previous) => {
          const localItems = previous.filter((item) => item.local && !item.is_read);
          setUnreadCount(Number(data.unread_count || 0) + localItems.length);
          return [...localItems, ...(data.notifications || [])].slice(0, 30);
        });
      }
    } catch {
      // 알림은 부가 기능이므로 조용히 실패합니다.
    }
  }, [getAuthToken, handleUnauthorized]);

  useEffect(() => {
    if (!isAuthenticated && !getAuthToken()) return;

    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(timer);
  }, [fetchNotifications, getAuthToken, isAuthenticated]);

  const pushLocalNotification = useCallback((notification: NotificationItem) => {
    setNotifications((previous) => {
      if (previous.some((item) => item.id === notification.id)) return previous;
      return [notification, ...previous].slice(0, 30);
    });
    setUnreadCount((count) => count + 1);
  }, []);

  const detectNewDevices = useCallback((nextDevices: any[]) => {
    if (!user) return;

    const storageKey = `cadence_seen_devices_${user.orgId || user.email || 'default'}`;
    const nextIds = nextDevices.map((device) => String(device.id)).filter(Boolean);
    const rawSeen = localStorage.getItem(storageKey);

    if (!rawSeen) {
      localStorage.setItem(storageKey, JSON.stringify(nextIds));
      return;
    }

    let seenIds: string[] = [];
    try {
      seenIds = JSON.parse(rawSeen);
    } catch {
      seenIds = [];
    }

    const seenSet = new Set(seenIds);
    const newDevices = nextDevices.filter((device) => !seenSet.has(String(device.id)));

    newDevices.forEach((device) => {
      pushLocalNotification({
        id: `local-device-${device.id}`,
        type: 'device_registered',
        title: '새 기기가 등록되었습니다',
        message: `${device.hostname || '새 기기'}가 API Key를 통해 등록되었습니다.`,
        action_url: '/profile?tab=devices',
        is_read: false,
        created_at: new Date().toISOString(),
        local: true,
      });
    });

    localStorage.setItem(storageKey, JSON.stringify(nextIds));
  }, [pushLocalNotification, user]);

  // --- 1. Subscription & Payment State ---
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const fetchPayment = useCallback(async (force = false) => {
    if ((activeTab === 'billing' || activeTab === 'account' || force) && (!paymentInfo || force) && !isLoadingPayment) {
      if (!isAuthenticated) return;
      const token = getAuthToken();
      if (!token) return;
      setIsLoadingPayment(true);
      try {
        const response = await fetch(`${API_BASE_URL}/payments/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await response.json();
        if (data && data.success) {
          setPaymentInfo(data);
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
  }, [activeTab, paymentInfo, isLoadingPayment, isAuthenticated, getAuthToken, handleUnauthorized]);

  useEffect(() => { fetchPayment(); }, [fetchPayment]);

  // --- 2. API Keys & Devices State ---
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      if ((activeTab === 'api' || activeTab === 'account') && apiKeys.length === 0) {
        if (!isAuthenticated) return;
        const token = getAuthToken();
        if (!token) return;
        setIsLoadingKeys(true);
        try {
          const response = await fetch(`${API_BASE_URL}/keys`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.status === 401) {
            handleUnauthorized();
            return;
          }
          const data = await response.json();
          if (Array.isArray(data)) setApiKeys(data);
        } catch (error) { console.error("Keys Fetch Error", error); }
        finally { setIsLoadingKeys(false); }
      }
    };
    fetchApiKeys();
  }, [activeTab, apiKeys.length, isAuthenticated, getAuthToken, handleUnauthorized]);

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  useEffect(() => {
    const fetchDevices = async () => {
      if (activeTab === 'devices' || (activeTab === 'account' && devices.length === 0)) {
        if (!isAuthenticated) return;
        const token = getAuthToken();
        if (!token) return;
        setIsLoadingDevices(true);
        try {
          const response = await fetch(`${API_BASE_URL}/devices/`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.status === 401) {
            handleUnauthorized();
            return;
          }
          const data = await response.json();
          if (Array.isArray(data)) {
            detectNewDevices(data);
            setDevices(data);
          }
        } catch (error) { console.error("Devices Fetch Error", error); }
        finally { setIsLoadingDevices(false); }
      }
    };
    fetchDevices();
  }, [activeTab, devices.length, isAuthenticated, getAuthToken, handleUnauthorized, detectNewDevices]);

  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (activeTab !== 'account' || usageStats || !isAuthenticated) return;
      const token = getAuthToken();
      if (!token) return;
      setIsLoadingUsage(true);
      try {
        const today = new Date();
        const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        const endDate = format(today, 'yyyy-MM-dd');
        const response = await fetch(`${API_BASE_URL}/usage/stats?start_date=${startDate}&end_date=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await response.json();
        if (data?.success) setUsageStats(data);
      } catch (error) {
        console.error("Usage Fetch Error", error);
      } finally {
        setIsLoadingUsage(false);
      }
    };
    fetchUsageStats();
  }, [activeTab, usageStats, isAuthenticated, getAuthToken, handleUnauthorized]);

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
  const [footerModal, setFooterModal] = useState<FooterModalType | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>({ title: '', message: '', onConfirm: () => { }, type: 'blue' });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'blue' | 'red' = 'blue') => {
    setConfirmConfig({ title, message, onConfirm, type });
    setShowConfirmModal(true);
  };

  const markNotificationRead = async (notification: NotificationItem) => {
    if (!notification.local && !notification.is_read) {
      const token = getAuthToken();
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/notifications/${notification.id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch {
          // 읽음 처리는 실패해도 UI 흐름을 막지 않습니다.
        }
      }
    }

    setNotifications((previous) => previous.map((item) => (
      item.id === notification.id ? { ...item, is_read: true } : item
    )));
    setUnreadCount((count) => Math.max(0, count - (notification.is_read ? 0 : 1)));
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markNotificationRead(notification);
    setShowNotifications(false);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleReadAllNotifications = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {
        // 읽음 처리는 실패해도 UI 흐름을 막지 않습니다.
      }
    }

    setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  };

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

  const handleRequestProfileChangeCode = async () => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}/auth/profile-change/request-code`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('인증 이메일로 인증 코드가 발송되었습니다.');
        return true;
      }

      toast.error(data.detail || '인증 코드 발송에 실패했습니다.');
    } catch (e) {
      toast.error('인증 코드 발송 중 오류가 발생했습니다.');
    }

    return false;
  };

  const handleUpdateProfile = async (payload: {
    code: string;
    company_name?: string;
    email?: string;
    new_password?: string;
    contact_name?: string;
    contact_email?: string;
  }) => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('access_token', data.token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
          setUser(data.user);
        }
        toast.success(data.message || '계정 정보가 변경되었습니다.');
        return true;
      }

      toast.error(data.detail || '계정 정보 변경에 실패했습니다.');
    } catch (e) {
      toast.error('계정 정보 변경 중 오류가 발생했습니다.');
    }

    return false;
  };

  const fetchKeys = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/keys`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setApiKeys(data);
    } catch (e) { }
  };

  const handleGenerateKey = async (options?: { name?: string }) => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}/keys/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {}),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return null;
      }
      if (res.ok) {
        toast.success('새 API 키가 생성되었습니다.');
        const data = await res.json();
        await fetchKeys();
        return data.key || null;
      } else {
        const data = await res.json();
        toast.error(data.detail || '발급 실패');
      }
    } catch (e) { toast.error('오류가 발생했습니다.'); }

    return null;
  };

  const handleCopyApiKey = async (keyId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/keys/${keyId}/secret`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (res.ok && data.key) {
        await navigator.clipboard.writeText(data.key);
        toast.success('실제 API 키가 클립보드에 복사되었습니다.');
        return;
      }

      toast.error(data.detail || 'API 키 복사에 실패했습니다.');
    } catch (e) {
      toast.error('API 키 복사 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    triggerConfirm('API 키 폐기', '해당 키를 영구 삭제합니다. 외부 서비스 연동이 끊어질 수 있습니다. 계속하시겠습니까?', async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/keys/${keyId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) { toast.success('API 키가 즉시 폐기되었습니다.'); fetchKeys(); }
        else { const data = await res.json(); toast.error(data.detail || '삭제 실패'); }
      } catch (e) { toast.error('오류가 발생했습니다.'); }
    }, 'red');
  };

  const renderTabContent = () => {
    if (user?.verification_status !== 'verified' && activeTab !== 'account' && activeTab !== 'security') {
      return (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">서비스 승인 대기 중</p>
            <p className="text-xs text-zinc-500 mt-1">관리자의 승인이 완료된 후 모든 기능을 이용하실 수 있습니다.</p>
          </div>
          <button onClick={() => handleTabChange('account')} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium transition-colors hover:bg-zinc-700">
            계정 정보 확인
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'account':
        return (
          <UserAccountTab
            user={user}
            paymentInfo={paymentInfo}
            devices={devices}
            apiKeys={apiKeys}
            usageStats={usageStats}
            isLoadingUsage={isLoadingUsage}
            setActiveTab={handleTabChange}
          />
        );
      case 'security':
        return (
          <UserSecurityTab
            user={user}
            onRequestCode={handleRequestProfileChangeCode}
            onUpdateProfile={handleUpdateProfile}
            setShowDeleteModal={setShowDeleteModal}
          />
        );
      case 'billing':
        return <UserPaymentTab isLoadingPayment={isLoadingPayment} paymentInfo={paymentInfo} isVerified={isVerified} triggerConfirm={triggerConfirm} navigate={navigate} refetchPayment={() => fetchPayment(true)} />;
      case 'api':
        return <UserAPIKeyTab user={user} apiKeys={apiKeys} isLoadingKeys={isLoadingKeys} handleGenerateKey={handleGenerateKey} handleCopyKey={handleCopyApiKey} handleDeleteKey={handleDeleteKey} setActiveTab={handleTabChange} />;
      case 'documents':
        return <UserDocumentTab getAuthToken={getAuthToken} onUnauthorized={handleUnauthorized} />;
      case 'devices':
        return <UserDeviceTab user={user} isLoadingDevices={isLoadingDevices} devices={devices} />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'account', label: '계정 정보', icon: User },
    { id: 'security', label: '보안', icon: LockKeyhole },
    { id: 'billing', label: '요금제 정보', icon: CreditCard },
    { id: 'documents', label: '시방서 등록', icon: FileText },
    { id: 'api', label: 'API Key 관리', icon: Key },
    { id: 'devices', label: '기기 등록 현황', icon: Monitor },
  ];

  const topLinks = [
    { label: '가격 책정', icon: CreditCard, onClick: () => navigate('/pricing') },
    { label: '다운로드', icon: Download, onClick: () => navigate('/download') },
    { label: '문의하기', icon: HelpCircle, onClick: () => navigate('/inquiries') },
  ];
  const companyName = user?.companyName || user?.company_name || '사용자';
  const userEmail = user?.email || '';
  const userInitial = String(companyName).trim().charAt(0).toUpperCase() || 'C';
  const guideSections = [
    {
      title: '실시간 시스템 상태 확인',
      subtitle: '서버 안정성',
      Icon: Server,
      color: 'text-blue-600 bg-blue-50 ring-blue-100',
      check: '분석 패널 상단 또는 설정 메뉴의 서버 상태 아이콘에서 AI 엔진과 데이터베이스 상태를 확인합니다.',
      smart: '프로그램 실행 여부만 보는 것이 아니라 vLLM 응답 준비 상태와 DB 저장 가능 상태를 빠르게 점검해 분석 오류를 사전에 줄입니다.',
    },
    {
      title: '제로-클릭 자동 업데이트',
      subtitle: '최신 규정 유지',
      Icon: RefreshCw,
      color: 'text-violet-600 bg-violet-50 ring-violet-100',
      check: 'AutoCAD 실행 시 클라우드 서버와 통신해 최신 법규 엔진과 기능 업데이트를 확인합니다.',
      smart: '사용자가 설치 파일을 매번 찾지 않아도 최신 KEC, NFSC 등 설계 기준이 반영된 AI 조언을 받을 수 있습니다.',
    },
    {
      title: '끊김 없는 데이터 동기화',
      subtitle: '웹 대시보드 연동',
      Icon: Database,
      color: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
      check: '오토캐드에서 분석한 결과를 웹 마이페이지에서 보고서와 사용 현황 형태로 이어서 확인할 수 있습니다.',
      smart: '분석 데이터가 지능형 데이터 허브를 통해 관리되어 장소와 기기에 상관없이 설계 품질을 연속적으로 추적합니다.',
    },
    {
      title: '안전한 데이터 보안 전송',
      subtitle: '기업별 인증키',
      Icon: LockKeyhole,
      color: 'text-orange-600 bg-orange-50 ring-orange-100',
      check: '모든 통신은 기업별 고유 API Key를 기반으로 인증되며, 전송 데이터는 표준 암호화 절차를 거칩니다.',
      smart: 'AI 분석에 필요한 최소한의 기하학 정보만 선별 처리해 보안과 성능을 함께 확보합니다.',
    },
  ];
  const footerContents = {
    terms: {
      title: '이용약관',
      description: 'Cadence AI 서비스 이용에 관한 기본 약관입니다.',
      sections: [
        {
          heading: '제1조 목적',
          body: '본 약관은 Cadence AI가 제공하는 웹 서비스, API Key 관리, 플러그인 다운로드 및 관련 기능의 이용 조건과 회사와 회원의 권리, 의무 및 책임 사항을 정합니다.',
        },
        {
          heading: '제2조 서비스 이용',
          body: '회원은 가입 및 사업자 인증 절차를 거쳐 서비스를 이용할 수 있습니다. API Key와 등록 기기는 회원의 책임 아래 관리해야 하며, 무단 공유나 부정 사용이 확인될 경우 서비스 이용이 제한될 수 있습니다.',
        },
        {
          heading: '제3조 결제 및 구독',
          body: '유료 요금제는 선택한 결제 주기와 정책에 따라 청구됩니다. 요금제 변경, 해지, 환불은 서비스 화면과 결제 정책에 따라 처리됩니다.',
        },
        {
          heading: '제4조 책임 제한',
          body: 'Cadence AI는 도면 검토와 수정 제안을 보조하는 도구이며, 최종 설계 판단과 법규 검토 책임은 사용자에게 있습니다.',
        },
      ],
    },
    privacy: {
      title: '개인정보처리방침',
      description: 'Cadence AI가 개인정보를 수집하고 보호하는 기준입니다.',
      sections: [
        {
          heading: '수집 항목',
          body: '회원가입 및 서비스 제공을 위해 이메일, 기업명, 사업자등록 정보, 결제 상태, API Key 발급 내역, 등록 기기 정보, 접속 및 사용 기록을 수집할 수 있습니다.',
        },
        {
          heading: '이용 목적',
          body: '수집한 정보는 본인 확인, 사업자 인증, 요금제 관리, API Key 및 기기 관리, 고객 문의 응대, 서비스 안정성 개선을 위해 사용됩니다.',
        },
        {
          heading: '보관 및 파기',
          body: '개인정보는 서비스 이용 기간 동안 보관하며, 회원 탈퇴 또는 목적 달성 후 관련 법령에서 정한 보관 기간을 제외하고 지체 없이 파기합니다.',
        },
        {
          heading: '보호 조치',
          body: 'Cadence AI는 접근 권한 관리, 암호화, 로그 관리 등 합리적인 보호 조치를 통해 개인정보가 무단으로 열람, 유출, 변조되지 않도록 관리합니다.',
        },
      ],
    },
    support: {
      title: '고객센터',
      description: '서비스 이용 중 문제가 생기면 아래 기준에 따라 문의해 주세요.',
      sections: [
        {
          heading: '1:1 문의',
          body: '문의하기 메뉴에서 계정, 결제, API Key, 기기 등록, 플러그인 설치 관련 문의를 남길 수 있습니다. 비회원 문의는 PIN을 통해 비밀글로 확인할 수 있습니다.',
        },
        {
          heading: '운영 안내',
          body: '문의 접수 후 순차적으로 답변하며, 결제 오류나 API Key 유출 의심처럼 긴급한 문제는 문의 제목에 긴급 표시를 포함해 주세요.',
        },
        {
          heading: '자가 점검',
          body: '플러그인 연결 문제는 API Key 상태, 등록 기기 수, Windows AutoCAD 지원 여부를 먼저 확인하면 빠르게 해결할 수 있습니다.',
        },
      ],
    },
  };
  const activeFooterContent = footerModal ? footerContents[footerModal] : null;

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-zinc-950">
      <div className="flex h-screen">
        <aside className="hidden h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-r border-zinc-200/70 bg-white/82 px-6 py-8 shadow-[18px_0_45px_rgba(15,23,42,0.04)] backdrop-blur-xl xl:flex">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-10 flex items-center gap-3 text-left"
          >
            <img src={logoMark} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
            <span className="text-xl font-black tracking-tight text-zinc-950">Cadence AI</span>
          </button>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex h-14 w-full items-center gap-4 rounded-2xl px-5 text-sm font-bold transition-all ${
                    selected
                      ? 'bg-violet-50 text-[#6d4aff] shadow-[0_14px_30px_rgba(109,74,255,0.10)]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-5">
            <div className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50/70 p-5 shadow-[0_18px_42px_rgba(109,74,255,0.12)]">
              <p className="text-sm font-black text-[#6d4aff]">더 스마트한 API 활용</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Cadence AI 가이드 문서를 확인해보세요.</p>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-bold text-[#6d4aff] transition-colors hover:bg-violet-50"
              >
                <BookOpen className="h-3.5 w-3.5" />
                문서 바로가기
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white px-2 py-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d4aff] text-sm font-black text-white">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{companyName}님</p>
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1320px] flex-col">
            <div className="mb-6 flex items-center justify-between xl:hidden">
              <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
                <img src={logoMark} alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
                <span className="text-lg font-black tracking-tight">Cadence AI</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600"
              >
                로그아웃
              </button>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${
                      selected
                        ? 'border-[#6d4aff] bg-[#6d4aff] text-white'
                        : 'border-zinc-200 bg-white text-zinc-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <header className="mb-6 hidden justify-end lg:flex">
              <div className="flex items-center gap-3">
                {topLinks.map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-white hover:text-slate-950"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {label}
                  </button>
                ))}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications((open) => !open);
                      setShowUserMenu(false);
                      fetchNotifications();
                    }}
                    className="relative rounded-2xl p-3 text-slate-500 transition-colors hover:bg-white hover:text-slate-950"
                    aria-label="알림"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#6d4aff] ring-2 ring-[#f8fafc]" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                        <div>
                          <p className="text-sm font-black text-zinc-950">알림</p>
                          <p className="mt-0.5 text-xs font-medium text-zinc-400">
                            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '새 알림이 없습니다'}
                          </p>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleReadAllNotifications}
                            className="text-xs font-bold text-[#6d4aff] hover:text-[#4f35d5]"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>

                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center">
                            <Bell className="mx-auto h-6 w-6 text-zinc-300" />
                            <p className="mt-3 text-sm font-semibold text-zinc-400">표시할 알림이 없습니다.</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                              className="flex w-full gap-3 border-b border-zinc-50 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-zinc-50"
                            >
                              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-zinc-200' : 'bg-[#6d4aff]'}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-zinc-900">{notification.title}</span>
                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-zinc-500">{notification.message}</span>
                                {notification.created_at && (
                                  <span className="mt-2 block text-[11px] font-semibold text-zinc-300">
                                    {format(new Date(notification.created_at), 'M. d. HH:mm')}
                                  </span>
                                )}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu((open) => !open);
                      setShowNotifications(false);
                    }}
                    className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 ring-zinc-100 transition-colors hover:bg-zinc-50"
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                  >
                    {companyName}님
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.16)]">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {!isVerified && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
                사업자 등록 승인 대기 중입니다. 승인 완료 후 모든 기능을 이용하실 수 있습니다.
              </div>
            )}

            {renderTabContent()}

            <footer className="mt-auto pt-10 pb-1 text-center text-[6px] font-medium text-slate-400">
              <div className="mb-1.5 flex items-center justify-center gap-3">
                <button type="button" onClick={() => setFooterModal('terms')} className="text-[7px] font-semibold hover:text-slate-600">이용약관</button>
                <button type="button" onClick={() => setFooterModal('privacy')} className="text-[7px] font-semibold hover:text-slate-600">개인정보처리방침</button>
                <button type="button" onClick={() => setFooterModal('support')} className="text-[7px] font-semibold hover:text-slate-600">고객센터</button>
              </div>
              <p>© 2024 Cadence AI. All rights reserved.</p>
            </footer>
          </div>
        </main>
      </div>

      {/* API Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setShowGuideModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.32)]"
            >
              <div className="relative overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 px-7 py-7">
                <div className="absolute right-8 top-6 h-24 w-24 rounded-full bg-violet-200/35 blur-3xl" />
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#6d4aff] ring-1 ring-violet-100">
                      <BookOpen className="h-3.5 w-3.5" />
                      Cadence AI Guide
                    </div>
                    <h3 className="max-w-2xl text-2xl font-black leading-tight tracking-tight text-slate-950 md:text-3xl">
                      더 스마트한 지능형 서비스 활용하기
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Cadence AI는 백엔드의 AI 엔진과 실시간으로 소통하며 도면 설계에 집중할 수 있도록 돕는 지능형 연결 서비스입니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(false)}
                    className="rounded-2xl bg-white/70 p-2 text-slate-400 ring-1 ring-zinc-200 transition-colors hover:bg-white hover:text-slate-700"
                    aria-label="가이드 문서 닫기"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-7 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {guideSections.map(({ title, subtitle, Icon, color, check, smart }, index) => (
                    <section key={title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#6d4aff]">{String(index + 1).padStart(2, '0')} · {subtitle}</p>
                          <h4 className="mt-1 text-base font-black text-slate-950">{title}</h4>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4 text-sm leading-7">
                        <div>
                          <p className="mb-1 font-black text-slate-800">어떻게 확인하나요?</p>
                          <p className="text-slate-600">{check}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-black text-slate-800">왜 스마트한가요?</p>
                          <p className="text-slate-600">{smart}</p>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 px-5 py-4">
                  <p className="text-sm font-black text-[#6d4aff]">TIP</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    시스템이 원활하지 않다면 인터넷 연결 상태를 확인하거나 설정 메뉴의 서버 상태 체크 버튼을 눌러보세요.
                    AI 에이전트가 실시간으로 문제를 진단하고 해결 방법을 안내합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-7 py-4">
                <p className="text-xs font-medium text-slate-400">도면 설계는 사용자가, 연결과 점검은 Cadence AI가 함께 돕습니다.</p>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="shrink-0 rounded-2xl bg-[#6d4aff] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5b3af0]"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Policy Modal */}
      <AnimatePresence>
        {activeFooterContent && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setFooterModal(null)} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="relative flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-zinc-950">{activeFooterContent.title}</h3>
                  <p className="mt-1 text-sm font-medium text-zinc-500">{activeFooterContent.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFooterModal(null)}
                  className="rounded-2xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label={`${activeFooterContent.title} 닫기`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto px-6 py-5">
                {activeFooterContent.sections.map((section) => (
                  <section key={section.heading} className="rounded-2xl bg-zinc-50 px-5 py-4">
                    <h4 className="text-sm font-black text-zinc-900">{section.heading}</h4>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{section.body}</p>
                  </section>
                ))}
              </div>

              <div className="border-t border-zinc-100 px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setFooterModal(null)}
                  className="rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <button onClick={() => { setNewGeneratedKey(null); navigate('/download'); }} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm rounded-xl border border-zinc-200 transition-colors">
                      다운로드 페이지로 이동
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
