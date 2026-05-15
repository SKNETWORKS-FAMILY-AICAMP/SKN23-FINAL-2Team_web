/*
File    : src/app/components/profile/user/UserAccountTab.tsx
Author  : 김민정 / 송주엽
Description : 마이페이지 - 계정 설정 탭 (Apple-style 리디자인)

Modification History:
    - 2026-05-13 (김민정) : 바로가기 버튼 활성화
    - 2026-05-14 (김지우) : 신규 마이페이지 대시보드 디자인에 맞춰 카드 레이아웃 개선
    - 2026-05-15 (김지우) : 카드 컨테이너 라운드 제거 및 바로가기 섹션 삭제
    - 2026-05-15 (김지우) : 계정 삭제 영역 색상을 다른 계정 카드와 동일한 중립 톤으로 변경
    - 2026-05-15 (김지우) : 보안 탭 신설에 따라 계정 정보 카드의 비밀번호 변경 버튼 제거
    - 2026-05-15 (김지우) : 계정 삭제 영역을 보안 탭으로 이동
    - 2026-05-15 (김지우) : 이번 달 분석 요약 카드 삭제 및 요약 카드를 오른쪽 상단 1열 3행 배치
    - 2026-05-15 (김지우) : 조직 정보에서 조직 ID 항목 제거
    - 2026-05-15 (김지우) : 계정 정보 화면 제목 크기 확대 및 장식 아이콘 제거
    - 2026-05-15 (김지우) : 계정 정보와 조직 정보 섹션 통합 및 운영 현황 제거
    - 2026-05-15 (김지우) : 요약 카드를 상단 영역으로 복원하고 항목별 글자 크기 조정
    - 2026-05-15 (김지우) : 계정 정보 탭 카드 밀도 축소 및 핵심 수치 강조 스타일 적용
    - 2026-05-15 (김지우) : 계정 정보에 담당자명 항목 추가
 */
import React from 'react';

interface AccountTabProps {
  user: any;
  paymentInfo?: any;
  devices?: any[];
  apiKeys?: any[];
  usageStats?: any;
  isLoadingUsage?: boolean;
  setActiveTab: (tab: any) => void;
}

export const UserAccountTab: React.FC<AccountTabProps> = ({
  user,
  paymentInfo,
  devices = [],
  apiKeys = [],
  setActiveTab,
}) => {
  const rawVerificationStatus = user?.verification_status || 'pending';
  const activeApiKeyCount = apiKeys.filter(
    (k: any) => k?.status !== 'revoked' && k?.status !== 'deleted'
  ).length;
  const activeDeviceCount = devices.filter((d: any) => d?.is_active).length;
  const maxSeats = user?.max_seats ?? 0;
  const contactName = user?.contactName || user?.contact_name || '미등록';
  const isSubscribed = !paymentInfo?.noPlan && !!paymentInfo?.plan_name;
  const currentPlan = isSubscribed ? paymentInfo.plan_name.toUpperCase() : '미구독';

  const verifyMap = {
    verified: { label: '인증 완료', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
    rejected: { label: '반려됨', cls: 'text-red-600 bg-red-50 ring-red-200' },
    reviewing: { label: '검토 중', cls: 'text-sky-600 bg-sky-50 ring-sky-200' },
    pending: { label: '승인 대기', cls: 'text-amber-600 bg-amber-50 ring-amber-200' },
  };
  const vs = verifyMap[rawVerificationStatus as keyof typeof verifyMap] ?? verifyMap.pending;
  const summaryCards = [
    {
      label: '현재 요금제',
      value: currentPlan,
      sub: isSubscribed ? '활성 구독' : '구독 없음',
      action: '요금제 보기',
      tab: 'billing',
      accentClass: 'text-[#6d4aff]',
    },
    {
      label: '등록 기기',
      value: `${activeDeviceCount} / ${maxSeats}`,
      sub: '대 활성',
      action: '기기 목록 보기',
      tab: 'devices',
      accentClass: 'text-[#2563eb]',
    },
    {
      label: 'API Key',
      value: String(activeApiKeyCount),
      sub: '개 활성',
      action: 'API Key 관리',
      tab: 'api',
      accentClass: 'text-zinc-950',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 요약 카드 3개 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map(({ label, value, sub, action, tab, accentClass }) => (
          <div
            key={label}
            className="border border-zinc-200/80 bg-white px-6 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-sm font-black text-zinc-800">{label}</h2>
            <div className="mt-5 flex items-end gap-2">
              <p className={`text-3xl font-black tracking-tight ${accentClass}`}>{value}</p>
              <p className="mb-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">{sub}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(tab)}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#4f7cff] transition-colors hover:text-[#6d4aff]"
            >
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* 계정 정보 */}
      <div className="overflow-hidden border border-zinc-200/80 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-7 py-6">
          <h2 className="text-base font-black text-zinc-900">
            계정 정보
          </h2>
          <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${vs.cls}`}>
            {vs.label}
          </span>
        </div>
        <div className="divide-y divide-zinc-100 px-6">
          {[
            { label: '로그인 이메일', value: user?.email || 'N/A', mono: true, highlight: false },
            { label: '기업명', value: user?.companyName || 'N/A', mono: false, highlight: false },
            { label: '담당자명', value: contactName, mono: false, highlight: false },
            { label: '현재 요금제', value: currentPlan, mono: false, highlight: true },
            { label: '최대 등록 기기', value: user?.max_seats != null ? `${user.max_seats}대` : 'N/A', mono: false, highlight: true },
          ].map(({ label, value, mono, highlight }) => (
            <div key={label} className="flex items-center justify-between py-4">
              <span className="text-sm font-semibold text-zinc-500">{label}</span>
              <span
                className={`max-w-[360px] truncate text-sm font-bold ${
                  highlight
                    ? 'rounded-full bg-zinc-950 px-3 py-1 text-white'
                    : mono
                      ? 'font-mono text-zinc-500'
                      : 'text-zinc-900'
                }`}
                title={String(value)}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
