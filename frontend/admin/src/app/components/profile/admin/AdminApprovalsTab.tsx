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
import { Users, ShieldCheck, Search, CheckCircle, XCircle, FileText, X, ChevronLeft, Clock, Building2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', orgId: '', companyName: '', pin: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 사업자등록 진위확인 상태
  const [bizNo, setBizNo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [bizResult, setBizResult] = useState<any>(null); // null=미조회, {valid, status} = 결과

  const handleVerifyBusiness = async () => {
    if (!bizNo.replace(/-/g, '').trim() || bizNo.replace(/-/g, '').trim().length !== 10) {
      toast.error('사업자등록번호 10자리를 정확히 입력해주세요.');
      return;
    }
    setIsVerifying(true);
    setBizResult(null);
    try {
      const res = await adminApi.verifyBusiness(getAdminToken()!, bizNo);
      const data = await res.json();
      if (res.ok && data.success) {
        setBizResult(data);
      } else {
        toast.error(data.detail || '조회에 실패했습니다.');
        setBizResult({ error: data.detail || '조회 실패' });
      }
    } catch {
      toast.error('서버 연결에 실패했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApproveReject = async () => {
    try {
      setIsProcessing(true);
      const { type, orgId, pin } = confirmModal;

      if (type === 'approve') {
        if (!pin) {
          toast.error("관리자 PIN 번호를 입력해주세요.");
          setIsProcessing(false);
          return;
        }
        const pinRes = await adminApi.verifyPin(pin);
        if (!pinRes.ok) {
          toast.error("PIN 번호가 올바르지 않습니다.");
          setIsProcessing(false);
          return;
        }
      }

      const res = await adminApi.executeAction(getAdminToken()!, type as 'approve' | 'reject', orgId);
      if (res.ok) {
        if (type === 'reject') {
          toast.success('❌ 가입이 거절되었습니다.');
        }
        setConfirmModal({ ...confirmModal, show: false, pin: '' });
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

  const filteredUsers = users.filter((org) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return [org.company_name, org.admin_email, org.id]
      .some(value => String(value || '').toLowerCase().includes(keyword));
  });
  const selectedOrg = filteredUsers.find((org) => org.id === selectedOrgId) || filteredUsers[0];

  return (
    <>
      {!Array.isArray(users) || users.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-semibold text-sm text-slate-400">승인 대기 중인 기업이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-slate-200 bg-white p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="기업명, 이메일, 조직 ID 검색"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-[#1e40af] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              <div className="col-span-4">기업명</div>
              <div className="col-span-4">관리자 이메일</div>
              <div className="col-span-3">신청일</div>
              <div className="col-span-1 text-right">상태</div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">검색 결과가 없습니다.</div>
            ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`grid w-full grid-cols-12 items-center px-5 py-3.5 text-left transition-colors ${
                    selectedOrg?.id === org.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate text-sm font-bold text-slate-900">{org.company_name}</span>
                  </div>
                  <div className="col-span-4 truncate text-sm text-slate-500">{org.admin_email}</div>
                  <div className="col-span-3 text-xs text-slate-500">
                    {org.created_at ? format(new Date(org.created_at), 'yyyy.MM.dd HH:mm') : 'N/A'}
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      대기
                    </span>
                  </div>
                </button>
              ))}
            </div>
            )}
          </div>

          {selectedOrg && (
          <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">상세 보기</p>
            <h3 className="text-lg font-black text-slate-900 truncate">{selectedOrg.company_name}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-slate-400">관리자 이메일</span>
                <span className="font-semibold text-slate-700 truncate">{selectedOrg.admin_email}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-slate-400">신청일</span>
                <span className="font-semibold text-slate-700">
                  {selectedOrg.created_at ? format(new Date(selectedOrg.created_at), 'yyyy.MM.dd HH:mm') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-slate-400">조직 ID</span>
                <span className="max-w-[180px] truncate font-mono text-xs text-slate-500">{selectedOrg.id}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setSelectedImg(selectedOrg.business_reg_s3_url)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <Search className="w-3.5 h-3.5" /> 서류 확인
              </button>
              <button
                onClick={() => setConfirmModal({ show: true, type: 'approve', orgId: selectedOrg.id, companyName: selectedOrg.company_name, pin: '' })}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle className="w-3.5 h-3.5" /> 승인
              </button>
              <button
                onClick={() => setConfirmModal({ show: true, type: 'reject', orgId: selectedOrg.id, companyName: selectedOrg.company_name, pin: '' })}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-3.5 h-3.5" /> 거절
              </button>
            </div>
          </aside>
          )}
        </div>
      )}

      {/* 승인/거절 확인 모달 */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-8 relative">
            {/* 헤더 아이콘 */}
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${confirmModal.type === 'approve' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {confirmModal.type === 'approve'
                ? <CheckCircle className="w-7 h-7 text-emerald-500" />
                : <XCircle className="w-7 h-7 text-red-500" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1">{confirmModal.companyName}</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              위 기업의 가입 신청을{' '}
              <strong className={confirmModal.type === 'approve' ? 'text-emerald-600' : 'text-red-600'}>
                {confirmModal.type === 'approve' ? '승인' : '거절'}
              </strong> 처리하시겠습니까?
            </p>

            {/* 승인 시: 사업자 진위확인 + PIN */}
            {confirmModal.type === 'approve' && (
              <div className="space-y-4 mb-5">
                {/* 사업자등록번호 진위확인 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-[#1e40af]" />
                    <span className="text-sm font-bold text-slate-700">사업자등록번호 진위확인</span>
                    <span className="text-[10px] text-slate-400 font-medium">(국세청 API)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="000-00-00000"
                      value={bizNo}
                      onChange={(e) => { setBizNo(e.target.value); setBizResult(null); }}
                      maxLength={12}
                      className="flex-1 h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      onClick={handleVerifyBusiness}
                      disabled={isVerifying}
                      className="px-4 h-10 bg-[#1e40af] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[70px] justify-center"
                    >
                      {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      {isVerifying ? '조회중' : '조회'}
                    </button>
                  </div>

                  {/* 조회 결과 표시 */}
                  {bizResult && bizResult.success && bizResult.status && (
                    <div className={`mt-3 p-3 rounded-lg border ${
                      bizResult.status.b_stt_cd === '01'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {bizResult.status.b_stt_cd === '01'
                          ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${
                              bizResult.status.b_stt_cd === '01' ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                              {bizResult.status.b_stt || '상태 불명'}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              bizResult.status.b_stt_cd === '01'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {bizResult.status.b_stt_cd === '01' ? '정상' : '이상'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            {bizResult.status.tax_type && (
                              <div>과세유형: <span className="font-medium text-slate-700">{bizResult.status.tax_type}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(bizResult?.error || (bizResult && !bizResult.success)) && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-600 truncate">
                        {bizResult.detail || bizResult.error || '조회에 실패했습니다.'}
                      </span>
                    </div>
                  )}
                  {!bizResult && (
                    <p className="text-[11px] text-slate-400 mt-2">* 조회는 선택사항이지만 승인 전 확인을 권장합니다.</p>
                  )}
                </div>

                {/* PIN 입력 */}
                <input
                  type="password"
                  placeholder="관리자 PIN 번호 입력"
                  value={confirmModal.pin}
                  onChange={(e) => setConfirmModal({ ...confirmModal, pin: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center tracking-[0.3em] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:tracking-normal placeholder:font-normal"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConfirmModal({ ...confirmModal, show: false, pin: '' });
                  setBizNo('');
                  setBizResult(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all"
              >
                취소
              </button>
              <button
                onClick={handleApproveReject}
                disabled={isProcessing}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 ${confirmModal.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isProcessing ? '처리 중...' : confirmModal.type === 'approve' ? '승인 확정' : '거절 확정'}
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
