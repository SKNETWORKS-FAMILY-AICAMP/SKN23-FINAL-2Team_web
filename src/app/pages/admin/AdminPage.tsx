import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, UserCog, Activity, Server, ChevronLeft, CheckCircle,
  XCircle, Eye, ExternalLink, ShieldCheck, Calendar as CalendarIcon,
  RefreshCw, ChevronDown
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { format, subDays, startOfMonth } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('approvals');
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // 데이터 상태
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]);
  const [allDevices, setAllDevices] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 사용량 통계 상태
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageDateRange, setUsageDateRange] = useState({
    start: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'calls' | 'tokens'>('all');

  // 모달 제어 상태
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'approve' | 'reject';
    orgId: string;
    companyName: string;
  }>({ show: false, type: 'approve', orgId: '', companyName: '' });



  // 데이터 로딩 함수들
  const fetchPendingApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/admin/pending-approvals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (error) { toast.error('승인 대기 목록 로드 실패'); }
    finally { setIsLoadingApprovals(false); }
  };

  const fetchAllOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/admin/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAllOrganizations(Array.isArray(data) ? data : []);
    } catch (error) { toast.error('회원 목록 로드 실패'); }
    finally { setIsLoadingOrgs(false); }
  };

  const fetchAllDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/admin/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAllDevices(Array.isArray(data) ? data : []);
    } catch (error) { toast.error('기기 목록 로드 실패'); }
    finally { setIsLoadingDevices(false); }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) { console.error('Stats load failed'); }
  };

  const fetchUsageStats = async () => {
    setIsLoadingUsage(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = `http://localhost:8000/api/v1/admin/usage-stats?start_date=${usageDateRange.start}&end_date=${usageDateRange.end}&org_id=${selectedOrgId}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsageStats(data);
    } catch (error) { toast.error('사용량 통계 로드 실패'); }
    finally { setIsLoadingUsage(false); }
  };

  useEffect(() => {
if (isAuthenticated && (user?.role === 'admin' || user?.role === 'superuser')) {
      fetchDashboardStats();
      if (activeTab === 'approvals') fetchPendingApprovals();
      else if (activeTab === 'management') fetchAllOrganizations();
      else if (activeTab === 'devices') fetchAllDevices();
      else if (activeTab === 'usage') fetchUsageStats();
    }
  }, [activeTab, usageDateRange, selectedOrgId, isAuthenticated, user]);

  // 비로그인 튕기기
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // 관리자가 아닌 일반 계정이 URL 치고 접근 시 마이페이지로 튕기기
  if (user && user.role !== 'admin' && user.role !== 'superuser') {
    return <Navigate to="/profile" replace />;
  }

  // 날짜 선택 핸들러
  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setUsageDateRange(prev => ({ ...prev, [type]: value }));
  };

  const setQuickRange = (days: number | 'month') => {
    const end = new Date();
    let start;
    if (days === 'month') {
      start = startOfMonth(new Date());
    } else {
      start = subDays(new Date(), days - 1);
    }
    setUsageDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  // 기기 차단 액션
  const handleBlockDevice = async (id: string, hostname: string) => {
    if (!confirm(`${hostname} 기기를 차단하시겠습니까?`)) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/devices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('기기가 성공적으로 차단되었습니다.');
        fetchAllDevices();
      }
    } catch (error) { toast.error('기기 차단 처리 중 오류'); }
  };

  // 플랜 변경 액션
  const handleUpdatePlan = async (orgId: string, companyName: string, newPlan: string) => {
    if (!confirm(`${companyName} 기업의 요금제를 ${newPlan}으로 변경하시겠습니까?`)) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/organizations/${orgId}/plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: newPlan })
      });
      if (response.ok) {
        toast.success('요금제가 성공적으로 변경되었습니다.');
        fetchAllOrganizations();
      }
    } catch (error) { toast.error('요금제 변경 처리 중 오류'); }
  };

  const executeAction = async () => {
    const { type, orgId, companyName } = confirmModal;
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = type === 'approve' ? 'approve' : 'reject';
      const response = await fetch(`http://localhost:8000/api/v1/admin/${endpoint}/${orgId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (type === 'approve') {
          toast.success(`${companyName} 승인이 완료되었습니다.`);
        } else {
          toast.error(`${companyName} 가입 거절 처리가 완료되었습니다.`);
        }
        fetchPendingApprovals();
      } else {
        toast.error('처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      toast.error('API 통신 오류가 발생했습니다.');
    } finally {
      setConfirmModal({ ...confirmModal, show: false });
    }
  };

  // 필터링된 회원 목록 (린트 에러 수정용 복구)
  const filteredOrgs = allOrganizations.filter(org =>
    (org.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (org.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (org.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [
    { id: 'approvals', label: '가입 승인 대기열', icon: Users },
    { id: 'management', label: '전체 회원 관리', icon: UserCog },
    { id: 'usage', label: '시스템 전체 사용량', icon: Activity },
    { id: 'devices', label: '전체 서버/기기 상태', icon: Server },
  ];

  return (
    <div className="dark min-h-screen bg-[#0e0e0e] text-zinc-100 font-sans">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="hover:bg-white/10 p-2 rounded-xl transition-all group border border-transparent hover:border-white/10">
            <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
              Cadence Admin
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase border border-red-500/20 tracking-wider">
              System Control
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-zinc-400">
            {user?.companyName || user?.email} <span className="text-red-400 font-bold ml-1 border pl-2 pr-2 py-0.5 rounded-full border-red-500/30">ADMIN</span>
          </span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="px-4 py-2 hover:bg-white/5 rounded-lg text-red-400 border border-transparent hover:border-red-500/20 transition-all flex items-center gap-2"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 통합 통계 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-zinc-950/40 p-6 rounded-3xl border border-white/5 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total API Calls</p>
            <h3 className="text-3xl font-black text-white">{dashboardStats?.total_calls.toLocaleString() || '0'}</h3>
          </div>
          <div className="bg-zinc-950/40 p-6 rounded-3xl border border-white/5 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Tokens Used</p>
            <h3 className="text-3xl font-black text-red-500">{(dashboardStats?.total_tokens / 1000).toFixed(1)}K</h3>
          </div>
          <div className="bg-zinc-950/40 p-6 rounded-3xl border border-white/5 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Orgs</p>
            <h3 className="text-3xl font-black text-white">{dashboardStats?.total_orgs || '0'}</h3>
          </div>
          <div className="bg-zinc-950/40 p-6 rounded-3xl border border-white/5 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Issued Keys</p>
            <h3 className="text-3xl font-black text-white">{dashboardStats?.total_keys || '0'}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6">
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left w-full ${isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5' : 'text-zinc-500 hover:bg-zinc-900/80 hover:text-white border border-transparent'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-zinc-600'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-950/30 p-8 rounded-3xl border border-white/5 min-h-[600px] shadow-2xl"
              >
                {activeTab === 'approvals' && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-white">가입 승인 대기열</h2>
                        <p className="text-zinc-500 text-sm mt-1">기업 회원들의 사업자등록증을 검토하고 승인 여부를 결정합니다.</p>
                      </div>
                      <div className="bg-zinc-900/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-bold text-white">{pendingUsers.length}건 대기 중</span>
                      </div>
                    </div>

                    {isLoadingApprovals ? (
                      <div className="text-center py-20 text-zinc-500 animate-pulse">데이터를 불러오는 중입니다...</div>
                    ) : pendingUsers.length === 0 ? (
                      <div className="text-center py-20 text-zinc-600 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                        <Users className="w-8 h-8 mx-auto mb-4 text-zinc-700" />
                        대기 중인 회원이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingUsers.map((org) => (
                          <div key={org.id} className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                            <div className="flex gap-6 items-center">
                              <div className="bg-zinc-800 p-3 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-yellow-500/70" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                  {org.company_name}
                                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 font-mono">ID: {org.id.split('-')[0]}</span>
                                </h4>
                                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                  <span>이메일: {org.admin_email || org.email}</span>
                                  <span>신청일: {org.created_at ? format(new Date(org.created_at), 'yyyy-MM-dd HH:mm') : 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedImg(org.business_reg_s3_url || 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800')}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5 flex items-center gap-2 transition-all"
                              >
                                <Eye className="w-4 h-4" /> 등록증 확인
                              </button>
                              <button
                                onClick={() => setConfirmModal({ show: true, type: 'approve', orgId: org.id, companyName: org.company_name })}
                                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#0071e3]/10"
                              >
                                <CheckCircle className="w-4 h-4" /> 승인
                              </button>
                              <button
                                onClick={() => setConfirmModal({ show: true, type: 'reject', orgId: org.id, companyName: org.company_name })}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg flex items-center gap-2 transition-all border border-red-500/10"
                              >
                                <XCircle className="w-4 h-4" /> 거절
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 나머지 탭들은 placeholder 유지 */}
                {activeTab === 'management' && (
                  <div>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-white">전체 회원 관리</h2>
                        <p className="text-zinc-500 text-sm mt-1">시스템에 가입된 모든 회원을 조회하고 관리합니다.</p>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="기업명 또는 이메일 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 w-64 transition-all"
                        />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">기업명</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">관리자 이메일</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">구독 플랜</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">가입 일자</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {isLoadingOrgs ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-500 animate-pulse">데이터를 불러오는 중...</td></tr>
                          ) : filteredOrgs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-600">등록된 회원이 없습니다.</td></tr>
                          ) : (
                            filteredOrgs.map(org => (
                              <tr key={org.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 font-bold text-zinc-200">{org.company_name}</td>
                                <td className="px-6 py-4 text-zinc-400 font-mono">{org.admin_email || org.email}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${org.verification_status === 'verified' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                    org.verification_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                      'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {org.verification_status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-zinc-300 font-medium capitalize">{org.plan || 'Free'}</span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">
                                  {org.created_at ? format(new Date(org.created_at), 'yyyy-MM-dd') : 'N/A'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'usage' && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">시스템 전체 사용량</h2>
                        <p className="text-zinc-500 text-sm mt-1">플랫폼 전체 또는 기업별 실시간 호출 및 토큰 추이입니다.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* 기업 필터 */}
                        <select
                          value={selectedOrgId}
                          onChange={(e) => setSelectedOrgId(e.target.value)}
                          className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded-xl px-4 py-2 font-bold outline-none hover:border-white/20 transition-all"
                        >
                          <option value="all">전체 기업 보기</option>
                          {allOrganizations.map(org => (
                            <option key={org.id} value={org.id}>{org.company_name}</option>
                          ))}
                        </select>

                        {/* 기간 퀵 필터 */}
                        <div className="flex bg-zinc-900 border border-white/10 p-1 rounded-xl">
                          {[
                            { label: '7일', val: 7 },
                            { label: '30일', val: 30 },
                            { label: '이번 달', val: 'month' }
                          ].map((r: any) => (
                            <button
                              key={r.label}
                              onClick={() => setQuickRange(r.val)}
                              className="px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>

                        {/* 달력 직접 선택 */}
                        <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl">
                          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                          <input
                            type="date"
                            value={usageDateRange.start}
                            onChange={(e) => handleCustomDateChange('start', e.target.value)}
                            className="bg-transparent text-xs text-zinc-300 focus:outline-none"
                          />
                          <span className="text-zinc-600 text-xs">~</span>
                          <input
                            type="date"
                            value={usageDateRange.end}
                            onChange={(e) => handleCustomDateChange('end', e.target.value)}
                            className="bg-transparent text-xs text-zinc-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {isLoadingUsage ? (
                      <div className="h-[450px] bg-zinc-900/30 rounded-3xl border border-white/5 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
                      </div>
                    ) : usageStats?.success ? (
                      <div className="space-y-6">
                        {/* 상세 요약 카드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5">
                            <p className="text-zinc-500 text-xs font-bold uppercase mb-4">Metric Summary ({selectedOrgId === 'all' ? 'All Orgs' : 'Selected Org'})</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-3xl font-black text-white">{usageStats.total_calls.toLocaleString()}</div>
                                <div className="text-xs text-zinc-500 font-bold uppercase">Total API Calls</div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-black text-red-500">{(usageStats.total_tokens / 1000).toFixed(1)}K</div>
                                <div className="text-xs text-zinc-500 font-bold uppercase">Total Tokens</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5">
                            <p className="text-zinc-500 text-xs font-bold uppercase mb-4">Selected Metric Graph</p>
                            <div className="flex gap-2">
                              {['all', 'calls', 'tokens'].map(m => (
                                <button
                                  key={m}
                                  onClick={() => setSelectedMetric(m as any)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedMetric === m ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                                >
                                  {m.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 차트 영역 */}
                        <div className="bg-zinc-900/40 p-8 rounded-3xl border border-white/5 h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={usageStats.daily_stats}>
                              <defs>
                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis
                                dataKey="date"
                                stroke="#555"
                                fontSize={10}
                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                              />
                              <YAxis stroke="#555" fontSize={10} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                                itemStyle={{ fontSize: '12px' }}
                              />
                              {(selectedMetric === 'all' || selectedMetric === 'calls') && (
                                <Area type="monotone" dataKey="calls" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                              )}
                              {(selectedMetric === 'all' || selectedMetric === 'tokens') && (
                                <Area type="monotone" dataKey="tokens" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                              )}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-40 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                        <Activity className="w-12 h-12 text-zinc-700 mb-4" />
                        <p className="text-zinc-500">지정된 범위 내에 사용량 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'devices' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">전체 서버/기기 상태</h2>
                    <p className="text-zinc-500 text-sm mb-8">플러그인이 설치된 전체 물리 기기의 Machine ID 식별 및 접속 상태를 모니터링합니다.</p>

                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">소속 기업</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">기기 이름</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Machine ID (Unique)</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {isLoadingDevices ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-500 animate-pulse">기기 상태 로딩 중...</td></tr>
                          ) : allDevices.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-600">활성 기기가 없습니다.</td></tr>
                          ) : (
                            allDevices.map(dev => (
                              <tr key={dev.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 font-bold text-zinc-200">{dev.company_name}</td>
                                <td className="px-6 py-4 text-zinc-300 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {dev.hostname}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-[10px]">{dev.machine_id}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">ONLINE</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleBlockDevice(dev.id, dev.hostname)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold rounded-lg border border-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    기기 차단
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 이미지 확인 모달 */}
      <AnimatePresence>
        {selectedImg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedImg(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <span className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" /> 사업자등록증 원본 확인
                </span>
                <button onClick={() => setSelectedImg(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <XCircle className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              <div className="p-8 flex justify-center bg-zinc-950 overflow-auto max-h-[70vh]">
                <img
                  src={selectedImg}
                  alt="Business Registration Certificate"
                  className="max-w-full h-auto rounded-lg shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800'; // S3 불능 시 샘플
                  }}
                />
              </div>
              {!selectedImg.includes('unsplash') ? (
                <div className="p-4 bg-zinc-900/50 border-t border-white/10 flex justify-center">
                  <a href={selectedImg} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0071e3] font-bold hover:underline flex items-center gap-1">
                    새 창에서 고해상도로 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-red-500/5 border-t border-red-500/10 flex justify-center text-xs text-red-400 font-bold italic">
                  * s3 경로에 이미지가 없어 샘플 이미지를 표시 중입니다.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 승인/거절 확인 커스텀 모달 */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, show: false })} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${confirmModal.type === 'approve' ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-red-500/10 text-red-500'}`}>
                {confirmModal.type === 'approve' ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-center mb-2">
                {confirmModal.type === 'approve' ? '가입 승인 확정' : '가입 거절 확정'}
              </h3>
              <p className="text-zinc-500 text-center text-sm mb-8 leading-relaxed">
                <span className="text-white font-bold">{confirmModal.companyName}</span> {confirmModal.type === 'approve' ? '회원의 서비스 이용을 승인하시겠습니까?' : '회원의 가입 요청을 거부하시겠습니까?'}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={executeAction}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${confirmModal.type === 'approve' ? 'bg-[#0071e3] hover:bg-[#0071e3]/90 text-white shadow-[#0071e3]/20' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'}`}
                >
                  {confirmModal.type === 'approve' ? '지금 승인하기' : '준회원으로 거절하기'}
                </button>
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-bold rounded-xl transition-all"
                >
                  돌아가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
