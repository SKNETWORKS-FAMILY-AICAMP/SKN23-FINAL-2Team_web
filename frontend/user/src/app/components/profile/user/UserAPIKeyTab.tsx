/*
File    : src/app/components/profile/user/UserAPIKeyTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - API 키 관리 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
    - 2026-05-14 (김지우) : API Key 테이블형 관리 UI 및 새 키 발급 모달 적용
    - 2026-05-14 (김지우) : 키 발급 모달 한국어화 및 소유자/권한 선택 제거
    - 2026-05-14 (김지우) : 보안 주의사항을 API 키 관리 제목 옆 호버 툴팁으로 이동
    - 2026-05-14 (김지우) : API 키 관리 테이블에서 마지막 사용 컬럼 제거
    - 2026-05-14 (김지우) : API 키 관리 테이블 가로 스크롤 제거 및 컬럼 폭 최적화
    - 2026-05-14 (김지우) : API 키 생성/목록에서 프로젝트 및 권한 항목 제거
    - 2026-05-14 (김지우) : API 키 관리 테이블 생성자/관리 컬럼 폭 조정
    - 2026-05-14 (김지우) : 마스킹된 API 키 실제 키 복사 버튼 추가
    - 2026-05-15 (김지우) : API 키 관리 검색 영역의 필터 칩 및 결과 수 제거
    - 2026-05-15 (김지우) : 시방서 등록 탭과 동일한 디자인으로 통일
*/
import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Key,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type CreateKeyOptions = {
  name?: string;
};

interface APIKeyTabProps {
  user: any;
  apiKeys: any[];
  isLoadingKeys: boolean;
  handleGenerateKey: (options?: CreateKeyOptions) => Promise<string | null> | string | null | void;
  handleCopyKey: (keyId: string) => Promise<void> | void;
  handleDeleteKey: (keyId: string) => void;
  setActiveTab: (tab: any) => void;
}

const maskSecretKey = (value?: string) => {
  if (!value) return 'sk-****************';
  const visibleLength = value.length >= 64 ? 18 : Math.min(12, Math.max(6, value.length - 8));
  const visible = value.slice(0, visibleLength);
  const hiddenLength = Math.max((value.length || 64) - visible.length, 12);
  return `${visible}${'*'.repeat(hiddenLength)}`;
};

const shortId = (value?: string) => {
  if (!value) return '-';
  const clean = String(value);
  return clean.length > 13 ? `${clean.slice(0, 8)}...${clean.slice(-4)}` : clean;
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'yyyy. M. d.');
  } catch {
    return '-';
  }
};

const SecurityNoticeTooltip = () => (
  <span className="group relative inline-flex">
    <button
      type="button"
      aria-label="API 키 보안 주의사항"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500 outline-none transition-colors hover:bg-amber-50"
    >
      <AlertCircle className="h-4 w-4" />
    </button>
    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-72 -translate-x-1/2 rounded-xl border border-amber-200 bg-white p-4 text-left opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
      <span className="block text-xs font-bold text-amber-900">보안 주의사항</span>
      <span className="mt-1 block text-xs leading-5 text-amber-700">
        API 키는 외부로 공유하지 마세요. 키가 노출된 경우 즉시 삭제하고 새 키를 발급받으세요.
      </span>
    </span>
  </span>
);

