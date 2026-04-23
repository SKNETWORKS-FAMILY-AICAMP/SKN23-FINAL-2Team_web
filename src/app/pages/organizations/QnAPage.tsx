import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Send, Paperclip, List, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export default function QnAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'list'>((location.state?.tab as 'new' | 'list') || 'list');

  const [qaForm, setQaForm] = useState({ type: '결제/요금', title: '', content: '' });
  const [file, setFile] = useState<File | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/support/tickets', {
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
      const res = await fetch('http://localhost:8000/api/v1/support/tickets', {
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
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <List className="w-4 h-4" /> 전체 문의 게시판
          </button>
          <button onClick={() => setActiveTab('new')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Send className="w-4 h-4" /> 새 문의 작성
          </button>
        </div>

        {activeTab === 'new' ? (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-zinc-500 mb-2 block">문의 유형</label>
                <select value={qaForm.type} onChange={(e) => setQaForm({ ...qaForm, type: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#0071e3] transition-colors appearance-none cursor-pointer">
                  <option>결제/요금</option><option>기술지원</option><option>오류신고</option><option>기타</option>
                </select>
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
              tickets.slice(0, 5).map((t: any) => (
                <div key={t.id} className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#0071e3]/50 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-300 font-bold bg-white/5 px-2 py-0.5 rounded">{t.author}</span>
                      {t.status === 'answered' ? (
                        <span className="bg-[#47e266]/10 text-[#47e266] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 답변완료</span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> 답변대기</span>
                      )}
                      <span className="text-xs text-zinc-500 font-bold">[{t.type}]</span>
                      <span className="text-xs text-zinc-600">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-white text-lg flex items-center gap-2">
                      {t.title}
                      {t.has_attachment && <Paperclip className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-1">{t.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
