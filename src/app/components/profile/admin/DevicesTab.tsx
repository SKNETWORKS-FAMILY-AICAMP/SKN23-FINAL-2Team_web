/*
File    : src/app/components/profile/admin/DevicesTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 전체 서버 및 기기 상태 관리 페이지

Modification History:
    - 2026-04-24 (김민정) : 전체 서버 및 기기 상태 관리 페이지
    - 2026-04-26 (김민정) : 기기 차단 API 로직 점검
*/
import React, { useState } from 'react';
import { Monitor, Cpu, User, Wifi, Trash2, Search, Building2, Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
import { toast } from 'sonner';

interface Device {
  id: string;
  machine_id: string;
  hostname: string;
  os_user: string;
  display_name: string;
  is_active: boolean;
  company_name: string;
  last_seen: string;
}

interface Props {
  isLoading: boolean;
  devices: Device[];
  orgs: any[];
  onSearch: (orgId?: string) => void;
  onRefresh: () => void;
}

export const DevicesTab = ({ isLoading, devices, orgs, onSearch, onRefresh }: Props) => {
  const [searchOrgTerm, setSearchOrgTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredOrgs = orgs.filter(org =>
    org.company_name.toLowerCase().includes(searchOrgTerm.toLowerCase())
  );

  const handleSearch = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSearchOrgTerm(orgName === 'all' ? '' : orgName);
    onSearch(orgId);
    setIsSearchFocused(false);
  };

  const handleBlock = async (deviceId: string) => {
    try {
      const res = await adminApi.blockDevice(authStorage.getAccessToken()!, deviceId);
      if (res.ok) {
        toast.success('해당 기기가 차단되었습니다.');
        onRefresh();
      } else {
        toast.error('차단 처리 실패');
      }
    } catch (e) {
      toast.error('서버 연결 오류');
    }
  };

  return (
    <div className="space-y-8">
      {/* 고도화된 검색 바 */}
      <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[32px] flex flex-wrap gap-4 items-center shadow-2xl relative overflow-visible">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="조회할 기업명을 검색하세요..."
            value={searchOrgTerm}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onChange={(e) => setSearchOrgTerm(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
          />
          {isSearchFocused && (
            <div className="absolute top-full left-0 w-full mt-3 bg-[#0a0a0a] border border-white/10 rounded-[24px] overflow-hidden z-[60] shadow-2xl max-h-[250px] overflow-y-auto custom-scrollbar">
              {!searchOrgTerm ? (
                <div
                  onClick={() => handleSearch('all', 'all')}
                  className="px-6 py-5 text-[10px] font-black text-blue-500 hover:bg-white/5 cursor-pointer border-b border-white/5 uppercase tracking-widest bg-blue-500/5"
                >
                  모든 기기 조회 (전체 시스템)
                </div>
              ) : (
                <>
                  {filteredOrgs.map(org => (
                    <div
                      key={org.id}
                      onClick={() => handleSearch(org.id, org.company_name)}
                      className="px-6 py-4 text-xs font-bold text-white hover:bg-blue-600/20 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    >
                      {org.company_name}
                    </div>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <div className="px-6 py-10 text-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                      일치하는 기업이 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {searchOrgTerm && (
            <button
              onClick={() => handleSearch('all', 'all')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => onSearch(selectedOrgId)}
          className="bg-zinc-100 hover:bg-white text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          <Search className="w-4 h-4 mr-2 inline" /> Run Filter
        </button>
      </div>

      {/* 기기 카드 리스트 */}
      {isLoading && devices.length === 0 ? (
        <div className="text-center py-32 text-zinc-500 animate-pulse font-black uppercase tracking-[0.3em] italic opacity-50 flex flex-col items-center gap-6">
          <Wifi className="w-12 h-12 text-blue-500/50" />
          Syncing Active Nodes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {devices.map((device) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0b0b] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-all group relative overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-all duration-500 shadow-inner overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-600/5 blur-xl group-hover:bg-blue-600/20 transition-all"></div>
                    <Monitor className="w-7 h-7 text-zinc-500 group-hover:text-blue-500 relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl tracking-tighter mb-1 uppercase italic">{device.hostname}</h4>
                    <p className="text-[18px] text-blue-500 font-black uppercase tracking-[0.25em]">{device.company_name}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <User className="w-4 h-4" />
                      <span className="text-[12px] font-black uppercase tracking-widest italic">Identity</span>
                    </div>
                    <span className="text-xs text-zinc-200 font-bold">{device.os_user || 'SYS_UNKNOWN'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Terminal className="w-4 h-4" />
                      <span className="text-[12px] font-black uppercase tracking-widest italic">Node ID</span>
                    </div>
                    <span className="text-[13px] text-zinc-200 font-mono font-bold">{device.machine_id.substring(0, 60)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${device.is_active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-[11px] font-black text-zinc-400 tracking-[0.2em] uppercase">{device.is_active ? 'Online' : 'Offline'}</span>
                  </div>

                  <button
                    onClick={() => handleBlock(device.id)}
                    className="group/btn p-4 bg-red-500/5 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 shadow-lg active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {devices.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-32 bg-zinc-900/10 rounded-[48px] border border-dashed border-white/10 flex flex-col items-center">
              <Cpu className="w-20 h-20 mx-auto mb-8 text-zinc-800 opacity-30" />
              <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-sm italic">No Active Terminals Detected for this Query.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};