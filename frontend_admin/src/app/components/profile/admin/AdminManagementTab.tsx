/*
File    : src/app/components/profile/admin/AdminManagementTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 기업 관리 페이지
Modification History:
    - 2026-04-27 (송주엽) : 라이트 테마 전환, getAdminToken 사용으로 토큰 버그 수정
*/
import React, { useState } from 'react';
import { Building2, CreditCard, Search, Filter, History, X, Check, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi } from '@/app/api/admin';
import { getAdminToken } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';

interface Props {
  isLoading: boolean;
  orgs: any[];
  onSearch: (name?: string, plan?: string) => void;
  onRefresh: () => void;
}

export const AdminManagementTab = ({ isLoading, orgs, onSearch, onRefresh }: Props) => {
  const [searchName, setSearchName] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  const [targetOrg, setTargetOrg] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planOptions = [
    { id: 'all', label: '모든 요금제' },
    { id: 'none', label: '미지정 (None)' },
    { id: 'basic', label: 'Basic Plan' },
    { id: 'pro', label: 'Pro Plan' },
    { id: 'enterprise', label: 'Enterprise Plan' }
  ];

  const planTypes = [
    { id: 'none', name: 'None', desc: '요금제 미지정 상태', price: '0', color: 'zinc' },
    { id: 'basic', name: 'Basic', desc: '중소규모 팀을 위한 기본형 (평생 소장)', price: '300,000', color: 'emerald' },
    { id: 'pro', name: 'Pro', desc: '전문 설계 검토가 필요한 팀 (월간 구독)', price: '100,000', color: 'blue' },
    { id: 'enterprise', name: 'Enterprise', desc: '대규모 조직을 위한 커스텀 솔루션', price: '199,000', color: 'purple' }
  ];

  const planBadge: Record<string, string> = {
    enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
    pro: 'bg-blue-50 text-blue-700 border-blue-200',
    basic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    none: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };

  const handlePlanChange = async (newPlan: string) => {
    if (!targetOrg) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.updatePlan(getAdminToken()!, targetOrg.id, newPlan);
      if (res.ok) {
        toast.success(`${targetOrg.company_name}의 플랜이 변경되었습니다.`);
        setTargetOrg(null);
        onRefresh();
      } else {
        toast.error('변경 실패');
      }
    } catch (e) {
      toast.error('서버 통신 오류');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 섹션 헤더 */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-zinc-900">기업 관리</h2>
        <p className="text-sm text-zinc-500 mt-0.5">등록된 기업의 요금제 및 구독 현황을 관리합니다.</p>
      </div>

      {/* 검색/필터 */}
      <div className="bg-white border border-zinc-200 shadow-sm p-5 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-3 h-3" /> 기업명 검색
          </label>
          <input
            type="text"
            placeholder="기업명을 입력하세요..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(searchName, filterPlan)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 px-4 py-2.5 focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5 min-w-[180px] relative">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> 요금제 필터
          </label>
          <button
            onClick={() => setIsPlanFilterOpen(!isPlanFilterOpen)}
            onBlur={() => setTimeout(() => setIsPlanFilterOpen(false), 200)}
            className="flex items-center justify-between w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 px-4 py-2.5 focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all hover:border-zinc-300"
          >
            <span>{planOptions.find(p => p.id === filterPlan)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isPlanFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isPlanFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl overflow-hidden z-50 shadow-lg"
              >
                {planOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => { setFilterPlan(opt.id); setIsPlanFilterOpen(false); onSearch(searchName, opt.id); }}
                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b border-zinc-100 last:border-0 ${filterPlan === opt.id ? 'bg-blue-50 text-[#0071e3]' : 'text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    {opt.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => onSearch(searchName, filterPlan)}
          className="bg-zinc-900 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all"
        >
          검색
        </button>
      </div>

      {/* 기업 카드 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-zinc-400 animate-pulse">기업 목록을 불러오는 중...</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 rounded-2xl bg-white">
          <Building2 className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">조건에 맞는 기업이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl hover:border-zinc-300 transition-all flex flex-col">
              {/* 헤더 */}
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#0071e3]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">{org.company_name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{org.admin_email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${planBadge[org.plan?.toLowerCase()] || planBadge['none']}`}>
                  {org.plan?.toUpperCase() || 'NONE'}
                </span>
              </div>

              {/* 정보 그리드 */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-3 mb-5 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#0071e3]" /> 좌석 현황</span>
                  <span className="font-semibold text-zinc-900">
                    <span className="text-[#0071e3]">{org?.used_seats || 0}</span>
                    <span className="text-zinc-400 mx-1">/</span>
                    <span>{org?.payment_info?.total_seats || 0}</span>
                    <span className="text-[10px] text-zinc-400 ml-1">대</span>
                  </span>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 flex items-center gap-1.5"><History className="w-3 h-3 text-emerald-500" /> 구독 만료일</span>
                  <div className="text-right">
                    <span className={org?.payment_info?.billing_period_end ? 'font-semibold text-zinc-900' : 'text-zinc-400'}>
                      {org?.payment_info?.billing_period_end ? org.payment_info.billing_period_end.split('T')[0] : '기록 없음'}
                    </span>
                    {org?.payment_info?.billing_period_end && (
                      <div className={`text-[10px] font-bold mt-0.5 ${new Date(org.payment_info.billing_period_end) < new Date() ? 'text-red-500' : 'text-emerald-600'}`}>
                        {new Date(org.payment_info.billing_period_end) < new Date() ? '만료됨' : '구독 중'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">결제 수단</p>
                    <p className="text-sm font-medium text-zinc-700 mt-0.5">{org?.payment_info?.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">최근 결제일</p>
                    <p className="text-sm font-medium text-emerald-600 mt-0.5">{org?.payment_info?.last_payment_date ? org.payment_info.last_payment_date.split('T')[0] : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 플랜 변경 버튼 */}
              <button
                onClick={() => setTargetOrg(org)}
                className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> 요금제 변경
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 요금제 변경 모달 */}
      <AnimatePresence>
        {targetOrg && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setTargetOrg(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="px-8 py-5 border-b border-zinc-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0071e3]" /> 요금제 변경
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">대상: <strong className="text-zinc-900">{targetOrg.company_name}</strong></p>
                </div>
                <button onClick={() => setTargetOrg(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 요금제 선택 그리드 */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planTypes.map((plan) => {
                    const isActive = targetOrg.plan?.toLowerCase() === plan.id;
                    const colorMap: Record<string, string> = {
                      emerald: 'border-emerald-300 bg-emerald-50',
                      blue: 'border-blue-300 bg-blue-50',
                      purple: 'border-purple-300 bg-purple-50',
                      zinc: 'border-zinc-300 bg-zinc-50',
                    };
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={isSubmitting || isActive}
                        className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                          isActive
                            ? `${colorMap[plan.color]} cursor-default`
                            : 'border-zinc-200 bg-white hover:border-[#0071e3]/40 hover:bg-blue-50/30'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-4 right-4">
                            <Check className="w-5 h-5 text-zinc-600" />
                          </div>
                        )}
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                          {plan.id === 'none' ? '요금제 해제' : '구독 플랜'}
                        </div>
                        <h4 className="text-xl font-black text-zinc-900 mb-1">{plan.name}</h4>
                        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{plan.desc}</p>
                        <div className="text-lg font-black text-zinc-900">
                          ₩{plan.price}
                          <span className="text-xs font-normal text-zinc-400 ml-1">/ 월</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
