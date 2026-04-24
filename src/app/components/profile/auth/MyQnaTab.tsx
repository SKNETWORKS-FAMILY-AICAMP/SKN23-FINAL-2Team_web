/*
File    : src/app/components/profile/MyQnaTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 내 문의 내역 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus, Clock, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MyQnaTabProps {
  isLoadingQna: boolean;
  myTickets: any[];
}

export const MyQnaTab: React.FC<MyQnaTabProps> = ({
  isLoadingQna,
  myTickets
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">1:1 문의 내역</h2>
          <p className="text-sm text-zinc-500 mt-1">도면 분석 오류 및 기술 지원 문의 현황입니다.</p>
        </div>
        <button onClick={() => navigate('/qna', { state: { tab: 'new' } })} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5">
          <MessageSquarePlus className="w-4 h-4" />
          신규 문의하기
        </button>
      </div>

      <div className="grid gap-3">
        {isLoadingQna ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">문의 내역을 불러오는 중입니다...</div>
        ) : !myTickets || myTickets.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-white/10 p-16 rounded-3xl text-center">
            <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">문의 내역이 없습니다.</p>
            <button onClick={() => navigate('/faq')} className="mt-6 text-[#0071e3] text-sm font-bold hover:underline underline-offset-4">자주 묻는 질문(FAQ) 확인하기</button>
          </div>
        ) : (
          myTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="group bg-zinc-900/50 border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-zinc-800/50 hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-xl ${
                  ticket.status === 'answered' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {ticket.status === 'answered' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white group-hover:text-[#abc7ff] transition-colors">{ticket.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{ticket.type}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-3">
                    <span>문의일: {format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm')}</span>
                    {ticket.resolved_at && <span>답변완료: {format(new Date(ticket.resolved_at), 'yyyy-MM-dd HH:mm')}</span>}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>
          ))
        )}
      </div>

      <div className="bg-[#0071e3]/5 border border-[#0071e3]/20 p-6 rounded-3xl">
        <h4 className="font-bold text-white flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#abc7ff]" />
          전문가 기술 지원 안내
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Enterprise 플랜 사용자는 도면 검토 결과를 바탕으로 하는 전문 엔지니어의 1:1 리포트 분석 지원을 받으실 수 있습니다.<br />
          영업일 기준 24시간 이내에 답변을 드리는 것을 원칙으로 하고 있습니다.
        </p>
      </div>
    </div>
  );
};
