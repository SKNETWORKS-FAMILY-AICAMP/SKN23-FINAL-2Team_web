/*
File    : src/app/components/profile/user/UserAPIKeyTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - API 키 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React, { useState } from 'react';
import { Key, Plus, Trash2, Zap, Clock, AlertTriangle, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface APIKeyTabProps {
  user: any;
  apiKeys: any[];
  isLoadingKeys: boolean;
  handleGenerateKey: () => void;
  handleDeleteKey: (keyId: string) => void;
  setActiveTab: (tab: any) => void;
}

export const UserAPIKeyTab: React.FC<APIKeyTabProps> = ({
  user,
  apiKeys,
  isLoadingKeys,
  handleGenerateKey,
  handleDeleteKey,
  setActiveTab
}) => {
  // 요금제가 없는 경우 잠금 화면 표시
  if (user?.plan === 'none' || !user?.plan) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl text-center space-y-6">
          <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">API Key 발급 제한</h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              요금제 구독이 완료된 후 API Key를 발급받으실 수 있습니다.<br />
              지금 바로 비즈니스 플랜에 가입하여 AI CAD 도구를 이용해 보세요.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('billing')}
              className="px-8 py-3 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
            >
              요금제 가입하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold">API Key 관리</h2>
          <p className="text-sm text-zinc-500 mt-1">도면 지능화 엔진 연동을 위한 인증 키입니다.</p>
        </div>
        <button
          onClick={handleGenerateKey}
          className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> 새 키 발급하기
        </button>
      </div>

      <div className="grid gap-4">
        {isLoadingKeys ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">키 목록을 불러오는 중입니다...</div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-white/10 p-12 rounded-3xl text-center">
            <Key className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">발급된 API 키가 없습니다.</p>
          </div>
        ) : (
          [...apiKeys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((key, index) => {
            const isLatest = index === 0;
            return (
            <div
              key={key.id}
              className={`group bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all ${!isLatest ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className="bg-zinc-800 p-3 rounded-xl group-hover:bg-white/10 transition-colors">
                  <Key className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      {isLatest ? key.api_key : '********************************'}
                    </code>
                    {!isLatest && (
                      <div className="p-1" title="사용 불가"><Lock className="w-4 h-4 text-zinc-600" /></div>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isLatest && key.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                      {isLatest ? key.status : 'inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 생성일: {format(new Date(key.created_at), 'yyyy-MM-dd')}</span>
                    {!isLatest && <span className="text-red-400/80 text-[10px] ml-2">새 키 발급으로 인해 사용이 더 이상 불가능합니다.</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="p-3 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="키 삭제"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )})
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-6 rounded-2xl space-y-3">
          <h4 className="font-bold text-[#abc7ff] flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> API Key 보안 주의사항
          </h4>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
            <li>API Key는 본인만 알고 있어야 하며, 외부로 공유하지 마세요.</li>
            <li>키가 노출된 것으로 의심될 경우 즉시 삭제하고 새 키를 발급받으세요.</li>
          </ul>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex items-center justify-between gap-4 group hover:bg-zinc-900 transition-colors">
          <div>
            <h4 className="font-bold text-white text-sm">AutoCAD 플러그인 설치</h4>
            <p className="text-xs text-zinc-400 mt-1">도면 분석을 위해 플러그인을 다운받고 키를 입력하세요.</p>
          </div>
          <button 
            onClick={() => { /* window.open('/downloads/CadSllmAgent.zip') */ }}
            className="shrink-0 px-4 py-2 bg-[#0071e3] text-white text-xs font-bold rounded-lg hover:bg-[#0071e3]/80 transition-components shadow-md flex items-center gap-2"
          >
            플러그인 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};
