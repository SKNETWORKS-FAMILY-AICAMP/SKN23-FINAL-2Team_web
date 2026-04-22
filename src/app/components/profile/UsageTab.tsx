/*
File    : src/app/components/profile/UsageTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 서비스 사용량 통계 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { Activity, Calendar as CalendarIcon, RefreshCw, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface UsageTabProps {
  isLoadingUsage: boolean;
  usageStats: any;
  usageDateRange: { start: string, end: string };
  handleCustomDateChange: (type: 'start' | 'end', value: string) => void;
  setQuickRange: (days: number | 'month') => void;
  selectedMetric: 'all' | 'calls' | 'tokens';
  setSelectedMetric: (metric: 'all' | 'calls' | 'tokens') => void;
}

export const UsageTab: React.FC<UsageTabProps> = ({
  isLoadingUsage,
  usageStats,
  usageDateRange,
  handleCustomDateChange,
  setQuickRange,
  selectedMetric,
  setSelectedMetric
}) => {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold">사용량 통계</h2>
          <p className="text-sm text-zinc-500 mt-1">지능화 엔진 호출 및 토크 소모량 현황입니다.</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-900 border border-white/10 p-1 rounded-xl">
            {[
              { label: '7일', val: 7 },
              { label: '30일', val: 30 },
              { label: '이번 달', val: 'month' }
            ].map((r: any) => (
              <button
                key={r.label}
                onClick={() => setQuickRange(r.val)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl">
            <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="date"
              value={usageDateRange.start}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none"
            />
            <span className="text-zinc-600 text-xs text-bold">~</span>
            <input
              type="date"
              value={usageDateRange.end}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none"
            />
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
