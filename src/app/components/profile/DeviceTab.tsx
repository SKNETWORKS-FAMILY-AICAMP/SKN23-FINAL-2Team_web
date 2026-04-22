/*
File    : src/app/components/profile/DeviceTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 기기 등록 및 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { Monitor, Puzzle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DeviceTabProps {
  isLoadingDevices: boolean;
  devices: any[];
}

export const DeviceTab: React.FC<DeviceTabProps> = ({
  isLoadingDevices,
  devices
}) => {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold">기기 관리</h2>
        <p className="text-sm text-zinc-500 mt-1">플러그인이 설치되고 활성화된 기기 목록입니다.</p>
      </div>

      <div className="grid gap-4">
        {isLoadingDevices ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">기기 목록을 불러오는 중입니다...</div>
        ) : devices.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-white/10 p-12 rounded-3xl text-center">
            <Monitor className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">등록된 기기가 없습니다.</p>
          </div>
        ) : (
          devices.map((device) => (
            <div 
              key={device.id} 
              className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="bg-zinc-800 p-3 rounded-xl">
                  <Monitor className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg">{device.hostname}</span>
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
              <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-zinc-500">
                Key: {device.api_key_snippet}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex items-start gap-4">
        <div className="bg-[#0071e3]/20 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-[#abc7ff]" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">새 기기 등록 방법</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            AutoCAD 실행 후 플러그인 설정 메뉴에서 본인의 API Key를 입력하면 자동으로 새로운 기기가 등록됩니다.<br />
            현재 사용 중인 플랜의 최대 동시 접속 기기 수를 확인해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
};
