/*
File    : src/app/components/profile/user/UserDeviceTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 기기 등록 및 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { Monitor, Puzzle, CheckCircle, Clock, Power } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

interface DeviceTabProps {
  isLoadingDevices: boolean;
  devices: any[];
}

export const UserDeviceTab: React.FC<DeviceTabProps> = ({
  isLoadingDevices,
  devices
}) => {
  const { user } = useAuth();
  const maxDevices = user?.max_seats ?? 0;
  const currentCount = devices.length;

  const handleToggleStatus = async (deviceId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success(currentStatus ? '해당 기기의 사용이 일시 중지되었습니다.' : '기기가 다시 활성화되었습니다.');
        // 상태 갱신을 위해 임시 새로고침
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('기기 상태를 변경할 수 없습니다.');
      }
    } catch (e) {
      toast.error('서버와의 통신 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold">기기 관리</h2>
          <p className="text-sm text-zinc-500 mt-1">플러그인이 설치되고 활성화된 기기 목록입니다.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">현재 등록 현황</div>
          <div className="text-xl font-black text-zinc-900">
            <span className={maxDevices > 0 && currentCount >= maxDevices ? "text-red-500" : "text-[#0071e3]"}>
            {currentCount}
            </span>
            <span className="text-zinc-600 font-normal text-sm"> / {maxDevices}대</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoadingDevices ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">기기 목록을 불러오는 중입니다...</div>
        ) : devices.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-300 p-12 rounded-3xl text-center">
            <Monitor className="w-8 h-8 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">등록된 기기가 없습니다.</p>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="bg-zinc-100 p-3 rounded-xl">
                  <Monitor className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-lg">{device.hostname}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      device.is_active ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><Puzzle className="w-3.5 h-3.5" /> {device.os_user}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 마지막 동기화: {format(new Date(device.last_seen), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-500">
                  Key Snippet: {device.api_key_snippet || '보안상 숨김'}
                </div>
                <div className="relative group flex items-center">
                  <button
                    onClick={() => handleToggleStatus(device.id, device.is_active)}
                    className={`p-2 rounded-xl transition-all border ${
                      device.is_active
                        ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                        : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  {/* Tailwind Custom Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-[10px] text-white font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-10 shadow-xl">
                    {device.is_active ? '클릭 시 기기 사용 중지' : '클릭 시 기기 활성화'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-50 p-2 rounded-lg mt-1">
            <CheckCircle className="w-5 h-5 text-[#0071e3]" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-sm">새 기기 등록 방법</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              AutoCAD 전용 플러그인을 다운로드하여 설치한 후, 플러그인 설정 메뉴에서 본인의 <br className="hidden md:block" />
              API Key를 입력하면 해당 기기가 자동으로 등록됩니다. (플랜 별 최대 접속 대수 유의)
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => { /* 실제 다운로드 로직: 예) window.open('/downloads/CadSllmAgent.zip') */ }}
          className="shrink-0 px-6 py-3 bg-[#0071e3] text-white text-xs font-bold rounded-xl hover:bg-[#0071e3]/90 transition-all shadow-lg flex items-center gap-2"
        >
          <Puzzle className="w-4 h-4" /> 
          AutoCAD 플러그인 다운로드
        </button>
      </div>
    </div>
  );
};
