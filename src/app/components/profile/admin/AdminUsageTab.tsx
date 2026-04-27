/*
File    : src/app/components/profile/admin/AdminUsageTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 시스템 전체 사용량 통계 페이지

Modification History:
    - 2026-04-24 (김민정) : 지표 드롭다운 UI 고도화
    - 2026-04-26 (김민정) : 기업별 사용량 집계 데이터 연동 및 UI 개선
*/
import React, { useState } from 'react';
import { BarChart3, Calendar, Search, Building2, Zap, Activity, ChevronDown, X } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { startOfMonth, endOfMonth, format, subDays, isAfter, parseISO, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as ShadCalendar } from '@/app/components/ui/calendar';

interface Props {
  isLoading: boolean;
  stats: any[];
  orgs: any[];
  onSearch: (start: string, end: string, orgId?: string) => void;
}

// 내부 더미 데이터 생성기 (Vite 외부 참조 이슈 해결용)
const generateInternalDummyStats = () => {
  const startDate = parseISO('2026-04-01');
  const endDate = new Date();
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((dateStr) => {
    const seed = dateStr.getDate();
    return {
      date: format(dateStr, 'yyyy-MM-dd'),
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

  // 내부 더미 데이터 생성기 (전체 기간 생성)
  const generateInternalDummyStats = () => {
    const startDate = parseISO('2026-04-01');
    const endDate = new Date();
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((dateStr) => {
      const seed = dateStr.getDate();
      return {
        date: format(dateStr, 'yyyy-MM-dd'),
        total_requests: 100 + (seed * 23) % 150,
        total_tokens_used: 200000 + (seed * 12345) % 250000
      };
    });
  };

  // 1. 기본 소스 데이터 결정 (실데이터 vs 더미)
  const serverHasData = originalStats && originalStats.length > 0 && originalStats.some(s => s.total_requests > 0 || s.total_tokens_used > 0);
  const sourceStats = serverHasData ? originalStats : generateInternalDummyStats();

  // 2. 현재 UI의 dateRange에 맞게 데이터 실시간 필터링 (가장 중요한 부분)
  const stats = sourceStats.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);

  // 3. 필터링된 데이터 기반으로 총계 재계산 (Summary Cards용)
  const totalCalls = stats.reduce((acc, curr) => acc + (curr.total_requests || 0), 0);
  const totalTokens = stats.reduce((acc, curr) => acc + (curr.total_tokens_used || 0), 0);

  const handleSearch = (start: string, end: string, orgId: string) => {
    onSearch(start, end, orgId);
  };

  const handleThisMonthClick = () => {
    const today = new Date();
    const startStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const endStr = format(today, 'yyyy-MM-dd'); // 이번달 누르면 오늘까지
    
    setActivePeriod('month');
    const newRange = { start: startStr, end: endStr };
    setDateRange(newRange);
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handle7DayClick = () => {
    const end = new Date();
    const start = subDays(end, 6);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    
    setActivePeriod('7d');
    const newRange = { start: startStr, end: endStr };
    setDateRange(newRange);
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handleStartChange = (val: string) => {
    // 1. 유효하지 않은 날짜(예: 56일) 입력 차단
    if (!val || isNaN(new Date(val).getTime())) return;

    let newStart = val;
    let newEnd = dateRange.end;

    // 시작일이 종료일보다 늦어지면 종료일을 시작일에 맞춤
    if (newStart > newEnd) {
      newEnd = newStart;
    }

    const newRange = { start: newStart, end: newEnd };
    setDateRange(newRange);
    setActivePeriod('custom');
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const handleEndChange = (val: string) => {
    // 1. 유효하지 않은 날짜 입력 차단
    if (!val || isNaN(new Date(val).getTime())) return;

    let newEnd = val;
    let newStart = dateRange.start;

    // 종료일이 오늘보다 늦을 수 없음
    if (newEnd > todayStr) {
       newEnd = todayStr;
    }

    // 종료일이 시작일보다 빨라지면 시작일을 종료일에 맞춤
    if (newStart > newEnd) {
      newStart = newEnd;
    }

    const newRange = { start: newStart, end: newEnd };
    setDateRange(newRange);
    setActivePeriod('custom');
    handleSearch(newRange.start, newRange.end, selectedOrgId);
  };

  const metricOptions: { id: 'all' | 'requests' | 'tokens', label: string }[] = [
    { id: 'all', label: '모든 데이터 (All Metrics)' },
    { id: 'requests', label: 'AI 호출 횟수 (Requests)' },
    { id: 'tokens', label: '토큰 사용량 (Tokens)' }
  ];

  const filteredOrgs = orgs.filter(org => 
    org.company_name.toLowerCase().includes(searchOrgTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 필터 바 */}
      <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[32px] flex flex-wrap gap-8 items-end shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] -z-10"></div>
        
        {/* 기간 선택 */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <Calendar className="w-3 h-3 text-blue-500" /> Quick Selection
          </label>
          <div className="flex gap-2 p-1.5 bg-zinc-800/50 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={handle7DayClick}
              className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 ${
                activePeriod === '7d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              7 Days
            </button>
            <button 
              onClick={handleThisMonthClick}
              className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 ${
                activePeriod === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* 날짜 범위 (프리미엄 캘린더 피커) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <Calendar className="w-3 h-3 text-blue-500" /> Date Range
          </label>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-800/50 border border-white/10 hover:border-blue-500/50 rounded-xl px-5 py-3 text-[11px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-3 min-w-[140px] shadow-lg outline-none">
                  {dateRange.start.replace(/-/g, '.')}
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
                  selected={new Date(dateRange.start)}
                  onSelect={(date) => date && handleStartChange(format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => (dateRange.end ? date > new Date(dateRange.end) : false) || date < new Date('2024-01-01')}
                  initialFocus
                  className="bg-transparent text-white"
                />
              </PopoverContent>
            </Popover>

            <span className="text-zinc-400 font-black italic">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-zinc-800/50 border border-white/10 hover:border-blue-500/50 rounded-xl px-5 py-3 text-[11px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-3 min-w-[140px] shadow-lg outline-none">
                  {dateRange.end.replace(/-/g, '.')}
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
                  selected={new Date(dateRange.end)}
                  onSelect={(date) => date && handleEndChange(format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => (dateRange.start ? date < new Date(dateRange.start) : false) || date > new Date()}
                  initialFocus
                  className="bg-transparent text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 기업 검색 */}
        <div className="space-y-3 flex-1 min-w-[250px]">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <Building2 className="w-3 h-3" /> Organization Look-up
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="기업명을 검색하세요..." 
              value={searchOrgTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => setSearchOrgTerm(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/5 rounded-xl text-xs text-white px-12 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
            {isSearchFocused && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                {!searchOrgTerm ? (
                  <div 
                    onClick={() => { setSelectedOrgId('all'); setSearchOrgTerm(''); handleSearch(dateRange.start, dateRange.end, 'all'); }}
                    className="px-6 py-5 text-[10px] font-black text-blue-500 hover:bg-white/5 cursor-pointer uppercase tracking-widest bg-blue-500/5 border-b border-white/5"
                  >
                    모든 기업 조회 (전체 시스템 통계)
                  </div>
                ) : (
                  <>
                    {filteredOrgs.map(org => (
                      <div 
                        key={org.id} 
                        onClick={() => { setSelectedOrgId(org.id); setSearchOrgTerm(org.company_name); handleSearch(dateRange.start, dateRange.end, org.id); }}
                        className="px-6 py-4 text-xs font-bold text-white hover:bg-blue-600/20 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                      >
                        {org.company_name}
                      </div>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <div className="px-5 py-8 text-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {searchOrgTerm && (
              <button 
                onClick={() => { setSearchOrgTerm(''); setSelectedOrgId('all'); handleSearch(dateRange.start, dateRange.end, 'all'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 지표 선택 커스텀 UI (기존 select 대체) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <Zap className="w-3 h-3" /> Target Metric
          </label>
          <div className="relative group min-w-[200px]">
            <button 
              onClick={() => setIsMetricOpen(!isMetricOpen)}
              onBlur={() => setTimeout(() => setIsMetricOpen(false), 200)}
              className="flex items-center justify-between w-full bg-zinc-800/50 border border-white/5 rounded-xl text-xs text-white px-6 py-3.5 focus:ring-2 focus:ring-emerald-600 outline-none transition-all hover:bg-zinc-800"
            >
              <span>{metricOptions.find(m => m.id === activeMetric)?.label}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isMetricOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isMetricOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-[70] shadow-2xl"
                >
                  {metricOptions.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => { setActiveMetric(opt.id); setIsMetricOpen(false); }}
                      className={`px-6 py-4 text-xs font-bold cursor-pointer transition-colors border-b border-white/5 last:border-0 ${
                        activeMetric === opt.id ? 'bg-emerald-600/20 text-emerald-400' : 'text-white hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button 
          onClick={() => handleSearch(dateRange.start, dateRange.end, selectedOrgId)}
          className="bg-zinc-100 hover:bg-white text-black px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          <Search className="w-4 h-4" /> Run Query
        </button>
      </div>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[32px] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] group-hover:bg-blue-600/10 transition-all"></div>
           <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                 <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Total Intelligence Requests</span>
           </div>
           <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-white italic tracking-tighter">{totalCalls.toLocaleString()}</span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Calls</span>
           </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[32px] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] group-hover:bg-emerald-500/10 transition-all"></div>
           <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                 <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Total Token Consumption</span>
           </div>
           <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-[#abc7ff] italic tracking-tighter">{totalTokens.toLocaleString()}</span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Tokens</span>
           </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[40px] min-h-[500px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        
        <div className="flex justify-between items-center mb-12">
          <h4 className="text-white font-black flex items-center gap-4 text-xl uppercase tracking-tighter italic">
             <BarChart3 className="w-6 h-6 text-blue-500" /> Intelligence Monitoring
          </h4>
          <div className="flex gap-8">
            {(activeMetric === 'all' || activeMetric === 'requests') && (
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                 <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Requests</span>
              </div>
            )}
            {(activeMetric === 'all' || activeMetric === 'tokens') && (
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Tokens</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={12} />
              <YAxis yAxisId="left" stroke="#52525b" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} hide={activeMetric === 'tokens'} />
              <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} hide={activeMetric === 'requests'} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', fontSize: '11px', fontWeight: 'bold', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
                itemStyle={{ padding: '6px 0' }}
              />
              {(activeMetric === 'all' || activeMetric === 'requests') && (
                <Bar yAxisId="left" dataKey="total_requests" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35} />
              )}
              {(activeMetric === 'all' || activeMetric === 'tokens') && (
                <Line yAxisId="right" type="monotone" dataKey="total_tokens_used" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {isFetching && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center rounded-[40px] z-20">
            <div className="flex flex-col items-center gap-5">
              <Activity className="w-14 h-14 text-blue-500 animate-spin" />
              <p className="text-[12px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Requesting Matrix Data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};