/*
File    : src/app/components/profile/user/UserAPIKeyTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - API 키 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
 */
import React from 'react';
import { Key, Plus, Trash2, Clock, Lock, AlertCircle } from 'lucide-react';
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
  if (user?.plan === 'none' || !user?.plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">API Key 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">도면 지능화 엔진 연동을 위한 인증 키입니다.</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">API Key 발급 제한</p>
            <p className="text-xs text-zinc-500 mt-1">요금제 구독이 완료된 후 API Key를 발급받으실 수 있습니다.</p>
          </div>
          <button
            onClick={() => setActiveTab('billing')}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            요금제 가입하기
          </button>
        </div>
      </div>
    );
  }

  const sortedKeys = [...apiKeys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">API Key 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">도면 지능화 엔진 연동을 위한 인증 키입니다.</p>
        </div>
        <button
          onClick={handleGenerateKey}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          새 키 발급
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {isLoadingKeys ? (
          <div className="py-12 text-center text-sm text-zinc-400">키 목록을 불러오는 중...</div>
        ) : sortedKeys.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Key className="w-6 h-6 text-zinc-300 mx-auto" />
            <p className="text-sm text-zinc-400">발급된 API 키가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sortedKeys.map((key, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={key.id}
                  className={`group flex items-center justify-between px-5 py-4 ${!isLatest ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Key className={`w-4 h-4 shrink-0 ${isLatest ? 'text-zinc-400' : 'text-zinc-300'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200">
                          {isLatest ? key.api_key : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isLatest && key.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {isLatest ? key.status : 'inactive'}
                        </span>
                        {!isLatest && <Lock className="w-3 h-3 text-zinc-300" />}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-zinc-400">
                        <Clock className="w-3 h-3" />
                        생성일: {format(new Date(key.created_at), 'yyyy-MM-dd')}
                        {!isLatest && <span className="ml-2 text-zinc-300">새 키 발급으로 비활성화</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="ml-4 p-1.5 rounded-md text-zinc-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="키 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs font-semibold text-zinc-700">보안 주의사항</p>
          </div>
          <ul className="text-xs text-zinc-500 space-y-1.5 list-disc pl-4">
            <li>API Key는 외부로 공유하지 마세요.</li>
            <li>키가 노출된 경우 즉시 삭제하고 새 키를 발급받으세요.</li>
          </ul>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-zinc-900">AutoCAD 플러그인 설치</p>
            <p className="text-xs text-zinc-400 mt-0.5">플러그인을 다운받고 API Key를 입력하세요.</p>
          </div>
          <button
            onClick={() => { }}
            className="shrink-0 px-3.5 py-2 bg-[#0071e3] hover:brightness-105 text-white text-xs font-medium rounded-lg transition-all"
          >
            다운로드
          </button>
        </div>
      </div>
    </div>
  );
};
