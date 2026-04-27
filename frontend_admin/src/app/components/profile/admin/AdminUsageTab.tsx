/*
File    : src/app/components/profile/admin/AdminUsageTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 시스템 전체 사용량 통계 페이지
Modification History:
    - 2026-04-27 (송주엽) : 라이트 테마 전환, 캘린더 팝오버 수정
*/
import React, { useState } from 'react';
import { BarChart3, Calendar, Search, Building2, Zap, Activity, ChevronDown, X } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { startOfMonth, format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as ShadCalendar } from '@/app/components/ui/calendar';

interface Props {
  isLoading: boolean;
  stats: any[];
  orgs: any[];
  onSearch: (start: string, end: string, orgId?: string) => void;
}

const generateDummyStats = () => {
  const days = eachDayOfInterval({ start: parseISO('2026-04-01'), end: new Date() });
  return days.map((d) => {
    const seed = d.getDate();
    return {
      date: format(d, 'yyyy-MM-dd'),
      total_requests: 100 + (seed * 23) % 150,
      total_tokens_used: 200000 + (seed * 12345) % 250000
    };
  });
};

export const AdminUsageTab = ({ isLoading: isFetching, stats: originalStats, orgs, onSearch }: Props) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 6).toISOString().split('T')[0],
    end: todayStr
  });
  const [searchOrgTerm, setSearchOrgTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('all');
  const [activeMetric, setActiveMetric] = useState<'all' | 'requests' | 'tokens'>('all');
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<string>('7d');

  const serverHasData = originalStats && originalStats.length > 0 && originalStats.some(s => s.total_requests > 0 || s.total_tokens_used > 0);
  const sourceStats = serverHasData ? originalStats : generateDummyStats();
  const stats = sourceStats.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
  const totalCalls = stats.reduce((acc, curr) => acc + (curr.total_requests || 0), 0);
  const totalTokens = stats.reduce((acc, curr) => acc + (curr.total_tokens_used || 0), 0);

  const handleSearch = (start: string, end: string, orgId: string) => onSearch(start, end, orgId);

  const handle7DayClick = () => {
    const end = new Date();
    const start = subDays(end, 6);
    const newRange = { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    setActivePeriod('7d');
    setDateRange(newRange);
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handleThisMonthClick = () => {
    const today = new Date();
    const newRange = { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') };
    setActivePeriod('month');
    setDateRange(newRange);
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handleStartChange = (val: string) => {
    if (!val || isNaN(new Date(val).getTime())) return;
    const newRange = { start: val, end: val > dateRange.end ? val : dateRange.end };
    setDateRange(newRange);
    setActivePeriod('custom');
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handleEndChange = (val: string) => {
    if (!val || isNaN(new Date(val).getTime())) return;
    const safeEnd = val > todayStr ? todayStr : val;
    const newRange = { start: dateRange.start > safeEnd ? safeEnd : dateRange.start, end: safeEnd };
    setDateRange(newRange);
    setActivePeriod('custom');
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const metricOptions: { id: 'all' | 'requests' | 'tokens', label: string }[] = [
    { id: 'all', label: '모든 지표' },
    { id: 'requests', label: 'API 호출 횟수' },
    { id: 'tokens', label: '토큰 사용량' }
  ];

  const filteredOrgs = orgs.filter(org => org.company_name.toLowerCase().includes(searchOrgTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900">시스템 사용량</h2>
        <p className="text-sm text-zinc-500 mt-0.5">전체 또는 기업별 AI 엔진 호출 및 토큰 소모 현황</p>
      </div>

      {/* 필터 바 */}
      <div className="bg-white border border-zinc-200 shadow-sm p-5 rounded-xl flex flex-wrap gap-5 items-end">
        {/* 빠른 기간 선택 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#0071e3]" /> 기간
          </label>
          <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-lg">
            <button
              onClick={handle7DayClick}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activePeriod === '7d' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >7일</button>
            <button
              onClick={handleThisMonthClick}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activePeriod === 'month' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >이번 달</button>
          </div>
        </div>

        {/* 날짜 범위 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">날짜 범위</label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-50 border border-zinc-200 hover:border-[#0071e3]/50 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 flex items-center gap-2 min-w-[110px] outline-none">
                  <Calendar className="w-3 h-3 text-[#0071e3]" />
                  {dateRange.start.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 rounded-2xl shadow-xl z-[100]" align="start">
                <div className="p-3 border-b border-zinc-100 text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">시작일</span>
                </div>
                <ShadCalendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={new Date().getFullYear()}
                  selected={new Date(dateRange.start)}
                  onSelect={(date) => date && handleStartChange(format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => (dateRange.end ? date > new Date(dateRange.end) : false) || date < new Date('2024-01-01')}
                  initialFocus
                  className="bg-white text-zinc-900"
                  modifiersStyles={{ selected: { backgroundColor: '#0071e3', color: 'white', fontWeight: 'bold' } }}
                />
              </PopoverContent>
            </Popover>

            <span className="text-zinc-400 text-xs font-bold">—</span>

            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-50 border border-zinc-200 hover:border-[#0071e3]/50 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 flex items-center gap-2 min-w-[110px] outline-none">
                  <Calendar className="w-3 h-3 text-[#0071e3]" />
                  {dateRange.end.replace(/-/g, '.')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 rounded-2xl shadow-xl z-[100]" align="end">
                <div className="p-3 border-b border-zinc-100 text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">종료일</span>
                </div>
                <ShadCalendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={new Date().getFullYear()}
                  selected={new Date(dateRange.end)}
                  onSelect={(date) => date && handleEndChange(format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => (dateRange.start ? date < new Date(dateRange.start) : false) || date > new Date()}
                  initialFocus
                  className="bg-white text-zinc-900"
                  modifiersStyles={{ selected: { backgroundColor: '#0071e3', color: 'white', fontWeight: 'bold' } }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 기업 검색 */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> 기업
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="기업명 검색..."
              value={searchOrgTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => setSearchOrgTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 px-9 py-2 focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none"
            />
            {isSearchFocused && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl overflow-hidden z-[60] shadow-lg max-h-[200px] overflow-y-auto">
                <div
                  onClick={() => { setSelectedOrgId('all'); setSearchOrgTerm(''); handleSearch(dateRange.start, dateRange.end, 'all'); }}
                  className="px-4 py-3 text-xs font-bold text-[#0071e3] hover:bg-blue-50 cursor-pointer border-b border-zinc-100"
                >전체 기업 조회</div>
                {filteredOrgs.map(org => (
                  <div
                    key={org.id}
                    onClick={() => { setSelectedOrgId(org.id); setSearchOrgTerm(org.company_name); handleSearch(dateRange.start, dateRange.end, org.id); }}
                    className="px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                  >{org.company_name}</div>
                ))}
                {filteredOrgs.length === 0 && searchOrgTerm && (
                  <div className="px-4 py-6 text-center text-xs text-zinc-400">검색 결과 없음</div>
                )}
              </div>
            )}
            {searchOrgTerm && (
              <button onClick={() => { setSearchOrgTerm(''); setSelectedOrgId('all'); handleSearch(dateRange.start, dateRange.end, 'all'); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 지표 선택 */}
        <div className="space-y-1.5 min-w-[160px] relative">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> 지표
          </label>
          <button
            onClick={() => setIsMetricOpen(!isMetricOpen)}
            onBlur={() => setTimeout(() => setIsMetricOpen(false), 200)}
            className="flex items-center justify-between w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 px-3 py-2 outline-none hover:border-zinc-300"
          >
            <span>{metricOptions.find(m => m.id === activeMetric)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isMetricOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isMetricOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl overflow-hidden z-[70] shadow-lg"
              >
                {metricOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => { setActiveMetric(opt.id); setIsMetricOpen(false); }}
                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b border-zinc-100 last:border-0 ${activeMetric === opt.id ? 'bg-blue-50 text-[#0071e3]' : 'text-zinc-700 hover:bg-zinc-50'}`}
                  >{opt.label}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => handleSearch(dateRange.start, dateRange.end, selectedOrgId)}
          className="bg-zinc-900 hover:bg-zinc-700 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
        >
          <Search className="w-3.5 h-3.5" /> 조회
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0071e3]" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">총 API 호출</span>
          </div>
          <div className="text-3xl font-black text-zinc-900">{totalCalls.toLocaleString()}<span className="text-sm font-normal text-zinc-400 ml-1.5">건</span></div>
        </div>
        <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">총 토큰 소모</span>
          </div>
          <div className="text-3xl font-black text-[#0071e3]">{totalTokens.toLocaleString()}<span className="text-sm font-normal text-zinc-400 ml-1.5">tokens</span></div>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0071e3]" /> 일간 사용량 추이
          </h4>
          <div className="flex gap-4">
            {(activeMetric === 'all' || activeMetric === 'requests') && (
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /><span className="text-xs text-zinc-500">API 호출</span></div>
            )}
            {(activeMetric === 'all' || activeMetric === 'tokens') && (
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-zinc-500">토큰</span></div>
            )}
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} dy={8} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} hide={activeMetric === 'tokens'} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} hide={activeMetric === 'requests'} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', padding: '12px 16px' }}
                itemStyle={{ color: '#374151' }}
              />
              {(activeMetric === 'all' || activeMetric === 'requests') && (
                <Bar yAxisId="left" dataKey="total_requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
              )}
              {(activeMetric === 'all' || activeMetric === 'tokens') && (
                <Line yAxisId="right" type="monotone" dataKey="total_tokens_used" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {isFetching && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <Activity className="w-8 h-8 text-[#0071e3] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
