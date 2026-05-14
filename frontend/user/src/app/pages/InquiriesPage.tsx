/*
Modification History:
    - 2026-05-14 (김지우) : 문의 페이지 헤더 좌측 정렬 및 비밀글 제목/색상 표시 개선
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Paperclip, CheckCircle, ChevronDown, Plus, Lock, KeyRound, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFooter } from '@/app/components/landing/LandingFooter';
import { API_BASE_URL } from '@/app/api/client';

export default function InquiriesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [deviceUuid, setDeviceUuid] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [qaForm, setQaForm] = useState({ type: '결제/요금', title: '', content: '', anonymousPassword: '' });
  const [file, setFile] = useState<File | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  // 비밀번호 입력 모달 관리를 위한 새로운 상태
  const [pinModalTicketId, setPinModalTicketId] = useState<number | null>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeOptions = ['결제/요금', '기술지원', '오류신고', '기타'];

  const [unlockedTickets, setUnlockedTickets] = useState<Record<number, any>>({});
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let storedUuid = localStorage.getItem('device_uuid');
    if (!storedUuid) {
      storedUuid = crypto.randomUUID ? crypto.randomUUID() : 'req-' + new Date().getTime();
      localStorage.setItem('device_uuid', storedUuid);
    }
    setDeviceUuid(storedUuid);
  }, []);

  const fetchTickets = async () => {
    if (!deviceUuid) return;
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/support/tickets?device_uuid=${deviceUuid}&page=${currentPage}&limit=${limit}`, { headers });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        setTotalCount(data.total_count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (deviceUuid) fetchTickets();
  }, [deviceUuid, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaForm.title || !qaForm.content) {
      toast.error("제목과 내용을 모두 입력해주세요.");
      return;
    }
    if (!user && qaForm.anonymousPassword.length !== 4) {
      toast.error("비회원 문의 접수를 위해 4자리 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('type', qaForm.type);
    formData.append('title', qaForm.title);
    formData.append('content', qaForm.content);
    if (!user) {
      formData.append('password', qaForm.anonymousPassword);
      formData.append('device_uuid', deviceUuid);
    }
    if (file) formData.append('file', file);

    try {
      const endpoint = user ? '/tickets' : '/tickets/anonymous';
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (user && token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/support${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(user ? "문의가 성공적으로 접수되었습니다." : "익명 문의가 성공적으로 접수되었습니다.");
        setQaForm({ type: '결제/요금', title: '', content: '', anonymousPassword: '' });
        setFile(null);
        setIsModalOpen(false);
        setCurrentPage(1);
        fetchTickets();
      } else {
        toast.error("문의 접수에 실패했습니다.");
      }
    } catch (e) {
      toast.error("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 행 클릭 시 로직 처리 (잠겨있으면 모달 띄우기, 아니면 펼치기)
  const handleRowClick = (t: any) => {
    // 이미 열려있으면 닫기
    if (expandedTicketId === t.id) {
      setExpandedTicketId(null);
      return;
    }

    // 익명 글이고 아직 해제되지 않았으면 PIN 모달 열기
    if (t.is_anonymous && !unlockedTickets[t.id]) {
      setVerifyPassword('');
      setPinModalTicketId(t.id);
    } else {
      // 그 외의 경우 (내 글이거나 인증 완료된 글) 아코디언 펼치기
      setExpandedTicketId(t.id);
    }
  };

  // 모달 내에서 비밀번호 인증 처리
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalTicketId || verifyPassword.length !== 4) return;

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append('password', verifyPassword);

      const res = await fetch(`${API_BASE_URL}/support/tickets/${pinModalTicketId}/verify`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        toast.success("인증되었습니다.");
        // 인증 성공 시 데이터 저장
        setUnlockedTickets(prev => ({ ...prev, [pinModalTicketId]: data }));
        // 즉시 아코디언 펼치기
        setExpandedTicketId(pinModalTicketId);
        // 모달 닫기 및 비밀번호 초기화
        setPinModalTicketId(null);
        setVerifyPassword('');
      } else {
        toast.error("비밀번호가 일치하지 않습니다.");
        setVerifyPassword('');
      }
    } catch (e) {
      toast.error("인증 중 오류가 발생했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />

      <main className="flex-1 pt-32 pb-24 border-b border-zinc-200">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="mb-10 flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <MessageSquare className="w-5 h-5 text-[#0071e3]" />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-black tracking-[0.18em] text-[#0071e3] uppercase">Q&A</p>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
                1:1 고객 문의
              </h2>
              <p className="mt-2 text-[13px] text-zinc-600 font-medium">Cadence AI 이용 중 궁금하신 점이나 오류를 남겨주시면 신속하게 답변해 드립니다.</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4 mb-4 mx-auto max-w-[1000px]">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">전체 문의</h3>
              <span className="text-[13px] font-bold text-[#0071e3] bg-blue-50 px-2 py-0.5 rounded-md">
                {totalCount}건
              </span>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[13px] font-bold transition-all shadow-md">
              <Plus className="w-4 h-4" /> 문의 작성하기
            </button>
          </div>

          <div className="space-y-4 max-w-[1000px] mx-auto">
            {tickets.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 p-16 rounded-2xl text-center mt-8">
                <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-zinc-900 mb-2 tracking-tight">등록된 문의 내역이 없습니다</h3>
                <p className="text-[13px] text-zinc-500 font-medium">우측 상단의 버튼을 눌러 첫 문의를 작성해보세요.</p>
              </div>
            ) : (
              <div className="border-t border-zinc-200">
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-2 border-b border-zinc-200 bg-zinc-50/50 text-[13px] font-bold text-zinc-500 text-center items-center">
                  <div className="col-span-1">상태</div>
                  <div className="col-span-2">분류</div>
                  <div className="col-span-6 text-left pl-4">제목</div>
                  <div className="col-span-1">작성자</div>
                  <div className="col-span-2">등록일</div>
                </div>

                <div className="flex flex-col">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="border-b border-zinc-200 group">
                      <div
                        onClick={() => handleRowClick(t)}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-4 px-2 items-center cursor-pointer transition-colors ${expandedTicketId === t.id ? 'bg-blue-50/30' : 'hover:bg-zinc-50'
                          }`}
                      >
                        <div className="col-span-1 flex md:justify-center items-center gap-2">
                          <span className={`text-[11px] px-2 py-1 rounded font-black tracking-widest uppercase border whitespace-nowrap ${t.status === 'answered' ? 'bg-green-50 text-green-600 border-green-200' :
                            t.status === 'processing' ? 'bg-blue-50 text-[#0071e3] border-blue-200' :
                              'bg-zinc-100 text-zinc-500 border-zinc-200'
                            }`}>
                            {t.status === 'answered' ? '답변완료' : t.status === 'processing' ? '처리중' : '접수대기'}
                          </span>
                          <div className="md:hidden flex items-center gap-2 text-[12px] text-zinc-500 ml-auto">
                            <span className="text-[#0071e3] font-bold">{t.type}</span>
                            <span>|</span>
                            <span>{new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="hidden md:block col-span-2 text-center text-[13px] font-bold text-[#0071e3]">
                          {t.type}
                        </div>

                        <div className="col-span-1 md:col-span-6 pl-0 md:pl-4">
                          <div className="font-bold text-zinc-900 text-[15px] flex items-center gap-2 group-hover:text-[#0071e3] transition-colors">
                            {t.is_anonymous && !unlockedTickets[t.id] && <Lock className="w-3.5 h-3.5 text-zinc-400" />}
                            <span className={`truncate ${t.is_anonymous && !unlockedTickets[t.id] ? 'text-zinc-400' : ''}`}>
                              {t.is_anonymous && !unlockedTickets[t.id] ? '비밀글입니다.' : t.title}
                            </span>
                            {t.has_attachment && <Paperclip className="w-3.5 h-3.5 text-zinc-400" />}
                            {t.is_mine && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-purple-50 text-purple-600 border border-purple-200">
                                N
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:block col-span-1 text-center text-[13px] text-zinc-600 font-medium truncate">
                          {t.author || '익명'}
                        </div>

                        <div className="hidden md:block col-span-2 text-center text-[13px] text-zinc-500">
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* 아코디언 내용 (인증된 내용만 보여줌) */}
                      {/* 아코디언 내용 (인증된 내용만 보여줌) */}
                      {/* 아코디언 내용 (인증된 내용만 보여줌) */}
                      {/* 아코디언 내용 (인증된 내용만 보여줌) */}
                      <AnimatePresence>
                        {expandedTicketId === t.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-[#fafafa] border-t border-zinc-200"
                          >
                            <div className="p-6 md:p-8 max-w-[1000px] mx-auto">

                              {/* 1. 작성자 문의 내용 (왼쪽 인용구 라인 스타일) */}
                              <div className="mb-8 pl-4 border-l-[3px] border-zinc-300">
                                <div className="text-[12px] font-bold text-zinc-500 mb-2">작성하신 문의 내용</div>
                                <p className="text-[14px] md:text-[15px] text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
                                  {t.is_anonymous ? unlockedTickets[t.id]?.content : t.content}
                                </p>
                              </div>

                              {/* 2. 관리자 공식 답변 (별도의 깔끔한 카드 스타일) */}
                              {t.status === 'answered' ? (
                                <div className="bg-white border border-[#0071e3]/20 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,113,227,0.1)]">
                                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-4">
                                    <div className="w-6 h-6 rounded bg-[#0071e3] flex items-center justify-center">
                                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-[14px] font-bold text-zinc-900">Cadence AI 고객지원팀</span>
                                    <span className="text-[12px] text-zinc-500 ml-auto">
                                      {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[14px] md:text-[15px] text-zinc-800 leading-relaxed whitespace-pre-wrap">
                                    {(t.is_anonymous ? unlockedTickets[t.id]?.answer : t.answer) || '답변 내역이 없습니다.'}
                                  </p>
                                </div>
                              ) : (
                                /* 접수대기 / 처리중 상태 알림 */
                                <div className="bg-zinc-100/60 border border-zinc-200 rounded-xl p-5 text-center">
                                  <p className="text-[13px] text-zinc-500 font-medium">
                                    담당자가 내용을 확인하고 있습니다. 완료 시 이메일로 알림을 보내드립니다.
                                  </p>
                                </div>
                              )}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-zinc-200 rounded-lg text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${currentPage === pageNum ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-zinc-200 rounded-lg text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 비밀글 PIN 인증 모달 (추가됨) */}
      <AnimatePresence>
        {pinModalTicketId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            {/* 배경 블러 & 딤 처리 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPinModalTicketId(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />

            {/* 모달 창 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[360px] bg-white rounded-[24px] shadow-xl p-7 mx-4"
            >
              {/* 우측 상단 닫기 버튼 */}
              <button
                onClick={() => setPinModalTicketId(null)}
                className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2 mb-6">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5 text-zinc-600" />
                </div>
                <h3 className="text-[17px] font-bold text-zinc-900 mb-1.5">비밀번호 확인</h3>
                <p className="text-[13px] text-zinc-500 font-medium">
                  문의 등록 시 설정한 4자리 숫자를 입력하세요.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full py-4 bg-zinc-50 border border-zinc-200 text-center text-2xl tracking-[0.5em] text-zinc-900 rounded-xl outline-none focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all placeholder:text-zinc-300 placeholder:tracking-[0.2em]"
                    autoFocus
                  />
                </div>

                {/* 단일 액션 버튼 */}
                <button
                  disabled={isVerifying || verifyPassword.length !== 4}
                  type="submit"
                  className={`w-full py-3.5 font-bold rounded-xl transition-all text-[14px] flex justify-center items-center ${verifyPassword.length === 4
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    }`}
                >
                  {isVerifying ? '확인 중...' : '확인'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 문의 작성 폼 모달 (기존과 동일) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] h-full max-h-[90vh] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white shrink-0">
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#0071e3]" /> 새 문의 작성
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8">
                <form id="inquiryForm" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[13px] font-bold text-zinc-600 mb-2 block">문의 유형</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsTypeOpen(!isTypeOpen)}
                          onBlur={() => setTimeout(() => setIsTypeOpen(false), 200)}
                          className="w-full bg-white border border-zinc-300 rounded-xl p-4 text-zinc-900 flex items-center justify-between outline-none focus:border-[#0071e3] transition-colors"
                        >
                          <span className="font-bold text-[14px]">{qaForm.type}</span>
                          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isTypeOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isTypeOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 w-full mt-2 bg-white border border-zinc-200 rounded-xl overflow-hidden z-20 shadow-xl"
                            >
                              {typeOptions.map((opt) => (
                                <div
                                  key={opt}
                                  onClick={() => { setQaForm({ ...qaForm, type: opt }); setIsTypeOpen(false); }}
                                  className={`px-4 py-3 text-[14px] font-bold cursor-pointer transition-colors ${qaForm.type === opt ? 'bg-blue-50 text-[#0071e3]' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {!user ? (
                      <div>
                        <label className="text-[13px] font-bold text-zinc-600 mb-2 flex items-center justify-between">
                          <span>비밀번호 (PIN)</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded font-black tracking-widest">익명 문의</span>
                        </label>
                        <input type="password" maxLength={4} required value={qaForm.anonymousPassword} onChange={(e) => setQaForm({ ...qaForm, anonymousPassword: e.target.value.replace(/[^0-9]/g, '') })} placeholder="비밀번호 숫자 4자리 설정" className="w-full bg-white border border-zinc-300 rounded-xl p-4 text-zinc-900 outline-none focus:border-[#0071e3] transition-colors font-bold tracking-widest placeholder-zinc-400" />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[13px] font-bold text-zinc-600 mb-2 block">답변받을 이메일</label>
                        <input type="email" value={user.email} disabled className="w-full bg-zinc-100 text-zinc-500 border border-zinc-200 rounded-xl p-4 outline-none cursor-not-allowed font-medium" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-zinc-600 mb-2 block">제목</label>
                    <input type="text" required value={qaForm.title} onChange={(e) => setQaForm({ ...qaForm, title: e.target.value })} placeholder="문의 제목을 입력해주세요" className="w-full bg-white border border-zinc-300 rounded-xl p-4 text-zinc-900 outline-none focus:border-[#0071e3] transition-colors font-medium text-[15px]" />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-zinc-600 mb-2 block">내용</label>
                    <textarea required value={qaForm.content} onChange={(e) => setQaForm({ ...qaForm, content: e.target.value })} placeholder="도움이 필요한 내용을 자세히 적어주세요." rows={5} className="w-full bg-white border border-zinc-300 rounded-xl p-4 text-zinc-900 outline-none focus:border-[#0071e3] transition-colors resize-none font-medium text-[14px] leading-relaxed"></textarea>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-zinc-600 mb-2 block">첨부 파일 (선택)</label>
                    <div className="flex items-center gap-4">
                      <input type="file" id="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <label htmlFor="file" className="bg-white hover:bg-zinc-50 border border-zinc-300 px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2 text-[13px] text-zinc-700 font-bold transition-all shadow-sm">
                        <Paperclip className="w-4 h-4 text-[#0071e3]" /> 파일 첨부하기
                      </label>
                      <span className="text-[12px] text-zinc-500 font-medium">{file ? file.name : '선택된 파일 (최대 10MB)'}</span>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
                <button disabled={isLoading} type="submit" form="inquiryForm" className={`w-full py-4 text-white font-bold rounded-xl transition-all tracking-wide text-[15px] ${isLoading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800 shadow-lg'}`}>
                  {isLoading ? '전송 중...' : '문의 접수하기'}
                </button>
                {!user && <p className="text-center text-[12px] text-zinc-400 font-medium mt-4">비회원으로 등록된 문의는 삭제/수정할 수 없으며 작성자명은 익명으로 표시됩니다.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LandingFooter />
    </div>
  );
}
