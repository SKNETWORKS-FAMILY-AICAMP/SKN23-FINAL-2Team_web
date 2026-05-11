/*
File    : src/app/components/profile/user/UserDeviceTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 기기 등록 및 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
 */
import React from 'react';
import { Monitor, Clock, Power } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';

interface DeviceTabProps {
  user?: any;
  isLoadingDevices: boolean;
  devices: any[];
}

export const UserDeviceTab: React.FC<DeviceTabProps> = ({
  user,
  isLoadingDevices,
  devices
}) => {
  const maxDevices = user?.max_seats ?? 0;
  const currentCount = devices.length;
  const atLimit = maxDevices > 0 && currentCount >= maxDevices;

  const handleToggleStatus = async (deviceId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(currentStatus ? '기기 사용이 중지되었습니다.' : '기기가 활성화되었습니다.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('기기 상태를 변경할 수 없습니다.');
      }
    } catch {
      toast.error('서버와의 통신 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">기기 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">플러그인이 설치되고 활성화된 기기 목록입니다.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wide mb-0.5">등록 현황</p>
          <p className="text-lg font-semibold text-zinc-900">
            <span className={atLimit ? 'text-red-500' : 'text-zinc-900'}>{currentCount}</span>
            <span className="text-zinc-400 font-normal text-sm"> / {maxDevices}대</span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {isLoadingDevices ? (
          <div className="py-12 text-center text-sm text-zinc-400">기기 목록을 불러오는 중...</div>
        ) : devices.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Monitor className="w-6 h-6 text-zinc-300 mx-auto" />
            <p className="text-sm text-zinc-400">등록된 기기가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${device.is_active ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800">{device.hostname}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        device.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                      <span>{device.os_user}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(device.last_seen), 'yyyy-MM-dd HH:mm')}
                      </span>
                      {device.api_key_snippet && (
                        <span className="font-mono">···{device.api_key_snippet}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative group ml-4">
                  <button
                    onClick={() => handleToggleStatus(device.id, device.is_active)}
                    className={`p-2 rounded-lg transition-colors border ${
                      device.is_active
                        ? 'border-zinc-200 text-zinc-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50'
                        : 'border-zinc-200 text-zinc-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute -top-8 right-0 px-2.5 py-1 bg-zinc-800 text-[10px] text-white rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-10">
                    {device.is_active ? '기기 중지' : '기기 활성화'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 새 기기 등록 안내 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900">새 기기 등록 방법</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            마이페이지의 다운로드 메뉴에서 Windows용 AutoCAD 플러그인 번들을 받은 뒤, 플러그인 설정 메뉴에서 API Key를 입력하면 자동으로 등록됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
