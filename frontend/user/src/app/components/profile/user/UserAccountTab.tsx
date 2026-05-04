/*
File    : src/app/components/profile/user/UserAccountTab.tsx
Author  : 김민정 / 송주엽
Description : 마이페이지 - 계정 설정 탭 (Apple-style 리디자인)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Key,
  Lock,
  Monitor,
  Trash2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface AccountTabProps {
  user: any;
  setShowPasswordModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  paymentInfo?: any;
  devices?: any[];
  apiKeys?: any[];
  usageStats?: any;
  isLoadingUsage?: boolean;
}

export const UserAccountTab: React.FC<AccountTabProps> = ({
  user,
  setShowPasswordModal,
  setShowDeleteModal,
  paymentInfo,
  devices = [],
  apiKeys = [],
  usageStats,
  isLoadingUsage = false,
}) => {
  const navigate = useNavigate();

  const rawVerificationStatus = user?.verification_status || 'pending';
  const activeApiKeyCount = apiKeys.filter(
    (k: any) => k?.status !== 'revoked' && k?.status !== 'deleted'
  ).length;
  const activeDeviceCount = devices.filter((d: any) => d?.is_active).length;
  const maxSeats = user?.max_seats ?? 0;
  const isSubscribed = !paymentInfo?.noPlan && !!paymentInfo?.plan_name;
  const currentPlan = isSubscribed ? paymentInfo.plan_name : '미구독';
  const monthlyAnalyses = usageStats?.total_calls ?? 0;
  const usageLimit = usageStats?.limit ?? 0;
  const usagePercent =
    usageLimit > 0 ? Math.min(100, Math.round((monthlyAnalyses / usageLimit) * 100)) : 0;

  const verifyMap = {
    verified: { label: '인증 완료', Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
    rejected: { label: '반려됨', Icon: XCircle, cls: 'text-red-600 bg-red-50 ring-red-200' },
    reviewing: { label: '검토 중', Icon: Clock, cls: 'text-sky-600 bg-sky-50 ring-sky-200' },
    pending: { label: '승인 대기', Icon: AlertCircle, cls: 'text-amber-600 bg-amber-50 ring-amber-200' },
  };
  const vs = verifyMap[rawVerificationStatus as keyof typeof verifyMap] ?? verifyMap.pending;
  const VerifyIcon = vs.Icon;

  return (
    <div className="space-y-6">

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">계정 설정</h1>
          <p className="mt-1 text-sm text-zinc-500">조직 계정, 인증 상태 및 사용 현황을 관리합니다.</p>
        </div>
        </div>

      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: '현재 요금제', value: currentPlan, sub: isSubscribed ? '활성 구독' : '구독 없음', icon: CreditCard },
          { label: '등록 기기', value: `${activeDeviceCount} / ${maxSeats}`, sub: '대 활성', icon: Monitor },
          { label: '이번 달 분석', value: isLoadingUsage ? '—' : monthlyAnalyses.toLocaleString(), sub: `건 · ${usagePercent}% 사용`, icon: Activity },
          { label: 'API Key', value: String(activeApiKeyCount), sub: '개 활성', icon: Key },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-400">{label}</p>
              <Icon className="h-3.5 w-3.5 text-zinc-300" />
            </div>
            <div className="flex items-end gap-1">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">{value}</p>
              <p className="text-[11px] text-zinc-400 leading-none mb-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 본문 2열 */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

        {/* 왼쪽 */}
        <div className="space-y-4">

          {/* 계정 정보 */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <p className="text-sm font-semibold text-zinc-900">계정 정보</p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
              >
                <Lock className="h-3 w-3" />
                비밀번호 변경
              </button>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">로그인 이메일</span>
              <span className="font-mono text-xs text-zinc-600">{user?.email || 'N/A'}</span>
            </div>
          </div>

          {/* 조직 정보 */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <p className="text-sm font-semibold text-zinc-900">조직 정보</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${vs.cls}`}>
                <VerifyIcon className="h-2.5 w-2.5" />
                {vs.label}
              </span>
            </div>

            <div className="divide-y divide-zinc-50">
              {[
                { label: '기업명', value: user?.companyName || 'N/A', mono: false },
                { label: '조직 ID', value: user?.orgId || 'N/A', mono: true },
                { label: '현재 요금제', value: currentPlan, mono: false },
                { label: '최대 등록 기기', value: user?.max_seats != null ? `${user.max_seats}대` : 'N/A', mono: false },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-xs font-medium text-zinc-500">{label}</span>
                  <span
                    className={`max-w-[240px] truncate text-xs font-medium ${mono ? 'font-mono text-zinc-400' : 'text-zinc-700'}`}
                    title={String(value)}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 계정 삭제 */}
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-white px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">계정 삭제</p>
              <p className="mt-0.5 text-xs text-zinc-400">계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              탈퇴 신청
            </button>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="space-y-4">

          {/* 운영 현황 */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-sm font-semibold text-zinc-900">운영 현황</p>
            </div>

            <div className="divide-y divide-zinc-50 px-5">
              {[
                { label: '최근 로그인', value: '현재 세션', active: true },
                { label: '등록 기기', value: `${activeDeviceCount} / ${maxSeats}대`, active: activeDeviceCount > 0 },
                { label: 'API Key', value: `${activeApiKeyCount}개 활성`, active: activeApiKeyCount > 0 },
                { label: 'API 사용량', value: `${usagePercent}%`, active: usagePercent > 0 },
              ].map(({ label, value, active }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs font-medium text-zinc-400">{label}</span>
                  <span className={`text-xs font-medium ${active ? 'text-zinc-700' : 'text-zinc-300'}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 px-5 pb-5 pt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">월간 API 사용량</span>
                <span className="text-[11px] text-zinc-500">
                  {monthlyAnalyses.toLocaleString()} / {usageLimit ? usageLimit.toLocaleString() : '∞'}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                  style={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 바로가기 */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-sm font-semibold text-zinc-900">바로가기</p>
            </div>
            <div className="divide-y divide-zinc-50">
              {[
                { label: '요금제 관리', desc: isSubscribed ? `${currentPlan} 구독 중` : '지금 구독 시작', icon: CreditCard, tab: 'billing', highlight: !isSubscribed },
                { label: 'API Key 관리', desc: `${activeApiKeyCount}개 활성 키`, icon: Key, tab: 'api', highlight: false },
                { label: '기기 등록 현황', desc: `${activeDeviceCount} / ${maxSeats}대 연결됨`, icon: Monitor, tab: 'devices', highlight: false },
              ].map(({ label, desc, icon: Icon, tab, highlight }) => (
                <button
                  key={tab}
                  onClick={() => navigate(`/profile?tab=${tab}`)}
                  className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${highlight ? 'text-[#0071e3]' : 'text-zinc-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${highlight ? 'text-[#0071e3]' : 'text-zinc-700'}`}>{label}</p>
                    <p className="text-[11px] text-zinc-400">{desc}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
