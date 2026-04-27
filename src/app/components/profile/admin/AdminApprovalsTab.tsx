/*
File    : src/app/components/profile/admin/AdminApprovalsTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 가입 신청 승인 대기열

Modification History:
    - 2026-04-24 (김민정) : 승인/거절 버튼 UI 및 사업자등록증 미리보기 UI 
    - 2026-04-26 (김민정) : 가입 승인 로직 및 프리사인드 URL 연동 확인
*/
import React, { useState } from 'react';
import { Users, ShieldCheck, Search, CheckCircle, XCircle, FileText, X, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
import { toast } from 'sonner';

interface Props {
  isLoading: boolean;
  users: any[];
  onRefresh: () => void;
}

export const AdminApprovalsTab = ({ isLoading, users, onRefresh }: Props) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', orgId: '', companyName: '' });

  const handleApproveReject = async () => {
    try {
      const { type, orgId } = confirmModal;
      const res = await adminApi.executeAction(
        authStorage.getAccessToken()!, 
        type as 'approve' | 'reject', 
        orgId
      );
      
      if (res.ok) {
        toast.success(type === 'approve' ? '가입이 승인되었습니다.' : '가입이 거절되었습니다.');
        setConfirmModal({ ...confirmModal, show: false });
        onRefresh(); // 부모에게 리스트 갱신 요청
      } else {
        toast.error('처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      toast.error('관리자 API 서버 연결 실패');
    }
  };

  if (isLoading) return (
    <div className="text-center py-24 text-zinc-500 animate-pulse font-black uppercase tracking-[0.4em] flex flex-col items-center gap-6">
       <ShieldCheck className="w-12 h-12 text-blue-500/50" />
       Scanning Pending Nodes...
    </div>
  );

  if (users.length === 0) return (
    <div className="text-center py-24 text-zinc-600 border border-dashed border-white/10 rounded-[48px] bg-zinc-900/10 flex flex-col items-center shadow-inner">
      <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center mb-8 border border-white/5">
        <Users className="w-8 h-8 text-zinc-700" />
      </div>
      <p className="font-black text-xs uppercase tracking-[0.3em] text-zinc-400">Zero Pending Registrations.</p>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {users.map((org) => (
          <div 
            key={org.id} 
            className="bg-[#0b0b0b] border border-white/5 p-6 lg:p-8 rounded-[40px] flex flex-col xl:flex-row xl:items-center justify-between gap-6 xl:gap-0 group hover:border-white/10 transition-all shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all"></div>
            
            <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 sm:items-center italic">
              <div className="w-16 h-16 shrink-0 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-all duration-500 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-yellow-500/50 group-hover:text-yellow-500 transition-colors" />
              </div>
              <div className="space-y-3 sm:space-y-2">
                <h4 className="font-black text-white text-xl tracking-tighter uppercase mb-0.5">{org.company_name}</h4>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 text-[10px] sm:text-[11px] lg:text-[13px] text-zinc-400 font-black uppercase tracking-[0.2em] break-all">
                  <span className="flex items-center gap-2 italic"><FileText className="w-3 h-3 text-zinc-600" /> 담당자 이메일: {org.admin_email}</span>
                  <span className="opacity-60">가입 일자: {org.created_at ? format(new Date(org.created_at), 'yyyy.MM.dd HH:mm') : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <button 
                onClick={() => setSelectedImg(org.business_reg_s3_url)} 
                className="flex-1 md:flex-initial flex items-center justify-center gap-3 px-4 sm:px-8 py-4 rounded-2xl bg-zinc-800/80 text-zinc-300 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all border border-white/5 shadow-lg active:scale-95 whitespace-nowrap"
              >
                <Search className="w-4 h-4" /> 서류 확인
              </button>
              
              <button 
                onClick={() => setConfirmModal({ show: true, type: 'approve', orgId: org.id, companyName: org.company_name })} 
                className="flex-1 md:flex-initial flex items-center justify-center gap-3 px-4 sm:px-8 py-4 rounded-2xl bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 shadow-lg shadow-emerald-500/10 active:scale-95 whitespace-nowrap"
              >
                <CheckCircle className="w-4 h-4" /> 승인
              </button>
              
              <button 
                onClick={() => setConfirmModal({ show: true, type: 'reject', orgId: org.id, companyName: org.company_name })} 
                className="flex-1 md:flex-initial flex items-center justify-center gap-3 px-4 sm:px-8 py-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-lg shadow-red-500/10 active:scale-95 whitespace-nowrap"
              >
                <XCircle className="w-4 h-4" /> 거절
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 내장형 승인/거절 확인 모달 */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[201] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#111111] border border-white/10 p-10 rounded-[48px] max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
              <div className={`w-20 h-20 rounded-[28px] mx-auto mb-8 flex items-center justify-center ${confirmModal.type === 'approve' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-center text-white mb-2 leading-tight uppercase tracking-tight italic">{confirmModal.companyName}</h3>
              <p className="text-zinc-500 text-center text-xs font-black tracking-widest uppercase mb-10 opacity-70">위 기업의 가입 요청을 <br />{confirmModal.type === 'approve' ? '승인' : '거절'} 처리하시겠습니까?</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleApproveReject} 
                  className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${confirmModal.type === 'approve' ? 'bg-blue-600 shadow-xl shadow-blue-600/20 text-white' : 'bg-red-600 shadow-xl shadow-red-600/20 text-white'}`}
                >
                  Confirm {confirmModal.type}
                </button>
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, show: false, type: '' })} 
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all"
                >
                  Back to Queue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 내장형 서류 미리보기 모달 (유지) */}
      <AnimatePresence>
        {selectedImg && (
          <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl" onClick={() => setSelectedImg(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-6xl w-full h-[90vh] bg-zinc-900 rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                 <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <h5 className="text-white font-black uppercase text-[11px] tracking-[0.4em]">Integrated Document Viewer</h5>
                 </div>
                 <div className="flex items-center gap-6">
                    <a 
                      href={selectedImg} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      Open in New Tab <ChevronLeft className="w-3 h-3 rotate-180" />
                    </a>
                    <button onClick={() => setSelectedImg(null)} className="p-3 bg-white/5 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full transition-all border border-white/5">
                      <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              <div className="flex-1 bg-black/40 overflow-hidden relative group">
                {selectedImg.toLowerCase().includes('.pdf') ? (
                  <iframe 
                    src={`${selectedImg}#toolbar=0`} 
                    className="w-full h-full border-none"
                    title="Business Registration Certificate"
                  />
                ) : (
                  <div className="w-full h-full overflow-auto custom-scrollbar flex items-center justify-center p-12">
                     <img 
                      src={selectedImg} 
                      alt="Registration Certificate" 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" 
                     />
                  </div>
                )}
              </div>
              
              <div className="px-10 py-5 bg-black/40 border-t border-white/5 text-center">
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.5em] italic">Encryption Protocol Active · Cadence AI Verified Document</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};