/*
File    : src/app/pages/AdminPage.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 시스템 관리자 컨트롤 타워
Modification History:
    - 2026-04-26 (김민정) : 문서 관리 탭 추가
*/

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, BarChart3, Monitor,
  LogOut, Menu, X, ChevronLeft,
  MessagesSquare, FileBox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '@/app/api/admin';
import { useAdminAuth, getAdminToken } from '@/app/context/AdminAuthContext';
import { AdminApprovalsTab } from '@/app/components/profile/admin/AdminApprovalsTab';
import { AdminManagementTab } from '@/app/components/profile/admin/AdminManagementTab';
import { AdminUsageTab } from '@/app/components/profile/admin/AdminUsageTab';
import { AdminDevicesTab } from '@/app/components/profile/admin/AdminDevicesTab';
import { AdminInquiriesTab } from '@/app/components/profile/admin/AdminInquiriesTab';
import { AdminDocumentsTab } from '@/app/components/profile/admin/AdminDocumentsTab';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, adminLogout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('approvals');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);

  const [isLoading, setIsLoading] = useState({
    approvals: false,
    orgs: false,
    usage: false,
    devices: false,
    inquiries: false
  });


  const fetchPendingApprovals = async () => {
    setIsLoading(prev => ({ ...prev, approvals: true }));
    try {
      const res = await adminApi.getPendingApprovals(getAdminToken()!);
      const data = await res.json();
      setPendingUsers(data);
    } catch (e) { toast.error('승인 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, approvals: false })); }
  };

  const fetchAllOrganizations = async (name?: string, plan?: string) => {
    setIsLoading(prev => ({ ...prev, orgs: true }));
    try {
      const res = await adminApi.getOrganizations(getAdminToken()!, name, plan);
      const data = await res.json();
      setAllOrganizations(data);
    } catch (e) { toast.error('기업 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, orgs: false })); }
  };

  const fetchUsageStats = async (start: string, end: string, orgId?: string) => {
    setIsLoading(prev => ({ ...prev, usage: true }));
    try {
      const res = await adminApi.getUsageStats(getAdminToken()!, start, end, orgId);
      const data = await res.json();
      setUsageStats(data);
    } catch (e) { toast.error('통계 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, usage: false })); }
  };

  const fetchDevices = async (orgId?: string) => {
    setIsLoading(prev => ({ ...prev, devices: true }));
    try {
      const res = await adminApi.getDevices(getAdminToken()!, orgId);
      const data = await res.json();
      setDevices(data);
    } catch (e) { toast.error('기기 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, devices: false })); }
  };

  const fetchInquiries = async (status?: string) => {
    setIsLoading(prev => ({ ...prev, inquiries: true }));
    try {
      const res = await adminApi.getInquiries(getAdminToken()!, status);
      const data = await res.json();
      setInquiries(data);
    } catch (e) { toast.error('Q&A 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, inquiries: false })); }
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getDashboardStats(getAdminToken()!);
      const data = await res.json();
      setDashboardStats(data);
    } catch (e) { }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchStats();
      if (activeTab === 'approvals') fetchPendingApprovals();
      else if (activeTab === 'management') fetchAllOrganizations();
      else if (activeTab === 'usage') fetchUsageStats(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      else if (activeTab === 'devices') fetchDevices();
      else if (activeTab === 'tickets') fetchInquiries();
    }
  }, [activeTab, isAdminAuthenticated]);

  return (
    <div className="dark min-h-screen bg-[#080808] text-zinc-100 flex font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-black/40 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col z-50`}>
        <div className="p-8 mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          {isSidebarOpen && <h1 className="text-xl font-black text-white tracking-widest uppercase">Admin <span className="text-red-500">Core</span></h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'approvals', icon: Users, label: '승인 대기열' },
            { id: 'management', icon: Building2, label: '기업 관리' },
            { id: 'usage', icon: BarChart3, label: '시스템 사용량' },
            { id: 'devices', icon: Monitor, label: '기기 상태' },
            { id: 'tickets', icon: MessagesSquare, label: 'Q&A 관리' },
            { id: 'documents', icon: FileBox, label: '문서 관리' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group ${activeTab === item.id
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {isSidebarOpen && <span className="font-bold text-[13px] tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 text-zinc-100">
        <header className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px] font-black uppercase tracking-widest">Admin</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Control Center</h2>
            </div>
            <p className="text-zinc-500 text-xs font-medium tracking-wide">SYSTEM ADMINISTRATOR</p>
          </div>

          <div className="flex items-center gap-4">
            {/* 목록 토글 버튼 */}
            <div className="relative group/toggle">
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/toggle:opacity-100 -translate-y-2 group-hover/toggle:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110] border border-white/10 shadow-2xl">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 border-l border-t border-white/10"></div>
                {isSidebarOpen ? '목록 닫기' : '목록 열기'}
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all relative"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* 헤더 로그아웃 버튼 */}
            <div className="relative group/logout">
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/logout:opacity-100 -translate-y-2 group-hover/logout:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110] shadow-2xl shadow-red-600/30">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                Logout
              </div>
              <button
                onClick={() => { adminLogout(); navigate('/login'); }}
                className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all relative group shadow-inner"
              >
                <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="min-h-[600px]"
          >
            {activeTab === 'approvals' && (
              <AdminApprovalsTab
                isLoading={isLoading.approvals}
                users={pendingUsers}
                onRefresh={fetchPendingApprovals}
              />
            )}
            {activeTab === 'management' && (
              <AdminManagementTab
                isLoading={isLoading.orgs}
                orgs={allOrganizations}
                onSearch={fetchAllOrganizations}
                onRefresh={fetchAllOrganizations}
              />
            )}
            {activeTab === 'usage' && (
              <AdminUsageTab
                isLoading={isLoading.usage}
                stats={usageStats?.daily_stats || []}
                orgs={allOrganizations}
                onSearch={fetchUsageStats}
              />
            )}
            {activeTab === 'devices' && (
              <AdminDevicesTab
                isLoading={isLoading.devices}
                devices={devices}
                orgs={allOrganizations}
                onSearch={fetchDevices}
                onRefresh={fetchDevices}
              />
            )}
            {activeTab === 'tickets' && (
              <AdminInquiriesTab
                isLoading={isLoading.inquiries}
                inquiries={inquiries}
                onRefresh={fetchInquiries}
              />
            )}
            {activeTab === 'documents' && (
              <AdminDocumentsTab />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}