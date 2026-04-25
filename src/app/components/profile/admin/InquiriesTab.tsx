/*
File    : src/app/components/profile/admin/InquiriesTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : Q&A 관리 페이지

Modification History:
    - 2026-04-24 (김민정) : 답변 등록 및 알림 발송 로직(handleAnswerSubmit) 내장형 모듈화
    - 2026-04-26 (김민정) : 고객 문의 답변 등록 로직 연동
*/
import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
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

export const InquiriesTab = ({ isLoading, inquiries, onRefresh }: Props) => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = async () => {
    if (!selectedInquiry || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await adminApi.answerTicket(authStorage.getAccessToken()!, selectedInquiry.id, answerText);
      if (res.ok) {
        toast.success('답변 등록 및 알림 메일 발송이 완료되었습니다.');
        setAnswerText('');
        setSelectedInquiry(null);
        onRefresh(); // 부모 리스트 갱신
      } else {
        toast.error('답변 등록 중 서버 오류가 발생했습니다.');
      }
    } catch (e) {
      toast.error('API 서버 연결 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-zinc-500 animate-pulse font-bold">문의 목록 로드 중...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* 문의 목록 */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            onClick={() => setSelectedInquiry(inquiry)}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${selectedInquiry?.id === inquiry.id
                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/10'
                : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
              }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${inquiry.status === 'answered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                {inquiry.status === 'answered' ? 'Answered' : 'Pending'}
              </span>
              <span className="text-[10px] text-zinc-500">{format(new Date(inquiry.created_at), 'yyyy.MM.dd HH:mm')}</span>
            </div>
            <h4 className="text-white font-bold mb-1">{inquiry.title}</h4>
            <p className="text-xs text-zinc-500 font-medium">{inquiry.company_name} · {inquiry.inquiry_type}</p>
          </div>
        ))}
      </div>

      {/* 답변 작성 영역 */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 flex flex-col">
        {selectedInquiry ? (
          <>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{selectedInquiry.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5 whitespace-pre-wrap italic">
                "{selectedInquiry.content}"
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> System Answer
              </label>
              <textarea
                value={answerText || selectedInquiry.answer || ''}
                onChange={(e) => setAnswerText(e.target.value)}
                readOnly={selectedInquiry.status === 'answered'}
                placeholder="답변 내용을 입력하세요..."
                className="flex-1 bg-zinc-800/50 border border-white/5 rounded-2xl p-6 text-sm text-white resize-none focus:ring-2 focus:ring-blue-600 transition-all outline-none"
              />
              {selectedInquiry.status !== 'answered' && (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={isSubmitting || !answerText.trim()}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? '전송 중...' : '답변 등록 및 알림 발송'}
                </button>
              )}
              {selectedInquiry.status === 'answered' && (
                <div className="py-4 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" /> 답변 완료된 문의입니다.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <Clock className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">관리할 문의를 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
