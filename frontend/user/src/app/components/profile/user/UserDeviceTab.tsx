/*
File    : src/app/components/profile/user/UserDeviceTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 기기 등록 및 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
    - 2026-05-15 (김지우) : 새 기기 등록 안내 툴팁 추가 및 등록 기기 목록 테이블화
    - 2026-05-15 (김지우) : 기기 등록 안내 툴팁 위치 조정
    - 2026-05-15 (김지우) : 시방서 등록 탭과 동일한 디자인으로 통일
 */
import React from 'react';
import { AlertCircle, Loader2, Monitor, Power } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';

interface DeviceTabProps {
  user?: any;
  isLoadingDevices: boolean;
  devices: any[];
}

const formatDeviceDate = (date?: string) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'yyyy. M. d. HH:mm');
  } catch {
    return '-';
  }
};

const DeviceRegistrationTooltip = () => (
  <span className="group relative inline-flex">
    <button
      type="button"
      aria-label="새 기기 등록 방법"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500 outline-none transition-colors hover:bg-amber-50"
    >
      <AlertCircle className="h-4 w-4" />
    </button>
    <span className="pointer-events-none absolute left-full top-0 z-30 ml-3 w-80 max-w-[calc(100vw-220px)] rounded-xl border border-amber-200 bg-white p-4 text-left opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
      <span className="block text-xs font-bold text-amber-900">새 기기 등록 방법</span>
      <span className="mt-1 block text-xs leading-5 text-amber-700">
        마이페이지의 다운로드 메뉴에서 Windows용 AutoCAD 플러그인 번들을 받은 뒤, 플러그인 설정 메뉴에서 API Key를 입력하면 자동으로 등록됩니다.
      </span>
    </span>
  </span>
);

export const UserDeviceTab: React.FC<DeviceTabProps> = ({ user, isLoadingDevices, devices }) => {
  const maxDevices = user?.max_seats ?? 0;
  const currentCount = devices.length;
  const atLimit = maxDevices > 0 && currentCount >= maxDevices;

  const handleToggleStatus = async (deviceId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900">기기 등록 현황</h2>
            <DeviceRegistrationTooltip />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">플러그인이 설치되고 활성화된 기기 목록입니다.</p>
        </div>
        <span className="text-xs text-zinc-400 font-medium">
          <span className={atLimit ? 'text-red-500 font-bold' : ''}>{currentCount}</span>
          {maxDevices > 0 && `/${maxDevices}대`}
        </span>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {isLoadingDevices ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
            <Monitor className="h-10 w-10 text-zinc-200" />
            <p className="text-sm font-medium">등록된 기기가 없습니다.</p>
            <p className="text-xs">AutoCAD 플러그인에서 API Key를 입력하면 자동으로 등록됩니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-500">
                  <th className="px-4 py-3 text-left font-semibold">기기명</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-left font-semibold">OS 사용자</th>
                  <th className="px-4 py-3 text-left font-semibold">API Key</th>
                  <th className="px-4 py-3 text-left font-semibold">최근 접속</th>
                  <th className="px-4 py-3 text-center font-semibold w-16">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-800 max-w-[160px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${device.is_active ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                        <span className="truncate">{device.hostname || 'Unknown Device'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        device.is_active
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}>
                        {device.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-[120px] truncate">{device.os_user || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {device.api_key_snippet ? (
                        <span className="font-mono text-zinc-400">···{device.api_key_snippet}</span>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDeviceDate(device.last_seen)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(device.id, device.is_active)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                          device.is_active
                            ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
                            : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={device.is_active ? '기기 중지' : '기기 활성화'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
