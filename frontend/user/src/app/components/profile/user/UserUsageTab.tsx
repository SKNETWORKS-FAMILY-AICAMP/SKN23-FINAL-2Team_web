/*
File    : src/app/components/profile/user/UserUsageTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 서비스 사용량 통계 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 달력 UI 디자인 개선
    - 2026-05-04 (송주엽) : Apple 스타일 리디자인
 */
import React from 'react';
import { Activity, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as ShadCalendar } from '@/app/components/ui/calendar';

interface UsageTabProps {
  isLoadingUsage: boolean;
  usageStats: any;
  usageDateRange: { start: string, end: string };
  handleCustomDateChange: (type: 'start' | 'end', value: string) => void;
  setQuickRange: (days: number | 'month') => void;
  selectedMetric: 'all' | 'calls' | 'tokens';
  setSelectedMetric: (metric: 'all' | 'calls' | 'tokens') => void;
}

export const UserUsageTab: React.FC<UsageTabProps> = ({
  isLoadingUsage,
  usageStats: originalUsageStats,
  usageDateRange,
  handleCustomDateChange,
  setQuickRange,
  selectedMetric,
  setSelectedMetric
}) => {
  const filteredDailyStats = originalUsageStats?.daily_stats?.filter((stat: any) => {
    if (!usageDateRange.start || !usageDateRange.end) return true;
    const statDate = new Date(stat.date).getTime();
    const startDate = new Date(usageDateRange.start).getTime();
    const endDate = new Date(usageDateRange.end).getTime() + 86400000 - 1;
    return statDate >= startDate && statDate <= endDate;
  }) || [];

  const usageStats = originalUsageStats ? {
    ...originalUsageStats,
    total_calls: filteredDailyStats.reduce((acc: number, curr: any) => acc + curr.calls, 0),
    total_tokens: filteredDailyStats.reduce((acc: number, curr: any) => acc + curr.tokens, 0),
    daily_stats: filteredDailyStats
  } : null;

  return (
    <div className="space-y-6">
      {/* 헤더 + 필터 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">사용량 통계</h1>
          <p className="mt-1 text-sm text-zinc-500">지능화 엔진 호출 및 토큰 소모량 현황입니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 빠른 날짜 선택 */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            {[
              { label: '7일', val: 7 },
              { label: '30일', val: 30 },
              { label: '이번 달', val: 'month' }
            ].map((r: any) => (
              <button
                key={r.label}
                onClick={() => setQuickRange(r.val)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-zinc-500 hover:text-zinc-800 hover:bg-white"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* 날짜 범위 선택 */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 transition-colors">
                  <CalendarIcon className="w-3 h-3 text-zinc-400" />
                  {usageDateRange.start.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 rounded-xl shadow-xl z-[100]" align="start">
                <div className="px-4 pt-3 pb-2 border-b border-zinc-100">
                  <p className="text-xs font-medium text-zinc-500">시작일 선택</p>
                </div>
                <ShadCalendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={new Date().getFullYear()}
                  selected={new Date(usageDateRange.start)}
                  onSelect={(date) => date && handleCustomDateChange('start', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                  className="bg-white text-zinc-900"
                  modifiersStyles={{
                    selected: { backgroundColor: '#0071e3', color: 'white' }
                  }}
                />
              </PopoverContent>
            </Popover>

            <span className="text-xs text-zinc-400">—</span>

            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 transition-colors">
                  <CalendarIcon className="w-3 h-3 text-zinc-400" />
                  {usageDateRange.end.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 rounded-xl shadow-xl z-[100]" align="end">
                <div className="px-4 pt-3 pb-2 border-b border-zinc-100">
                  <p className="text-xs font-medium text-zinc-500">종료일 선택</p>
                </div>
                <ShadCalendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={new Date().getFullYear()}
                  selected={new Date(usageDateRange.end)}
                  onSelect={(date) => date && handleCustomDateChange('end', format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => date < new Date(usageDateRange.start) || date > new Date()}
                  initialFocus
                  className="bg-white text-zinc-900"
                  modifiersStyles={{
                    selected: { backgroundColor: '#0071e3', color: 'white' }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {isLoadingUsage ? (
        <div className="h-80 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-zinc-300 animate-spin" />
        </div>
      ) : usageStats?.success ? (
        <div className="space-y-4">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '총 API 호출', value: usageStats.total_calls.toLocaleString(), unit: '건' },
              { label: '총 토큰 소모', value: usageStats.total_tokens.toLocaleString(), unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-white border border-zinc-200 rounded-xl p-5">
                <p className="text-xs font-medium text-zinc-400 mb-2">{label}</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  {value}
                  {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* 차트 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900">일간 사용량 추이</p>
              </div>
              <select
                value={selectedMetric}
                onChange={(e: any) => setSelectedMetric(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="all">모든 지표</option>
                <option value="calls">호출 횟수</option>
                <option value="tokens">토큰 소모</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageStats.daily_stats}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#d4d4d8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis
                    stroke="#d4d4d8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e4e4e7',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#52525b',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}
                  />
                  {(selectedMetric === 'all' || selectedMetric === 'calls') && (
                    <Area type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCalls)" />
                  )}
                  {(selectedMetric === 'all' || selectedMetric === 'tokens') && (
                    <Area type="monotone" dataKey="tokens" stroke="#0071e3" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTokens)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-zinc-200 rounded-xl">
          <p className="text-sm text-zinc-400">가용 통계 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
