/*
Modification History:
    - 2026-05-15 (김지우) : 시방서 등록 탭 - temp_documents 목록 조회 및 이메일 인증 기반 삭제 구현
*/
import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, Loader2, X, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';

type Doc = {
  id: string;
  file_name: string;
  comment: string | null;
  status: string;
  domain: string | null;
  expires_at: string | null;
  created_at: string | null;
};

interface Props {
  getAuthToken: () => string | null;
  onUnauthorized: () => void;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:    { label: '대기',   cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  processing: { label: '처리 중', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  done:       { label: '완료',   cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  error:      { label: '오류',   cls: 'bg-red-50 text-red-600 border border-red-200' },
};

const DOMAIN_LABEL: Record<string, string> = {
  architecture: '건축',
  electrical:   '전기',
  fire:         '소방',
  piping:       '배관',
};

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function UserDocumentTab({ getAuthToken, onUnauthorized }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [step, setStep] = useState<'confirm' | 'code'>('confirm');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchDocs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onUnauthorized(); return; }
      if (res.ok) setDocs(await res.json());
    } catch {
      toast.error('목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, onUnauthorized]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const openDeleteModal = (doc: Doc) => {
    setDeleteTarget(doc);
    setStep('confirm');
    setCode('');
    setMaskedEmail('');
  };

  const closeModal = () => {
    setDeleteTarget(null);
    setCode('');
  };

  const handleSendCode = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/documents/${deleteTarget.id}/delete-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      if (res.ok && data.success) {
        setMaskedEmail(data.email);
        setStep('code');
        toast.success('인증 코드가 발송되었습니다.');
      } else {
        toast.error(data.detail || '코드 발송에 실패했습니다.');
      }
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || code.length !== 6) {
      toast.error('6자리 인증 코드를 입력해주세요.');
      return;
    }
    setProcessing(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/documents/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('시방서가 삭제되었습니다.');
        closeModal();
        fetchDocs();
      } else {
        toast.error(data.detail || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900">시방서 등록</h2>
          <p className="mt-0.5 text-xs text-zinc-500">AutoCAD 플러그인을 통해 업로드된 시방서 파일 목록입니다.</p>
        </div>
        <span className="text-xs text-zinc-400 font-medium">{docs.length}개</span>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
            <FileText className="h-10 w-10 text-zinc-200" />
            <p className="text-sm font-medium">등록된 시방서가 없습니다.</p>
            <p className="text-xs">AutoCAD 플러그인에서 시방서를 업로드하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-500">
                  <th className="px-4 py-3 text-left font-semibold">파일명</th>
                  <th className="px-4 py-3 text-left font-semibold">설명</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-left font-semibold">도메인</th>
                  <th className="px-4 py-3 text-left font-semibold">만료일</th>
                  <th className="px-4 py-3 text-left font-semibold">등록일</th>
                  <th className="px-4 py-3 text-center font-semibold w-16">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {docs.map((doc) => {
                  const st = STATUS_LABEL[doc.status] ?? { label: doc.status, cls: 'bg-zinc-100 text-zinc-500' };
                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-800 max-w-[180px] truncate">{doc.file_name}</td>
                      <td className="px-4 py-3 text-zinc-500 max-w-[160px] truncate">{doc.comment || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{DOMAIN_LABEL[doc.domain ?? ''] ?? doc.domain ?? '-'}</td>
                      <td className="px-4 py-3 text-zinc-500">{fmtDate(doc.expires_at)}</td>
                      <td className="px-4 py-3 text-zinc-500">{fmtDate(doc.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDeleteModal(doc)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 삭제 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            {/* 모달 헤더 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {step === 'confirm' ? (
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-[#0071e3]" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {step === 'confirm' ? '시방서 삭제' : '이메일 인증'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px] truncate">{deleteTarget.file_name}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === 'confirm' ? (
              <>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  이 시방서를 삭제하면 복구할 수 없습니다.<br />
                  삭제를 진행하려면 등록된 이메일로 인증이 필요합니다.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSendCode}
                    disabled={processing}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    인증 코드 발송
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-sm text-zinc-600">
                    <span className="font-semibold text-zinc-800">{maskedEmail}</span>로 발송된<br />
                    6자리 인증 코드를 입력해주세요.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full mt-2 px-3 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-center text-lg font-mono tracking-[0.4em] text-zinc-900 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={processing}
                    className="text-[11px] text-zinc-400 hover:text-[#0071e3] transition-colors mt-1"
                  >
                    코드 재발송
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={processing || code.length !== 6}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    삭제 확인
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
