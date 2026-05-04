/*
File    : src/app/pages/AdminPage.tsx
Author  : 김민정
Create  : 2026-04-24
Description : Cadence AI 관리자 콘솔 — 기업형 레이아웃 (Pretendard, 라이트)
Modification History:
    - 2026-04-27 : 라이트 테마 + 기업 관리자 포털 스타일 전면 개편
*/
import React, { useState, useEffect } from 'react';
import {
  Users, Building2, BarChart3,
  MessagesSquare, FileBox, Bell, TrendingUp, Clock,
  CheckCircle2, ChevronRight, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '@/app/api/admin';
import { useAdminAuth, getAdminToken } from '@/app/context/AdminAuthContext';
import { AdminApprovalsTab } from '@/app/components/profile/admin/AdminApprovalsTab';
import { AdminManagementTab } from '@/app/components/profile/admin/AdminManagementTab';
import { AdminUsageTab } from '@/app/components/profile/admin/AdminUsageTab';
import { AdminInquiriesTab } from '@/app/components/profile/admin/AdminInquiriesTab';
import { AdminDocumentsTab } from '@/app/components/profile/admin/AdminDocumentsTab';
import logoMark from '../../../../user/src/assets/chat_logo_mark.png';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, adminLogout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('approvals');

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isLoading, setIsLoading] = useState({
    approvals: false, orgs: false, usage: false, inquiries: false
  });

  const handle401 = () => { adminLogout(); navigate('/login'); };

  const fetchPendingApprovals = async () => {
    setIsLoading(prev => ({ ...prev, approvals: true }));
    try {
      const res = await adminApi.getPendingApprovals(getAdminToken()!);
      if (!res.ok) { if (res.status === 401) handle401(); return; }
      const data = await res.json();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('승인 목록 로드 실패'); setPendingUsers([]); }
    finally { setIsLoading(prev => ({ ...prev, approvals: false })); }
  };

  const fetchAllOrganizations = async (name?: string, plan?: string) => {
    setIsLoading(prev => ({ ...prev, orgs: true }));
    try {
      const res = await adminApi.getOrganizations(getAdminToken()!, name, plan);
      if (!res.ok) { if (res.status === 401) handle401(); return; }
      const data = await res.json();
      setAllOrganizations(Array.isArray(data) ? data : []);
    } catch { toast.error('기업 목록 로드 실패'); setAllOrganizations([]); }
    finally { setIsLoading(prev => ({ ...prev, orgs: false })); }
  };

  const fetchUsageStats = async (start: string, end: string, orgId?: string) => {
    setIsLoading(prev => ({ ...prev, usage: true }));
    try {
      const res = await adminApi.getUsageStats(getAdminToken()!, start, end, orgId);
      if (!res.ok) { if (res.status === 401) handle401(); return; }
      const data = await res.json();
      setUsageStats(data);
    } catch { toast.error('통계 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, usage: false })); }
  };

  const fetchInquiries = async (status?: string) => {
    setIsLoading(prev => ({ ...prev, inquiries: true }));
    try {
      const res = await adminApi.getInquiries(getAdminToken()!, status);
      if (!res.ok) { if (res.status === 401) handle401(); return; }
      const data = await res.json();
      setInquiries(Array.isArray(data) ? data : []);
    } catch { toast.error('Q&A 로드 실패'); setInquiries([]); }
    finally { setIsLoading(prev => ({ ...prev, inquiries: false })); }
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getDashboardStats(getAdminToken()!);
      if (!res.ok) { if (res.status === 401) handle401(); return; }
      const data = await res.json();
      setDashboardStats(data);
    } catch { }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchPendingApprovals(), fetchInquiries()]);
    setIsRefreshing(false);
    toast.success('데이터가 갱신되었습니다.');
  };

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    fetchStats();
    fetchPendingApprovals();
    fetchInquiries();
  }, [isAdminAuthenticated]);

  // 30초마다 자동 갱신
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const interval = setInterval(() => { fetchPendingApprovals(); fetchInquiries(); }, 30000);
    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (activeTab === 'management') fetchAllOrganizations();
    else if (activeTab === 'usage') {
      if (allOrganizations.length === 0) fetchAllOrganizations();
      fetchUsageStats(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
    }
  }, [activeTab, isAdminAuthenticated]);

  const navItems = [
    { id: 'approvals', icon: Users, label: '가입 승인', badge: pendingUsers.length },
    { id: 'management', icon: Building2, label: '기업 관리' },
    { id: 'usage', icon: BarChart3, label: '사용량 통계' },
    { id: 'tickets', icon: MessagesSquare, label: 'Q&A 관리', badge: inquiries.filter(i => i.status === 'pending').length },
    { id: 'documents', icon: FileBox, label: '문서 관리' },
  ];

  const statCards = dashboardStats ? [
    { label: '전체 가입 기업', value: dashboardStats.total_orgs?.toLocaleString() ?? '0', unit: '개사', icon: Building2, color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
    { label: '승인 대기', value: pendingUsers.length.toString(), unit: '건', icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: '총 API 호출', value: dashboardStats.total_calls?.toLocaleString() ?? '0', unit: '회', icon: TrendingUp, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: '발급 라이선스', value: dashboardStats.total_keys?.toLocaleString() ?? '0', unit: '개', icon: CheckCircle2, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ] : [];

  const tabLabels: Record<string, string> = {
    approvals: '가입 승인 관리',
    management: '기업 회원 관리',
    usage: '시스템 사용량 통계',
    tickets: 'Q&A 문의 관리',
    documents: '법령 문서 관리',
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]" style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}>
      {/* GNB — 최상단 헤더 */}
      <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 flex-shrink-0 w-56">
          <img src={logoMark} alt="Cadence AI" className="h-7 w-7 object-contain" />
          <div className="leading-tight">
            <span className="font-bold text-slate-900 text-sm">Cadence AI</span>
          </div>
        </div>

        {/* 가운데 — 현재 페이지 */}
        <div className="flex-1 px-6 hidden md:block">
          <span className="text-sm font-semibold text-slate-500">
            {tabLabels[activeTab] ?? ''}
          </span>
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingUsers.length > 0 && (
            <button
              onClick={() => setActiveTab('approvals')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all"
            >
              <Bell className="w-3 h-3" />
              신규 가입 {pendingUsers.length}건
            </button>
          )}
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            title="전체 데이터 새로고침"
            className="p-2 text-slate-400 hover:text-[#1e40af] hover:bg-blue-50 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { adminLogout(); navigate('/login'); }}
            className="px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all border border-transparent hover:border-red-100"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex">
        {/* LNB — 좌측 사이드바 */}
        <aside className="w-56 bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] flex flex-col py-4 sticky top-14 flex-shrink-0">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">메뉴</p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left group ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-[#1e40af]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-[#1e40af]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.badge != null && item.badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {activeTab === item.id && <ChevronRight className="w-3 h-3 text-[#1e40af]" />}
                </div>
              </button>
            ))}
          </nav>

          {/* 사이드바 하단 — 버전 정보 */}
          <div className="px-5 pt-4 border-t border-slate-100 mt-4">
            <p className="text-[10px] text-slate-300 font-medium">Cadence AI Console</p>
            <p className="text-[9px] text-slate-300">v2.0.0 · SKN23 Family</p>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-w-0 p-6 space-y-6">
          {/* 통계 카드 */}
          {statCards.length > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderColor: stat.border }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                    <p className="text-xl font-extrabold text-slate-900 leading-tight">
                      {stat.value}
                      <span className="text-xs font-normal text-slate-400 ml-1">{stat.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 탭 콘텐츠 카드 */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[500px] p-6">
            {activeTab === 'approvals' && (
              <AdminApprovalsTab isLoading={isLoading.approvals} users={pendingUsers} onRefresh={fetchPendingApprovals} />
            )}
            {activeTab === 'management' && (
              <AdminManagementTab isLoading={isLoading.orgs} orgs={allOrganizations} onSearch={fetchAllOrganizations} onRefresh={fetchAllOrganizations} />
            )}
            {activeTab === 'usage' && (
              <AdminUsageTab isLoading={isLoading.usage} stats={usageStats?.daily_stats || []} orgs={allOrganizations} onSearch={fetchUsageStats} />
            )}
            {activeTab === 'tickets' && (
              <AdminInquiriesTab isLoading={isLoading.inquiries} inquiries={inquiries} onRefresh={fetchInquiries} />
            )}
            {activeTab === 'documents' && (
              <AdminDocumentsTab />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
