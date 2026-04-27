/*
File    : src/app/components/profile/user/UserUsageTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 서비스 사용량 통계 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : 달력 UI 디자인 개선
 */
import React from 'react';
import { Activity, Calendar as CalendarIcon, RefreshCw, ChevronDown, Zap, BarChart3, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getDummyUsageStats } from '@/app/utils/dummyUsageData';
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
  // 1. DB 연동이 완료되면 아래 "getDummyUsageStats()" 부분을 지우고 
  // 바로 아래의 "originalUsageStats"를 사용하도록 주석을 변경해 주시면 됩니다!
  const baseUsageStats = getDummyUsageStats();
  // const baseUsageStats = originalUsageStats;

  // 2. 선택된 날짜 범위(usageDateRange)에 맞게 데이터를 필터링합니다.
  const filteredDailyStats = baseUsageStats?.daily_stats?.filter((stat: any) => {
    if (!usageDateRange.start || !usageDateRange.end) return true;
    const statDate = new Date(stat.date).getTime();
    const startDate = new Date(usageDateRange.start).getTime();
    // end 날짜의 경우 해당 일의 23:59:59까지 포함되도록 처리 (+1일 -1ms)
    const endDate = new Date(usageDateRange.end).getTime() + 86400000 - 1;
    return statDate >= startDate && statDate <= endDate;
  }) || [];

  // 3. 필터링된 배열을 바탕으로 토큰 및 호출 횟수를 다시 합산한 최종 객체 생성
  const usageStats = baseUsageStats ? {
    ...baseUsageStats,
    total_calls: filteredDailyStats.reduce((acc: number, curr: any) => acc + curr.calls, 0),
    total_tokens: filteredDailyStats.reduce((acc: number, curr: any) => acc + curr.tokens, 0),
    daily_stats: filteredDailyStats
  } : null;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold">사용량 통계</h2>
          <p className="text-sm text-zinc-500 mt-1">지능화 엔진 호출 및 토크 소모량 현황입니다.</p>
        </div>

        {/* Date Filter (Admin-Style Premium UI) */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-2 p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5 shadow-inner">
            {[
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: 'This Month', val: 'month' }
            ].map((r: any) => (
              <button
                key={r.label}
                onClick={() => setQuickRange(r.val)}
                className="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-900/50 border border-white/10 hover:border-blue-500/50 rounded-xl px-4 py-2.5 text-[10px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-3 min-w-[120px] shadow-lg outline-none hover:bg-white/5">
                  <CalendarIcon className="w-3 h-3 text-blue-500" />
                  {usageDateRange.start.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0c0c0c] border-white/10 rounded-[28px] shadow-2xl z-[100]" align="start">
                <div className="p-4 border-b border-white/5 text-center">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Start Date</span>
                </div>
                <ShadCalendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={new Date().getFullYear()}
                  selected={new Date(usageDateRange.start)}
                  onSelect={(date) => date && handleCustomDateChange('start', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                  className="bg-transparent text-white"
                  modifiersStyles={{
                    selected: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }
                  }}
                />
              </PopoverContent>
            </Popover>

            <span className="text-zinc-600 font-black italic text-xs">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-900/50 border border-white/10 hover:border-blue-500/50 rounded-xl px-4 py-2.5 text-[10px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-3 min-w-[120px] shadow-lg outline-none hover:bg-white/5">
                  <CalendarIcon className="w-3 h-3 text-blue-500" />
                  {usageDateRange.end.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0c0c0c] border-white/10 rounded-[28px] shadow-2xl z-[100]" align="end">
                <div className="p-4 border-b border-white/5 text-center">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select End Date</span>
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
                  className="bg-transparent text-white"
                  modifiersStyles={{
                    selected: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {isLoadingUsage ? (
        <div className="h-[400px] bg-zinc-900/30 rounded-3xl border border-white/5 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : usageStats?.success ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-white/10 p-5 rounded-2xl">
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total API Calls</div>
              <div className="text-2xl font-black text-white">{usageStats.total_calls.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 p-5 rounded-2xl">
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Tokens</div>
              <div className="text-2xl font-black text-[#abc7ff]">{usageStats.total_tokens.toLocaleString()}</div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0071e3]" /> 일간 사용량 추이
              </h3>
              <select
                value={selectedMetric}
                onChange={(e: any) => setSelectedMetric(e.target.value)}
                className="bg-zinc-800 border border-white/10 text-xs rounded-lg px-3 py-1.5 font-bold outline-none"
              >
                <option value="all">모든 지표 보기</option>
                <option value="calls">호출 횟수만</option>
                <option value="tokens">토큰 소모만</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageStats.daily_stats}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071e3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#555"
                    fontSize={10}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#555" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  {(selectedMetric === 'all' || selectedMetric === 'calls') && (
                    <Area type="monotone" dataKey="calls" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  )}
                  {(selectedMetric === 'all' || selectedMetric === 'tokens') && (
                    <Area type="monotone" dataKey="tokens" stroke="#0071e3" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-zinc-600 border border-dashed border-white/10 rounded-3xl">
          가용 통계 데이터가 없습니다.
        </div>
      )}
    </div>
  );
};
