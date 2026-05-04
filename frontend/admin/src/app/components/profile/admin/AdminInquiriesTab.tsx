/*
File    : src/app/components/profile/admin/AdminInquiriesTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : Q&A 관리 페이지 (라이트 테마)
Modification History:
    - 2026-04-24 (김민정) : 답변 등록 및 알림 발송 로직(handleAnswerSubmit) 내장형 모듈화
    - 2026-04-26 (김민정) : 고객 문의 답변 등록 로직 연동
    - 2026-04-27 : 라이트 테마 전환, getAdminToken으로 수정
*/
import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { adminApi } from '@/app/api/admin';
import { getAdminToken } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';

interface Inquiry {
  id: number;
  company_name: string;
  inquiry_type: string;
  title: string;
  content: string;
  status: string;
  answer?: string;
  created_at: string;
}

interface Props {
  isLoading: boolean;
  inquiries: Inquiry[];
  onRefresh: () => void;
}

export const AdminInquiriesTab = ({ isLoading, inquiries, onRefresh }: Props) => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setAnswerText(inquiry.answer || '');
  };

  const handleAnswerSubmit = async () => {
    if (!selectedInquiry || !answerText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.answerTicket(getAdminToken()!, selectedInquiry.id, answerText);
      if (res.ok) {
        toast.success('답변 등록 및 알림 메일 발송 완료');
        setAnswerText('');
        setSelectedInquiry(null);
        onRefresh();
      } else {
        toast.error('답변 등록 중 서버 오류');
      }
    } catch {
      toast.error('서버 연결 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="text-center py-20 text-slate-400 animate-pulse text-sm font-semibold">문의 목록 로드 중...</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Q&A 관리</h2>
        <p className="text-sm text-slate-500 mt-0.5">고객 문의를 검토하고 답변을 등록합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* 문의 목록 (왼쪽) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[620px] overflow-y-auto">
          {!Array.isArray(inquiries) || inquiries.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">접수된 문의가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                <div className="col-span-5">제목</div>
                <div className="col-span-3">기업</div>
                <div className="col-span-2">유형</div>
                <div className="col-span-2 text-right">상태</div>
              </div>
              <div className="divide-y divide-slate-100">
                {inquiries.map((inquiry) => (
                  <button
                    key={inquiry.id}
                    onClick={() => handleSelectInquiry(inquiry)}
                    className={`grid w-full grid-cols-12 items-center px-4 py-3.5 text-left transition-colors ${
                      selectedInquiry?.id === inquiry.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="col-span-5 min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{inquiry.title}</p>
                      <p className="text-[10px] text-slate-400">{format(new Date(inquiry.created_at), 'yyyy.MM.dd HH:mm')}</p>
                    </div>
                    <div className="col-span-3 truncate text-xs text-slate-500">{inquiry.company_name}</div>
                    <div className="col-span-2 truncate text-xs text-slate-500">{inquiry.inquiry_type}</div>
                    <div className="col-span-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inquiry.status === 'answered'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {inquiry.status === 'answered' ? '완료' : '대기'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 답변 작성 (오른쪽) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col min-h-[400px]">
          {selectedInquiry ? (
            <>
              <div className="mb-5 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedInquiry.status === 'answered'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {selectedInquiry.inquiry_type}
                  </span>
                  <span className="text-xs text-slate-400">{selectedInquiry.company_name}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{selectedInquiry.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl whitespace-pre-wrap">
                  {selectedInquiry.content}
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> 답변 작성
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="고객에게 보낼 답변 내용을 입력하세요..."
                  className="flex-1 min-h-[180px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 resize-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e40af] transition-all outline-none"
                />
                <button
                  onClick={handleAnswerSubmit}
                  disabled={isSubmitting || !answerText.trim()}
                  className={`py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                    selectedInquiry.status === 'answered'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-[#1e40af] hover:bg-[#1d3a9e]'
                  }`}
                >
                  {selectedInquiry.status === 'answered' ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {isSubmitting ? '처리 중...' : selectedInquiry.status === 'answered' ? '답변 수정하기' : '답변 등록 및 알림 발송'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <MessageSquare className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">좌측 목록에서 문의를 선택하세요</p>
              <p className="text-xs text-slate-300 mt-1">선택한 문의의 상세 내용과 답변 작성란이 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
