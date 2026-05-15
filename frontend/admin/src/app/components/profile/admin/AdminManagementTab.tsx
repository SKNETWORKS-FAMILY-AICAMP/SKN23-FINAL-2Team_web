/*
File    : src/app/components/profile/admin/AdminManagementTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 기업 관리 페이지
Modification History:
    - 2026-04-27 (송주엽) : 라이트 테마 전환, getAdminToken 사용으로 토큰 버그 수정
*/
import { useState } from 'react';
import { Building2, Search, Filter, X, Check, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
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
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planOptions = [
    { id: 'all', label: '모든 요금제' },
    { id: 'none', label: '미지정 (None)' },
    { id: 'Basic', label: 'Basic Plan' },
    { id: 'Pro', label: 'Pro Plan' },
    { id: 'Enterprise', label: 'Enterprise Plan' }
  ];

  const planTypes = [
    { id: 'none', name: 'None', desc: '요금제 미지정 상태', price: '-', period: '', color: 'slate' },
    { id: 'Basic', name: 'Basic', desc: '기본 법규 검토, 5개 API 키, 4개 도메인 지원', price: '600,000', period: '/ 연', color: 'emerald' },
    { id: 'Pro', name: 'Pro', desc: 'API 키 무제한, 시방서 무제한 저장, 우선 지원', price: '1,200,000', period: '/ 연', color: 'blue' },
    { id: 'Enterprise', name: 'Enterprise', desc: '30명+ 무제한 확장, sLLM 튜닝, 5M 토큰 보장', price: '3,600,000', period: '/ 연', color: 'purple' }
  ];

  const planBadge: Record<string, string> = {
    Enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
    Pro: 'bg-blue-50 text-blue-700 border-blue-200',
    Basic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    none: 'bg-slate-100 text-slate-500 border-slate-200',
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

  const selectedOrg = orgs.find((org) => org.id === selectedOrgId) || orgs[0];

  return (
    <div className="space-y-6">
      {/* 검색/필터 */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-3 h-3" /> 기업명 검색
          </label>
          <input
            type="text"
            placeholder="기업명을 입력하세요..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(searchName, filterPlan)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 px-4 py-2.5 focus:ring-2 focus:ring-[#1e40af]/20 focus:border-[#1e40af] outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5 min-w-[180px] relative">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> 요금제 필터
          </label>
          <button
            onClick={() => setIsPlanFilterOpen(!isPlanFilterOpen)}
            onBlur={() => setTimeout(() => setIsPlanFilterOpen(false), 200)}
            className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 px-4 py-2.5 focus:ring-2 focus:ring-[#1e40af]/20 outline-none transition-all hover:border-slate-300"
          >
            <span>{planOptions.find(p => p.id === filterPlan)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPlanFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isPlanFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden z-50 shadow-lg"
              >
                {planOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => { setFilterPlan(opt.id); setIsPlanFilterOpen(false); onSearch(searchName, opt.id); }}
                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${filterPlan === opt.id ? 'bg-blue-50 text-[#1e40af]' : 'text-slate-700 hover:bg-slate-50'}`}
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
          className="bg-slate-900 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all"
        >
          검색
        </button>
      </div>

      {/* 기업 테이블 + 상세 보기 */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">기업 목록을 불러오는 중...</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <p className="text-sm text-slate-500">조건에 맞는 기업이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              <div className="col-span-3">기업명</div>
              <div className="col-span-2">요금제</div>
              <div className="col-span-2">좌석</div>
              <div className="col-span-3">구독 만료일</div>
              <div className="col-span-2 text-right">최근 결제</div>
            </div>
            <div className="divide-y divide-slate-100">
              {orgs.map((org) => {
                const planKey = org.plan || 'none';
                const isExpired = org?.payment_info?.billing_period_end && new Date(org.payment_info.billing_period_end) < new Date();
                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`grid w-full grid-cols-12 items-center px-5 py-3.5 text-left transition-colors ${
                      selectedOrg?.id === org.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{org.company_name}</p>
                      <p className="truncate text-xs text-slate-400">{org.admin_email}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${planBadge[planKey] || planBadge.none}`}>
                        {org.plan?.toUpperCase() || 'NONE'}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-slate-700">
                      <span className="text-[#1e40af]">{org?.used_seats || 0}</span>
                      <span className="mx-1 text-slate-300">/</span>
                      {org?.payment_info?.total_seats || 0}
                    </div>
                    <div className="col-span-3 text-sm">
                      <span className={isExpired ? 'font-semibold text-red-500' : 'text-slate-600'}>
                        {org?.payment_info?.billing_period_end ? org.payment_info.billing_period_end.split('T')[0] : '기록 없음'}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm text-emerald-600">
                      {org?.payment_info?.last_payment_date ? org.payment_info.last_payment_date.split('T')[0] : 'N/A'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">상세 보기</p>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-slate-900">{selectedOrg.company_name}</h3>
                <p className="truncate text-xs text-slate-500">{selectedOrg.admin_email}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${planBadge[selectedOrg.plan] || planBadge.none}`}>
                {selectedOrg.plan?.toUpperCase() || 'NONE'}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400">좌석 현황</span>
                <span className="font-bold text-slate-900">
                  {selectedOrg?.used_seats || 0} / {selectedOrg?.payment_info?.total_seats || 0}개
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400">결제 수단</span>
                <span className="font-semibold text-slate-700">{selectedOrg?.payment_info?.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400">최근 결제일</span>
                <span className="font-semibold text-slate-700">
                  {selectedOrg?.payment_info?.last_payment_date ? selectedOrg.payment_info.last_payment_date.split('T')[0] : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400">구독 만료일</span>
                <span className="font-semibold text-slate-700">
                  {selectedOrg?.payment_info?.billing_period_end ? selectedOrg.payment_info.billing_period_end.split('T')[0] : '기록 없음'}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-slate-400">조직 ID</span>
                <span className="max-w-[210px] truncate font-mono text-xs text-slate-500">{selectedOrg.id}</span>
              </div>
            </div>

            <button
              onClick={() => setTargetOrg(selectedOrg)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-700"
            >
              <Zap className="w-3.5 h-3.5" /> 요금제 변경
            </button>
          </aside>
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
              className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#1e40af]" /> 요금제 변경
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">대상: <strong className="text-slate-900">{targetOrg.company_name}</strong></p>
                </div>
                <button onClick={() => setTargetOrg(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 요금제 선택 그리드 */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planTypes.map((plan) => {
                    const isActive = targetOrg.plan === plan.id;
                    const colorMap: Record<string, string> = {
                      emerald: 'border-emerald-300 bg-emerald-50',
                      blue: 'border-blue-300 bg-blue-50',
                      purple: 'border-purple-300 bg-purple-50',
                      slate: 'border-slate-300 bg-slate-50',
                    };
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={isSubmitting || isActive}
                        className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                          isActive
                            ? `${colorMap[plan.color]} cursor-default`
                            : 'border-slate-200 bg-white hover:border-[#1e40af]/40 hover:bg-blue-50/30'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-4 right-4">
                            <Check className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                          {plan.id === 'none' ? '요금제 해제' : '구독 플랜'}
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.desc}</p>
                        <div className="text-lg font-black text-slate-900">
                          {plan.price === '-' ? '—' : `₩${plan.price}`}
                          {plan.period && <span className="text-xs font-normal text-slate-400 ml-1">{plan.period}</span>}
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
