/*
File    : src/app/components/profile/admin/AdminDevicesTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 전체 기기 상태 관리 페이지 (라이트 테마)
Modification History:
    - 2026-04-26 (김민정) : 기기 차단 API 로직 점검
    - 2026-04-27 : 라이트 테마 전환, getAdminToken으로 인증 수정
*/
import React, { useState } from 'react';
import { Monitor, Cpu, Search, Trash2, X, Wifi, Building2, Clock } from 'lucide-react';
import { adminApi } from '@/app/api/admin';
import { getAdminToken } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Device {
  id: string;
  machine_id: string;
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

export const AdminDevicesTab = ({ isLoading, devices, orgs, onSearch, onRefresh }: Props) => {
  const [searchOrgTerm, setSearchOrgTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Device | null>(null);

  const filteredOrgs = orgs.filter(org =>
    org.company_name.toLowerCase().includes(searchOrgTerm.toLowerCase())
  );

  const handleSearch = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSearchOrgTerm(orgName === 'all' ? '' : orgName);
    onSearch(orgId);
    setIsSearchFocused(false);
  };

  const handleBlock = async (device: Device) => {
    try {
      const res = await adminApi.blockDevice(getAdminToken()!, device.id);
      if (res.ok) {
        toast.success(`${device.display_name || device.machine_id.slice(0, 8)} 기기가 차단되었습니다.`);
        setConfirmDelete(null);
        onRefresh();
      } else {
        toast.error('차단 처리 실패');
      }
    } catch {
      toast.error('서버 연결 오류');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">기기 관리</h2>
        <p className="text-sm text-slate-500 mt-0.5">등록된 CAD 플러그인 기기를 조회하고 관리합니다.</p>
      </div>

      {/* 필터 바 */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[240px] relative">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> 기업 필터
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="기업명으로 필터링..."
              value={searchOrgTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => setSearchOrgTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 px-9 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-[#1e40af] outline-none transition-all"
            />
            {searchOrgTerm && (
              <button onClick={() => handleSearch('all', 'all')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isSearchFocused && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden z-50 shadow-lg max-h-[200px] overflow-y-auto">
                <div
                  onClick={() => handleSearch('all', 'all')}
                  className="px-4 py-3 text-xs font-bold text-[#1e40af] hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                >전체 기기 조회</div>
                {filteredOrgs.map(org => (
                  <div
                    key={org.id}
                    onClick={() => handleSearch(org.id, org.company_name)}
                    className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >{org.company_name}</div>
                ))}
                {filteredOrgs.length === 0 && searchOrgTerm && (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">검색 결과 없음</div>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onSearch(selectedOrgId)}
          className="bg-slate-900 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" /> 조회
        </button>
      </div>

      {/* 기기 목록 */}
      {isLoading && devices.length === 0 ? (
        <div className="text-center py-20 text-slate-400 animate-pulse flex flex-col items-center gap-3">
          <Wifi className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-semibold">기기 목록 로드 중...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center">
          <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">등록된 기기가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            <div className="col-span-1">상태</div>
            <div className="col-span-3">기기 이름</div>
            <div className="col-span-3">소속 기업</div>
            <div className="col-span-4">Machine ID</div>
            <div className="col-span-1 text-right">차단</div>
          </div>

          {/* 테이블 행 */}
          <div className="divide-y divide-slate-100">
            {devices.map((device) => (
              <div key={device.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${device.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${device.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {device.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-4 h-4 text-[#1e40af]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{device.display_name || '미설정'}</p>
                      {device.last_seen && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(device.last_seen), 'MM.dd HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className="text-sm text-slate-600 font-medium">{device.company_name}</span>
                </div>
                <div className="col-span-4">
                  <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {device.machine_id.slice(0, 32)}...
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setConfirmDelete(device)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 합계 표시 */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">총 <strong className="text-slate-700">{devices.length}</strong>개 기기</span>
            <span className="text-xs text-slate-500">활성 <strong className="text-emerald-600">{devices.filter(d => d.is_active).length}</strong>개</span>
          </div>
        </div>
      )}

      {/* 차단 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-5 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">기기 차단</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              <strong className="text-slate-800">{confirmDelete.display_name || confirmDelete.machine_id.slice(0, 12)}</strong> 기기를<br />
              차단하시겠습니까? 이 기기는 더 이상 서비스를 사용할 수 없게 됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all">취소</button>
              <button onClick={() => handleBlock(confirmDelete)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">차단하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};