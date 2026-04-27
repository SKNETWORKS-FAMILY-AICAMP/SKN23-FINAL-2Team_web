/*
File    : src/app/components/profile/user/UserInquiriesTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 내 문의 내역 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경, 문의 내용과 답변 내용 추가
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus, Clock, CheckCircle2, ChevronRight, HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface MyInquiriesTabProps {
  isLoadingInquiries: boolean;
  myTickets: any[];
}

export const UserInquiriesTab: React.FC<MyInquiriesTabProps> = ({
  isLoadingInquiries,
  myTickets
}) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">1:1 문의 내역</h2>
          <p className="text-sm text-zinc-500 mt-1">도면 분석 오류 및 기술 지원 문의 현황입니다.</p>
        </div>
        <button onClick={() => navigate('/inquiries', { state: { tab: 'new' } })} className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-zinc-200 text-zinc-700">
          <MessageSquarePlus className="w-4 h-4" />
          신규 문의하기
        </button>
      </div>

      <div className="grid gap-3">
        {isLoadingInquiries ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">문의 내역을 불러오는 중입니다...</div>
        ) : !myTickets || myTickets.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-300 p-16 rounded-3xl text-center">
            <HelpCircle className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">문의 내역이 없습니다.</p>
            <button onClick={() => navigate('/inquiries', { state: { tab: 'faq' } })} className="mt-6 text-[#0071e3] text-sm font-bold hover:underline underline-offset-4">자주 묻는 질문(FAQ) 확인하기</button>
          </div>
        ) : (
          myTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`group bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${expandedId === ticket.id ? 'border-[#0071e3]/50 shadow-lg' : 'border-zinc-200 hover:border-zinc-300 shadow-sm'
                }`}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                className="p-6 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl transition-colors ${
                      ticket.status === 'answered' ? 'bg-green-50 text-green-600' :
                      ticket.status === 'processing' ? 'bg-blue-50 text-[#0071e3]' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {ticket.status === 'answered' ? <CheckCircle2 className="w-5 h-5" /> :
                       ticket.status === 'processing' ? <MessageCircle className="w-5 h-5" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                  <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase border ${
                          ticket.status === 'answered' ? 'bg-green-50 text-green-600 border-green-200' :
                          ticket.status === 'processing' ? 'bg-blue-50 text-[#0071e3] border-blue-200' :
                          'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {ticket.status === 'answered' ? 'Answered' :
                           ticket.status === 'processing' ? 'In Progress' : 'Pending'}
                        </span>
                        <h4 className="font-bold text-zinc-900 group-hover:text-[#0071e3] transition-colors">{ticket.title}</h4>
                        <span className="text-[10px] text-zinc-500 font-bold px-2 py-0.5 bg-zinc-100 rounded uppercase">{ticket.type}</span>
                      </div>
                    <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-4 font-medium">
                      <span>문의일: {format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm')}</span>
                      {ticket.resolved_at && <span>답변완료: {format(new Date(ticket.resolved_at), 'yyyy-MM-dd HH:mm')}</span>}
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedId === ticket.id ? 180 : 0 }}
                  className="text-zinc-400 group-hover:text-zinc-600"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </div>

              {/* Body */}
              <AnimatePresence>
                {expandedId === ticket.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-2 space-y-6 border-t border-zinc-100 mt-2">
                      <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 mt-4">
                        <div className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">내 문의 내용</div>
                        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{ticket.content}</p>
                      </div>

                      {ticket.status === 'answered' && (
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <div className="text-[11px] font-black text-[#0071e3] uppercase tracking-widest">운영진 답변</div>
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                            {ticket.answer || '답변 내역을 불러올 수 없습니다.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
        <h4 className="font-bold text-zinc-900 flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#0071e3]" />
          전문가 기술 지원 안내
        </h4>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Enterprise 플랜 사용자는 도면 검토 결과를 바탕으로 하는 전문 엔지니어의 1:1 리포트 분석 지원을 받으실 수 있습니다.<br />
          영업일 기준 24시간 이내에 답변을 드리는 것을 원칙으로 하고 있습니다.
        </p>
      </div>
    </div>
  );
};
