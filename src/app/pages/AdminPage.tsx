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
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
import { useAuth } from '@/app/context/AuthContext';
import { ApprovalsTab } from '@/app/components/profile/admin/ApprovalsTab';
import { ManagementTab } from '@/app/components/profile/admin/ManagementTab';
import { UsageTab } from '@/app/components/profile/admin/UsageTab';
import { DevicesTab } from '@/app/components/profile/admin/DevicesTab';
import { InquiriesTab } from '@/app/components/profile/admin/InquiriesTab';
import { DocumentsTab } from '@/app/components/profile/admin/DocumentsTab';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
      const res = await adminApi.getPendingApprovals(authStorage.getAccessToken()!);
      const data = await res.json();
      setPendingUsers(data);
    } catch (e) { toast.error('승인 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, approvals: false })); }
  };

  const fetchAllOrganizations = async (name?: string, plan?: string) => {
    setIsLoading(prev => ({ ...prev, orgs: true }));
    try {
      const res = await adminApi.getOrganizations(authStorage.getAccessToken()!, name, plan);
      const data = await res.json();
      setAllOrganizations(data);
    } catch (e) { toast.error('기업 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, orgs: false })); }
  };

  const fetchUsageStats = async (start: string, end: string, orgId?: string) => {
    setIsLoading(prev => ({ ...prev, usage: true }));
    try {
      const res = await adminApi.getUsageStats(authStorage.getAccessToken()!, start, end, orgId);
      const data = await res.json();
      setUsageStats(data);
    } catch (e) { toast.error('통계 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, usage: false })); }
  };

  const fetchDevices = async (orgId?: string) => {
    setIsLoading(prev => ({ ...prev, devices: true }));
    try {
      const res = await adminApi.getDevices(authStorage.getAccessToken()!, orgId);
      const data = await res.json();
      setDevices(data);
    } catch (e) { toast.error('기기 목록 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, devices: false })); }
  };

  const fetchInquiries = async (status?: string) => {
    setIsLoading(prev => ({ ...prev, inquiries: true }));
    try {
      const res = await adminApi.getInquiries(authStorage.getAccessToken()!, status);
      const data = await res.json();
      setInquiries(data);
    } catch (e) { toast.error('Q&A 로드 실패'); }
    finally { setIsLoading(prev => ({ ...prev, inquiries: false })); }
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getDashboardStats(authStorage.getAccessToken()!);
      const data = await res.json();
      setDashboardStats(data);
    } catch (e) { }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'superuser')) {
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
  }, [activeTab, isAuthenticated, user]);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user && user.role !== 'admin' && user.role !== 'superuser') return <Navigate to="/profile" replace />;

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

        <div className="p-6 mt-auto border-t border-white/5">
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-4 px-4 py-4 text-zinc-500 hover:text-white transition-all group">
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm">로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 text-zinc-100">
        <header className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px] font-black uppercase tracking-widest">Live System</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Control Center</h2>
            </div>
            <p className="text-zinc-500 text-xs font-medium tracking-wide">EMAIL: {user?.email}</p>
          </div>

          <div className="flex items-center gap-4">
            {dashboardStats && (
              <div className="hidden xl:flex gap-8 px-8 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl mr-8">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Calls</p>
                  <p className="text-xl font-black text-white">{dashboardStats.total_calls.toLocaleString()}</p>
                </div>
                <div className="w-[1px] h-10 bg-white/5"></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Orgs</p>
                  <p className="text-xl font-black text-white">{dashboardStats.total_orgs}</p>
                </div>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
              <ApprovalsTab
                isLoading={isLoading.approvals}
                users={pendingUsers}
                onRefresh={fetchPendingApprovals}
              />
            )}
            {activeTab === 'management' && (
              <ManagementTab
                isLoading={isLoading.orgs}
                orgs={allOrganizations}
                onSearch={fetchAllOrganizations}
                onRefresh={fetchAllOrganizations}
              />
            )}
            {activeTab === 'usage' && (
              <UsageTab
                isLoading={isLoading.usage}
                stats={usageStats?.daily_stats || []}
                orgs={allOrganizations}
                onSearch={fetchUsageStats}
              />
            )}
            {activeTab === 'devices' && (
              <DevicesTab
                isLoading={isLoading.devices}
                devices={devices}
                orgs={allOrganizations}
                onSearch={fetchDevices}
                onRefresh={fetchDevices}
              />
            )}
            {activeTab === 'tickets' && (
              <InquiriesTab
                isLoading={isLoading.inquiries}
                inquiries={inquiries}
                onRefresh={fetchInquiries}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}