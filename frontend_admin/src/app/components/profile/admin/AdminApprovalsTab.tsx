/*
File    : src/app/components/profile/admin/AdminApprovalsTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 가입 신청 승인 대기열 (라이트 테마)
Modification History:
    - 2026-04-24 (김민정) : 승인/거절 버튼 UI 및 사업자등록증 미리보기 UI
    - 2026-04-26 (김민정) : 가입 승인 로직 및 프리사인드 URL 연동 확인
    - 2026-04-27 : 라이트 테마 전환
*/
import React, { useState } from 'react';
import { Users, ShieldCheck, Search, CheckCircle, XCircle, FileText, X, ChevronLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { adminApi } from '@/app/api/admin';
import { getAdminToken } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';

interface Props {
  isLoading: boolean;
  users: any[];
  onRefresh: () => void;
}

export const AdminApprovalsTab = ({ isLoading, users, onRefresh }: Props) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', orgId: '', companyName: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproveReject = async () => {
    try {
      setIsProcessing(true);
      const { type, orgId } = confirmModal;
      const res = await adminApi.executeAction(getAdminToken()!, type as 'approve' | 'reject', orgId);
      if (res.ok) {
        toast.success(type === 'approve' ? '✅ 가입이 승인되었습니다.' : '❌ 가입이 거절되었습니다.');
        setConfirmModal({ ...confirmModal, show: false });
        onRefresh();
      } else {
        toast.error('처리 중 오류가 발생했습니다.');
      }
    } catch {
      toast.error('서버 연결 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="text-center py-24 text-slate-400 animate-pulse flex flex-col items-center gap-3">
      <Clock className="w-8 h-8 text-slate-300" />
      <p className="text-sm font-semibold">승인 대기 목록을 불러오는 중...</p>
    </div>
  );

  return (
    <>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">가입 승인 대기열</h2>
        <p className="text-sm text-slate-500 mt-0.5">신규 기업 가입 신청을 검토하고 승인 또는 거절 처리합니다.</p>
      </div>

      {!Array.isArray(users) || users.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-semibold text-sm text-slate-400">승인 대기 중인 기업이 없습니다</p>
          <p className="text-xs text-slate-300 mt-1">새로운 가입 신청이 들어오면 이곳에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((org) => (
            <div
              key={org.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* 기업 정보 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{org.company_name}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />{org.admin_email}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>신청일: {org.created_at ? format(new Date(org.created_at), 'yyyy.MM.dd HH:mm') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-wrap items-center gap-2 xl:flex-shrink-0">
                <button
                  onClick={() => setSelectedImg(org.business_reg_s3_url)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <Search className="w-3.5 h-3.5" /> 서류 확인
                </button>
                <button
                  onClick={() => setConfirmModal({ show: true, type: 'approve', orgId: org.id, companyName: org.company_name })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> 승인
                </button>
                <button
                  onClick={() => setConfirmModal({ show: true, type: 'reject', orgId: org.id, companyName: org.company_name })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-all border border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" /> 거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 승인/거절 확인 모달 */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl p-8 relative">
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${confirmModal.type === 'approve' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {confirmModal.type === 'approve'
                ? <CheckCircle className="w-7 h-7 text-emerald-500" />
                : <XCircle className="w-7 h-7 text-red-500" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1">{confirmModal.companyName}</h3>
            <p className="text-sm text-slate-500 text-center mb-7">
              위 기업의 가입 신청을<br />
              <strong className={confirmModal.type === 'approve' ? 'text-emerald-600' : 'text-red-600'}>
                {confirmModal.type === 'approve' ? '승인' : '거절'}
              </strong> 처리하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all"
              >
                취소
              </button>
              <button
                onClick={handleApproveReject}
                disabled={isProcessing}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 ${confirmModal.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isProcessing ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서류 미리보기 모달 */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/60 z-[201] flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setSelectedImg(null)}>
          <div
            className="relative max-w-4xl w-full h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1e40af]" />사업자등록증 확인
              </h5>
              <div className="flex items-center gap-3">
                <a href={selectedImg} target="_blank" rel="noreferrer" className="text-xs text-[#1e40af] hover:underline flex items-center gap-1">
                  새 탭에서 열기 <ChevronLeft className="w-3 h-3 rotate-180" />
                </a>
                <button onClick={() => setSelectedImg(null)} className="p-1.5 bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-100">
              {selectedImg.toLowerCase().includes('.pdf') ? (
                <iframe src={`${selectedImg}#toolbar=0`} className="w-full h-full border-none" title="사업자등록증" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img src={selectedImg} alt="사업자등록증" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