export const UserAPIKeyTab: React.FC<APIKeyTabProps> = ({
  user,
  apiKeys,
  isLoadingKeys,
  handleGenerateKey,
  handleCopyKey,
  handleDeleteKey,
  setActiveTab,
}) => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sortedKeys = useMemo(
    () => [...apiKeys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [apiKeys],
  );

  const filteredKeys = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sortedKeys;
    return sortedKeys.filter((key, index) => {
      const name = key.name || key.label || `API 키 ${sortedKeys.length - index}`;
      return [name, key.status, key.id, key.api_key, user?.companyName, user?.email].some(
        (item) => String(item || '').toLowerCase().includes(keyword),
      );
    });
  }, [search, sortedKeys, user]);

  const resetCreateForm = () => {
    setKeyName('');
    setCreatedSecret(null);
    setIsCreating(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateSecretKey = async () => {
    setIsCreating(true);
    try {
      const result = await handleGenerateKey({ name: keyName.trim() });
      if (typeof result === 'string' && result) {
        setCreatedSecret(result);
      } else {
        closeCreateModal();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const copyCreatedSecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    toast.success('API 키가 클립보드에 복사되었습니다.');
  };

  if (user?.plan === 'none' || !user?.plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">API 키 관리</h2>
              <SecurityNoticeTooltip />
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">도면 지능화 엔진 연동을 위한 인증 키입니다.</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-3">
            <Lock className="h-10 w-10 text-zinc-200" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-zinc-600">API 키 발급 제한</p>
              <p className="text-xs text-zinc-500">요금제 구독이 완료된 후 API 키를 발급받으실 수 있습니다.</p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="mt-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              요금제 가입하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900">API 키 관리</h2>
            <SecurityNoticeTooltip />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">도면 지능화 엔진 연동을 위한 비밀 키를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-zinc-400 font-medium">{sortedKeys.length}개</span>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            새 키 생성
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* 검색 */}
        <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
          <label className="flex items-center gap-2 text-zinc-400">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 상태, ID로 검색..."
              className="text-xs bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 flex-1"
            />
          </label>
        </div>

        {isLoadingKeys ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
            <Key className="h-10 w-10 text-zinc-200" />
            <p className="text-sm font-medium">발급된 API 키가 없습니다.</p>
            <p className="text-xs">새 키 생성 버튼을 눌러 API 키를 발급받으세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-500">
                  <th className="px-4 py-3 text-left font-semibold">이름</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-left font-semibold">추적 ID</th>
                  <th className="px-4 py-3 text-left font-semibold">비밀 키</th>
                  <th className="px-4 py-3 text-left font-semibold">생성일</th>
                  <th className="px-4 py-3 text-left font-semibold">생성자</th>
                  <th className="px-4 py-3 text-center font-semibold w-16">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredKeys.map((key, index) => {
                  const active = key.status === 'active';
                  const name = key.name || key.label || (index === 0 ? '기본 API 키' : `API 키 ${sortedKeys.length - index}`);
                  return (
                    <tr key={key.id || key.api_key || index} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-800 max-w-[140px] truncate">{name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {active ? '활성' : key.status || '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-mono max-w-[100px] truncate">
                        {key.tracking_id || shortId(key.id)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-mono max-w-[160px] truncate block">
                            {maskSecretKey(key.api_key)}
                          </code>
                          <button
                            type="button"
                            onClick={() => key.id && handleCopyKey(key.id)}
                            disabled={!key.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                            title="실제 키 복사"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(key.created_at || key.starts_at)}</td>
                      <td className="px-4 py-3 text-zinc-600 max-w-[120px] truncate">
                        {user?.companyName || user?.email || '사용자'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(key.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="키 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            {/* 모달 헤더 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {createdSecret ? (
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Key className="h-4 w-4 text-zinc-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {createdSecret ? 'API 키 생성 완료' : '새 API 키 생성'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {createdSecret ? '지금 한 번만 전체가 표시됩니다.' : '이름을 지정하고 키를 발급합니다.'}
                  </p>
                </div>
              </div>
              <button onClick={closeCreateModal} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!createdSecret ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">
                    이름 <span className="font-normal text-zinc-400">선택 사항</span>
                  </label>
                  <input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="테스트 키"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeCreateModal}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateSecretKey}
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    키 생성
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] text-red-500 font-semibold">
                  복사 후에는 앞부분만 마스킹됩니다. 안전한 곳에 저장해 주세요.
                </p>
                <div className="px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <code className="font-mono text-xs text-zinc-800 break-all select-all">{createdSecret}</code>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={copyCreatedSecret}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    키 복사
                  </button>
                  <button
                    onClick={closeCreateModal}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors"
                  >
                    완료
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
