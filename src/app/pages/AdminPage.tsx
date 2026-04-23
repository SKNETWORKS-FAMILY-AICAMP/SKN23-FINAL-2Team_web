import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserCog, Activity, Server, ChevronLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('approvals');
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // 비로그인 튕기기
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  // 관리자가 아닌 일반 계정이 URL 치고 접근 시 마이페이지로 튕기기
  if (user && user.role !== 'admin' && user.role !== 'superuser') {
    return <Navigate to="/profile" replace />;
  }

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
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left w-full ${
                      isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5' : 'text-zinc-500 hover:bg-zinc-900/80 hover:text-white border border-transparent'
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
                    <h2 className="text-2xl font-bold mb-2 text-white">가입 승인 대기열</h2>
                    <p className="text-zinc-500 text-sm mb-8">가입 요청을 보낸 기업 회원들을 검토하고 승인합니다.</p>
                    <div className="text-center py-20 text-zinc-600 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                      <Users className="w-8 h-8 mx-auto mb-4 text-zinc-700" />
                      대기 중인 회원이 없습니다.
                    </div>
                  </div>
                )}
                {activeTab === 'management' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">전체 회원 관리</h2>
                    <p className="text-zinc-500 text-sm mb-8">시스템에 가입된 모든 회원의 권한과 요금제 플랜을 통합 관리합니다.</p>
                    <div className="text-center py-20 text-zinc-600 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                      <UserCog className="w-8 h-8 mx-auto mb-4 text-zinc-700" />
                      사용자 데이터를 불러옵니다...
                    </div>
                  </div>
                )}
                {activeTab === 'usage' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">시스템 전체 사용량</h2>
                    <p className="text-zinc-500 text-sm mb-8">전체 유저의 도면 분석 API 호출 및 토큰 사용량 통합 모니터링입니다.</p>
                    <div className="text-center py-20 text-zinc-600 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                      <Activity className="w-8 h-8 mx-auto mb-4 text-zinc-700" />
                      통합 통계 데이터를 로딩 중입니다...
                    </div>
                  </div>
                )}
                {activeTab === 'devices' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">서버 & 기기 현황</h2>
                    <p className="text-zinc-500 text-sm mb-8">오토캐드 플러그인이 연결된 전체 활성 기기 및 백엔드 API 서버 상태입니다.</p>
                    <div className="text-center py-20 text-zinc-600 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                      <Server className="w-8 h-8 mx-auto mb-4 text-[#47e266]/50" />
                      [서버 상태 양호] All Systems Operational
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
