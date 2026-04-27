/*
File    : src/app/pages/InquiriesPage.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 고객 지원(문의) 페이지
Modification History:
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경, 문의 내용과 답변 내용 추가
*/
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Send, Paperclip, List, CheckCircle, Clock, ChevronDown, HelpCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function InquiriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'list' | 'faq'>((location.state?.tab as any) || 'faq');

  const [qaForm, setQaForm] = useState({ type: '결제/요금', title: '', content: '' });
  const [file, setFile] = useState<File | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeOptions = ['결제/요금', '기술지원', '오류신고', '기타'];

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    { q: "요금제 변경은 어떻게 하나요?", a: "마이페이지의 '요금제 정보' 탭에서 원하시는 플랜을 선택하여 즉시 변경하실 수 있습니다. 남은 기간은 일할 계산되어 환불 또는 청구됩니다." },
    { q: "API Key가 노출되었습니다. 어떻게 해야 하나요?", a: "즉시 'API Key 관리' 탭에서 해당 키의 [폐기] 버튼을 눌러 무효화하시고, [새 키 발급]을 진행해 주세요." },
    { q: "플러그인 설치 파일은 어디서 받나요?", a: "측면 메뉴의 '다운로드 센터' 탭 또는 랜딩 페이지 하단의 설치 바로가기를 이용해 주세요." },
    { q: "결제 영수증은 어디서 확인하나요?", a: "결제 데이터 기록에 따라 가입하신 이메일로 자동 발송됩니다. 현재 마이페이지 결제 탭에서 내역 확인이 바로 가능합니다." }
  ];

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8001/api/v1/support/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchTickets();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaForm.title || !qaForm.content) {
      toast.error("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('type', qaForm.type);
    formData.append('title', qaForm.title);
    formData.append('content', qaForm.content);
    if (file) {
      formData.append('file', file);
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8001/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success("문의가 성공적으로 접수되었습니다.");
        setQaForm({ type: '결제/요금', title: '', content: '' });
        setFile(null);
        setActiveTab('list');
      } else {
        toast.error("문의 접수에 실패했습니다.");
      }
    } catch (e) {
      toast.error("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-200">
      <nav className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#0071e3]" /> 1:1 고객 문의 (Q&A)</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-8 border border-white/10 w-fit">
          <button onClick={() => setActiveTab('faq')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'faq' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <HelpCircle className="w-4 h-4" /> FAQ
          </button>
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <List className="w-4 h-4" /> 전체 문의 게시판
          </button>
          <button onClick={() => setActiveTab('new')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Send className="w-4 h-4" /> 새 문의 작성
          </button>
        </div>

        {activeTab === 'faq' ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2 ml-1">자주 묻는 질문 (FAQ)</h3>
              <p className="text-sm text-zinc-500 ml-1">가상 자주 하시는 질문들을 모아두었습니다.</p>
            </div>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`bg-zinc-900/50 border rounded-2xl transition-all duration-300 overflow-hidden ${openFaq === i ? 'border-[#0071e3]/50 ring-1 ring-[#0071e3]/20 shadow-xl' : 'border-white/10 hover:border-white/20'
                  }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between font-bold hover:bg-white/5 transition-colors text-left outline-none"
                >
                  <span className="flex items-center gap-4">
                    <span className="text-[#0071e3] text-lg font-black italic">Q.</span>
                    <span className="text-white text-base tracking-tight">{faq.q}</span>
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    className="text-zinc-500"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-black/20"
                    >
                      <div className="p-6 pt-3 border-t border-white/5 flex gap-4">
                        <span className="text-[#47e266] text-lg font-black italic leading-none mt-1">A.</span>
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : activeTab === 'new' ? (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-zinc-500 mb-2 block">문의 유형</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    onBlur={() => setTimeout(() => setIsTypeOpen(false), 200)} // 외부 클릭 시 닫기
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white flex items-center justify-between outline-none focus:border-[#0071e3] transition-colors"
                  >
                    <span className="font-medium">{qaForm.type}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isTypeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isTypeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
                      >
                        {typeOptions.map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setQaForm({ ...qaForm, type: opt });
                              setIsTypeOpen(false);
                            }}
                            className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${qaForm.type === opt
                              ? 'bg-[#0071e3]/20 text-[#0071e3]'
                              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-500 mb-2 block">답변받을 이메일</label>
                <input type="email" value={user?.email || '비로그인 상태입니다'} disabled className="w-full bg-white/5 text-zinc-500 border border-white/5 rounded-xl p-4 outline-none cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 mb-2 block">제목</label>
              <input type="text" value={qaForm.title} onChange={(e) => setQaForm({ ...qaForm, title: e.target.value })} placeholder="문의 제목을 입력해주세요" className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#0071e3] transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 mb-2 block">내용</label>
              <textarea value={qaForm.content} onChange={(e) => setQaForm({ ...qaForm, content: e.target.value })} placeholder="도움이 필요한 내용을 자세히 적어주세요." rows={6} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#0071e3] transition-colors resize-none"></textarea>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 mb-2 block">첨부 파일 (선택)</label>
              <div className="flex items-center gap-4">
                <input type="file" id="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <label htmlFor="file" className="bg-black/30 hover:bg-black/50 border border-white/10 px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2 text-sm text-zinc-400 font-bold transition-all">
                  <Paperclip className="w-4 h-4 text-[#0071e3]" /> 파일 선택
                </label>
                <span className="text-xs text-zinc-500">{file ? file.name : '선택된 파일이 없습니다 (최대 10MB)'}</span>
              </div>
            </div>

            <div className="pt-4">
              <button disabled={isLoading || !user} type="submit" className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#0071e3]/20 ${isLoading || !user ? 'bg-zinc-800 cursor-not-allowed' : 'bg-[#0071e3] hover:brightness-110'}`}>
                {isLoading ? '전송 중...' : (user ? '문의 접수하기' : '로그인 후 이용 가능')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {tickets.length === 0 ? (
              <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl text-center">
                <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">등록된 문의 내역이 없습니다</h3>
                <p className="text-sm text-zinc-500">새 문의 작성을 통해 궁금한 점을 남겨주시면 빠르게 답변해 드리겠습니다.</p>
              </div>
            ) : (
              tickets.map((t: any) => (
                <div
                  key={t.id}
                  className={`bg-zinc-900/50 border rounded-2xl transition-all duration-300 overflow-hidden ${expandedTicketId === t.id ? 'border-[#0071e3]/50 ring-1 ring-[#0071e3]/20 shadow-xl' : 'border-white/10 hover:border-white/20'
                    }`}
                >
                  {/* Header: Clickable Area */}
                  <div
                    onClick={() => setExpandedTicketId(expandedTicketId === t.id ? null : t.id)}
                    className="p-6 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase border ${t.status === 'answered' ? 'bg-[#47e266]/10 text-[#47e266] border-[#47e266]/20' :
                          t.status === 'processing' ? 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20' :
                            'bg-zinc-800/50 text-zinc-500 border-white/5'
                          }`}>
                          {t.status === 'answered' ? 'Answered' :
                            t.status === 'processing' ? 'In Progress' : 'Pending'}
                        </span>
                        <span className="text-xs text-zinc-300 font-bold bg-white/5 px-2 py-0.5 rounded">@{t.author || '회원'}</span>
                        <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-white/5">{t.type}</span>
                        <span className="text-[10px] text-zinc-600 font-bold">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-white text-lg flex items-center gap-3">
                        {t.title}
                        {t.has_attachment && <Paperclip className="w-4 h-4 text-blue-500/50" />}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedTicketId === t.id ? 180 : 0 }}
                      className="text-zinc-500"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Accordion Content */}
                  <AnimatePresence>
                    {expandedTicketId === t.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 pt-2 space-y-6 border-t border-white/5 mt-2">
                          <div className="p-5 bg-black/30 rounded-2xl border border-white/5 mt-4">
                            <div className="text-[13px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">문의 내용</div>
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{t.content}</p>
                          </div>

                          {t.status === 'answered' && (
                            <div className="p-5 bg-[#0071e3]/5 rounded-2xl border border-[#0071e3]/10">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-4 h-4 text-[#47e266]" />
                                <div className="text-[10px] font-black text-[#abc7ff] uppercase tracking-[0.2em]">Official Response</div>
                              </div>
                              <p className="text-sm text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap">
                                {t.answer || '답변 내역이 없습니다.'}
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
        )}
      </div>
    </div>
  );
}
