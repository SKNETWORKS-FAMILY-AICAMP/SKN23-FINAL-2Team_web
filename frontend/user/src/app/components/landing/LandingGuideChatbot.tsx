/*
File    : src/app/components/landing/LandingGuideChatbot.tsx
Author  : 김지우
Create  : 2026-05-14
Description : 랜딩 페이지 우측 하단 가이드 챗봇 컴포넌트

Modification History:
    - 2026-05-14 (김지우) : 웹 이용 문의 응답 및 게임 명령어 미니게임 실행 기능 추가
    - 2026-05-14 (김지우) : 게임 실행 시 챗봇 모달 확장 레이아웃 적용
*/
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  ChevronRight,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import DogLoadingGame from '@/app/components/landing/DogLoadingGame';
import logoMark from '@/assets/chat_logo_mark.png';

type ChatMessage = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  type?: 'text' | 'game';
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'bot',
    text: '안녕하세요. Cadence AI 웹 이용을 도와드릴게요. 로그인, 회원가입, 다운로드, 요금제, 문의 접수에 대해 물어보세요.',
  },
];

const quickPrompts = ['로그인', '회원가입', '다운로드', '요금제', '문의하기', '게임'];

const makeAnswer = (message: string): Omit<ChatMessage, 'id'> => {
  const text = message.trim().toLowerCase();

  if (text.includes('게임')) {
    return {
      role: 'bot',
      type: 'game',
      text: '작은 게임을 열었어요. 게임 영역을 클릭한 뒤 Space 또는 ↑ 키로 점프해보세요.',
    };
  }

  if (text.includes('로그인')) {
    return {
      role: 'bot',
      text: '상단 오른쪽의 로그인 버튼을 누르면 계정 로그인 창이 열립니다. 이메일과 비밀번호를 입력한 뒤 로그인 버튼을 누르면 됩니다.',
    };
  }

  if (text.includes('회원') || text.includes('가입')) {
    return {
      role: 'bot',
      text: '회원가입은 상단 오른쪽 회원가입 버튼에서 진행할 수 있습니다. 기업명, 사업자등록증, 담당자 이메일 인증, 비밀번호, 약관 동의가 필요합니다.',
    };
  }

  if (text.includes('다운') || text.includes('설치') || text.includes('플러그인')) {
    return {
      role: 'bot',
      text: '상단 다운로드 메뉴에서 Windows용 AutoCAD 플러그인 설치 파일을 받을 수 있습니다. 현재 macOS는 지원하지 않습니다.',
    };
  }

  if (text.includes('요금') || text.includes('가격') || text.includes('결제') || text.includes('플랜')) {
    return {
      role: 'bot',
      text: '가격 책정 메뉴에서 요금제를 확인할 수 있습니다. 로그인 후 요금제를 선택하면 결제 페이지로 이동합니다.',
    };
  }

  if (text.includes('문의') || text.includes('q&a') || text.includes('고객')) {
    return {
      role: 'bot',
      text: '문의하기 메뉴에서 1:1 문의를 접수할 수 있습니다. 비회원 문의는 4자리 PIN으로 비밀글을 확인합니다.',
    };
  }

  if (text.includes('api') || text.includes('키') || text.includes('기기')) {
    return {
      role: 'bot',
      text: '로그인 후 마이페이지에서 API Key와 등록 기기를 관리할 수 있습니다. AutoCAD 플러그인에서 API Key를 입력하면 기기가 연결됩니다.',
    };
  }

  if (text.includes('비밀번호') || text.includes('찾기')) {
    return {
      role: 'bot',
      text: '로그인 창에서 비밀번호를 잊으셨나요?를 선택하면 이메일 인증 후 새 비밀번호를 설정할 수 있습니다.',
    };
  }

  return {
    role: 'bot',
    text: 'Cadence AI 웹 이용과 관련된 질문에 답할 수 있어요. 예: 로그인, 회원가입, 다운로드, 요금제, 문의하기, API Key. 미니게임을 원하면 "게임"이라고 입력해보세요.',
  };
};

export const LandingGuideChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idRef = useRef(initialMessages.length + 1);

  const latestGameId = useMemo(() => {
    const gameMessages = messages.filter((message) => message.type === 'game');
    return gameMessages.at(-1)?.id;
  }, [messages]);
  const isGameMode = latestGameId != null;

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const pushBotAnswer = (value: string) => {
    const answer = makeAnswer(value);
    setMessages((prev) => [
      ...prev,
      {
        id: idRef.current++,
        ...answer,
      },
    ]);
  };

  const sendMessage = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: idRef.current++,
        role: 'user',
        text: trimmed,
      },
    ]);
    setInput('');

    window.setTimeout(() => pushBotAnswer(trimmed), 220);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[240] flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition-all hover:-translate-y-1 hover:bg-[#0071e3] focus:outline-none focus:ring-4 focus:ring-blue-200"
        aria-label="가이드 챗봇 열기"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0071e3] ring-2 ring-white">
          <Sparkles className="h-3 w-3" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-24 right-4 z-[240] flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] transition-[width,height] duration-300 sm:right-6 ${
              isGameMode
                ? 'h-[680px] w-[min(820px,calc(100vw-32px))]'
                : 'h-[620px] w-[min(420px,calc(100vw-32px))]'
            }`}
          >
            <div className="relative overflow-hidden bg-zinc-950 px-5 py-4 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-[#0071e3]/25" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <img src={logoMark} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-black tracking-tight">Cadence Guide</h2>
                      <Bot className="h-4 w-4 text-blue-200" />
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-white/65">웹 이용 문의를 빠르게 안내합니다</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="가이드 챗봇 닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] px-4 py-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.type === 'game' ? 'w-full max-w-[740px]' : 'max-w-[88%]'
                    } ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-[#0071e3] text-white'
                        : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.type === 'game' && (
                      <DogLoadingGame active={isOpen && message.id === latestGameId} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 bg-white p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:border-[#0071e3]/30 hover:bg-blue-50 hover:text-[#0071e3]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 focus-within:border-[#0071e3] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') sendMessage();
                  }}
                  placeholder="웹 이용 질문을 입력하세요"
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition-colors hover:bg-[#0071e3]"
                  aria-label="메시지 보내기"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                "게임"을 입력하면 숨겨진 미니게임이 열립니다
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
