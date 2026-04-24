/*
File    : src/app/components/profile/admin/ManagementTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 기업 관리 페이지

Modification History:
    - 2026-04-24 (김민정) : 기업 관리 드롭다운 UI 고도화
*/
import React, { useState } from 'react';
import { Building2, CreditCard, Search, Filter, History, X, Check, ShieldAlert, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
import { toast } from 'sonner';

interface Props {
  isLoading: boolean;
  orgs: any[];
  onSearch: (name?: string, plan?: string) => void;
  onRefresh: () => void;
}

export const ManagementTab = ({ isLoading, orgs, onSearch, onRefresh }: Props) => {
  const [searchName, setSearchName] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  
  // 모달 관련 상태
  const [targetOrg, setTargetOrg] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planOptions = [
    { id: 'all', label: '모든 요금제 (All Plans)' },
    { id: 'none', label: '미지정 (None)' },
    { id: 'basic', label: 'Basic Plan' },
    { id: 'pro', label: 'Pro Plan' },
    { id: 'enterprise', label: 'Enterprise Plan' }
  ];

  const planTypes = [
    { id: 'none', name: 'None', desc: '요금제 미지정 상태', price: '0', color: 'zinc' },
    { id: 'basic', name: 'Basic', desc: '중소규모 팀을 위한 기본형(평생 소장)', price: '300,000', color: 'emerald' },
    { id: 'pro', name: 'Pro', desc: '전문적인 설계 검토가 필요한 팀(월간 구독)', price: '100,000', color: 'blue' },
    { id: 'enterprise', name: 'Enterprise', desc: '대규모 조직을 위한 커스텀 솔루션(월간 구독)', price: '199,000', color: 'purple' }
  ];

  const handlePlanChange = async (newPlan: string) => {
    if (!targetOrg) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.updatePlan(authStorage.getAccessToken()!, targetOrg.id, newPlan);
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
    <div className="space-y-8">
      {/* Search & Filter Header */}
      <div className="flex flex-wrap gap-4 items-end bg-zinc-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-visible">
        <div className="space-y-3 flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Search className="w-3 h-3" /> Company Name
          </label>
          <div className="relative">
             <input 
              type="text" 
              placeholder="기업명을 검색하세요..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl text-xs text-white px-6 py-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-3 min-w-[200px]">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Filter className="w-3 h-3" /> Billing Filter
          </label>
          <div className="relative group">
            <button 
              onClick={() => setIsPlanFilterOpen(!isPlanFilterOpen)}
              onBlur={() => setTimeout(() => setIsPlanFilterOpen(false), 200)}
              className="flex items-center justify-between w-full bg-zinc-800/50 border border-white/5 rounded-2xl text-[11px] font-bold text-white px-6 py-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all hover:bg-zinc-800"
            >
              <span>{planOptions.find(p => p.id === filterPlan)?.label}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isPlanFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isPlanFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-2 bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                >
                  {planOptions.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => { setFilterPlan(opt.id); setIsPlanFilterOpen(false); onSearch(searchName, opt.id); }}
                      className={`px-6 py-4 text-xs font-bold cursor-pointer transition-colors border-b border-white/5 last:border-0 ${
                        filterPlan === opt.id ? 'bg-blue-600/20 text-blue-400' : 'text-white hover:bg-white/5'
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
          onClick={() => onSearch(searchName, filterPlan)}
          className="bg-white hover:bg-zinc-200 text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          Apply Filter
        </button>
      </div>

      {/* Organization Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {orgs.map((org) => (
          <div key={org.id} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[40px] group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-5 items-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Building2 className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">{org.company_name}</h4>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{org.admin_email}</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                org.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]' :
                org.plan === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                org.plan === 'standard' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-zinc-800 text-zinc-500 border-white/5'
              }`}>
                {org.plan?.toUpperCase() || 'NONE'}
              </div>
            </div>

            <div className="bg-black/20 rounded-3xl p-6 border border-white/5 space-y-4 mb-8 flex-1">
               <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-500 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-3 h-3" /> License Status</span>
                  <span className="text-white">Active</span>
               </div>
               <div className="w-full h-[1px] bg-white/5"></div>
               <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-500 uppercase tracking-widest flex items-center gap-2"><History className="w-3 h-3" /> Last Active</span>
                  <span className="text-white">{org.created_at ? org.created_at.split('T')[0] : 'N/A'}</span>
               </div>
            </div>

            {/* 변경 버튼 - 클릭 시 모달 오픈 */}
            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => setTargetOrg(org)}
                className="flex-1 bg-zinc-100 hover:bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-white/5"
              >
                <Zap className="w-3.5 h-3.5" /> Change Billing Plan
              </button>
              <button className="w-14 h-14 bg-zinc-800 border border-white/5 hover:bg-zinc-700 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-lg">
                <ShieldAlert className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 요금제 변경 모달 (프리미엄 디자인) */}
      <AnimatePresence>
        {targetOrg && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setTargetOrg(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-[48px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
               {/* 모달 헤더 */}
               <div className="px-12 py-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-widest uppercase italic flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-blue-500" /> Plan Configuration
                    </h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Adjusting status for: <span className="text-white italic">{targetOrg.company_name}</span></p>
                  </div>
                  <button onClick={() => setTargetOrg(null)} className="p-4 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-full transition-all border border-white/5">
                    <X className="w-6 h-6" />
                  </button>
               </div>

               {/* 모달 메인 - 요금제 리스트 */}
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planTypes.map((plan) => (
                      <button 
                        key={plan.id}
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={isSubmitting}
                        className={`group relative text-left p-8 rounded-[36px] border transition-all duration-500 ${
                          targetOrg.plan === plan.id 
                            ? `bg-zinc-100 border-white shadow-2xl` 
                            : 'bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-900'
                        }`}
                      >
                         <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 transition-colors ${targetOrg.plan === plan.id ? 'text-zinc-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                            {plan.id === 'none' ? 'Downgrade Option' : 'Subscription Tier'}
                         </div>
                         <h4 className={`text-2xl font-black italic tracking-tighter uppercase mb-2 transition-colors ${targetOrg.plan === plan.id ? 'text-black' : 'text-white'}`}>
                            {plan.name}
                         </h4>
                         <p className={`text-[11px] font-medium leading-relaxed mb-8 transition-colors ${targetOrg.plan === plan.id ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            {plan.desc}
                         </p>
                         <div className="flex items-end gap-2 mt-auto">
                            <span className={`text-xl font-black italic ${targetOrg.plan === plan.id ? 'text-black' : 'text-white'}`}>₩{plan.price}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${targetOrg.plan === plan.id ? 'text-zinc-500' : 'text-zinc-600'}`}>/ Month</span>
                         </div>

                         {targetOrg.plan === plan.id && (
                           <div className="absolute top-8 right-8">
                              <Check className="w-6 h-6 text-black" />
                           </div>
                         )}

                         <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 opacity-30 group-hover:opacity-60 transition-all ${
                            plan.color === 'emerald' ? 'bg-emerald-500' : 
                            plan.color === 'blue' ? 'bg-blue-600' : 
                            plan.color === 'purple' ? 'bg-purple-600' : 'bg-zinc-600'
                         }`}></div>
                      </button>
                    ))}
                  </div>
               </div>

               {/* 모달 푸터 */}
               <div className="px-12 py-8 bg-black/60 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  <p>Security Identity Verification Active</p>
                  <p>Cadence AI Management Protocol</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};