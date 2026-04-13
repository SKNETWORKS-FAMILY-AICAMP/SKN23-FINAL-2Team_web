import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import Spline from '@splinetool/react-spline';
import {
  Building2,
  Zap,
  ShieldAlert,
  Droplets,
  PlayCircle,
  ChevronDown,
  CheckCircle,
  ShieldCheck,
  Terminal
} from 'lucide-react';

const domains = [
  {
    id: 'architecture',
    icon: Building2,
    title: '건축 설계 지능화',
    subtitle: '01 / Architecture',
    description: '일조권, 사선 제한, 용적률 등 복잡한 건축법규를 실시간 대조합니다. 설계 변경 시 즉각적인 위반 여부를 판단합니다.',
    image: 'https://images.unsplash.com/photo-1771153511650-095180992e08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
    color: '#abc7ff',
    alertType: 'error',
    alertTitle: 'VIOLATION DETECTED',
    alertContent: 'Layer: WALL-EXT | Dist: 1.2m < (Min: 1.5m)',
    alertAction: '자동 수정: 외벽 0.3m 후퇴 제안'
  },
  {
    id: 'electrical',
    icon: Zap,
    title: '전기 설비 최적화',
    subtitle: '02 / Electrical',
    description: 'KEC(한국전기설비규정)를 완벽 반영하여 부하 계산에 따른 전선 굵기 및 차단기 용량의 적정성을 실시간 검토합니다.',
    image: 'https://images.unsplash.com/photo-1713557112617-e12d67bddc3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
    color: '#47e266',
    alertType: 'success',
    alertTitle: 'KEC COMPLIANT',
    alertContent: '분기회로 차단기 용량 40A 상향 조정 및 케이블 스펙 업데이트 자동 반영 완료.'
  },
  {
    id: 'fire',
    icon: ShieldAlert,
    title: '소방 방재 시뮬레이션',
    subtitle: '03 / Fire Safety',
    description: '화재 시 피난 경로의 유효 폭과 감지기 배치 간격을 소방법에 따라 정밀 분석합니다. 누락된 소방 설비를 즉시 탐지합니다.',
    image: 'https://images.unsplash.com/photo-1632576201861-28d241b46ceb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
    color: '#ffb4aa',
    alertType: 'info',
    alertTitle: 'FIRE SAFETY CHECK',
    alertContent: '보행 거리 초과 탐지: 32m (기준: 30m) | 방화 셔터 연동 테스트 통과'
  },
  {
    id: 'piping',
    icon: Droplets,
    title: '기계 설비 배관 자동화',
    subtitle: '04 / Piping & Plumbing',
    description: '배관의 간섭을 자동으로 회피하고 유량 계산에 최적화된 관경을 추천합니다. 유지관리 공간 확보 여부를 검토합니다.',
    image: 'https://images.unsplash.com/photo-1751486289950-5c4898a4c773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
    color: '#60a5fa',
    alertType: 'success',
    alertTitle: 'CLASH RESOLVED',
    alertContent: 'HVAC 덕트와 급수 배관 간섭 자동 해결 (Offset 150mm 적용)'
  }
];

export default function App() {
  const [activeDomain, setActiveDomain] = useState(0);
  const { scrollYProgress } = useScroll();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

      const showcaseStart = 0.2;
      const showcaseEnd = 0.65;

      if (scrollPercent >= showcaseStart && scrollPercent <= showcaseEnd) {
        const range = showcaseEnd - showcaseStart;
        const progress = (scrollPercent - showcaseStart) / range;
        const domainIndex = Math.floor(progress * domains.length);
        setActiveDomain(Math.min(domainIndex, domains.length - 1));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="dark min-h-screen bg-[#0e0e0e] text-zinc-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-8 bg-[#0071e3]"></span>
            <span className="text-xl font-bold tracking-tighter text-zinc-100">Cadence AI</span>
          </div>
          <div className="hidden md:flex gap-10">
            <a href="#features" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Features</a>
            <a href="#showcase" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Showcase</a>
            <a href="#how-it-works" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">How It Works</a>
            <a href="#pricing" className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors text-sm uppercase tracking-widest">Pricing</a>
          </div>
          <button className="bg-[#0071e3] text-white px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all text-sm">
            시작하기
          </button>
        </div>
      </nav>

      {/* 💡 구조 변경 포인트 1: 스크롤 애니메이션 전용 컨테이너 (1000vh)
        이 영역 안에서만 Hero와 Showcase가 화면에 꽉 찬 채로 고정(sticky)됩니다.
      */}
      <div className="h-[1000vh] relative z-10">

        {/* HERO */}
        <section
          className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 113, 227, 0.12) 0%, rgba(14, 14, 14, 0) 70%)' }}
        >
          {/* Spline 3D Background */}
          <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
            <Spline scene="https://prod.spline.design/IoTB2q-C0LxyvgoL/scene.splinecode" />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0e]/30 via-transparent to-[#0e0e0e]/50 z-5 pointer-events-none"></div>

          <div className="absolute inset-0 opacity-20 pointer-events-none z-5">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-[0.5px] border-[#0071e3]/20 rotate-12 scale-150"
              style={{ rotate: useTransform(scrollYProgress, [0, 0.15], [12, 112]) }}
            />
          </div>

          <motion.div
            className="relative z-30 text-center max-w-5xl px-6"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="w-2 h-2 rounded-full bg-[#47e266] animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Titanium Precision Engine v1.0</span>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white mb-8 leading-[0.9]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              PRECISION <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#abc7ff] to-[#0071e3]">
                WITHOUT LIMITS
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              도면의 모든 선이 법규와 완벽하게 일치합니다.<br />
              에이전트가 탐지하고, 당신이 승인하면, 즉시 수정됩니다.
            </motion.p>

            <motion.div
              className="flex flex-col md:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <button className="w-full md:w-auto bg-[#0071e3] text-white px-10 py-4 rounded-lg font-bold shadow-2xl shadow-[#0071e3]/20 hover:scale-105 transition-all">
                체험판 다운로드
              </button>
              <button className="w-full md:w-auto bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] px-10 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                데모 영상
                <PlayCircle className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center opacity-40 z-30"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[9px] uppercase tracking-[0.4em] block mb-2">SCROLL TO ANALYZE</span>
            <ChevronDown className="w-6 h-6 mx-auto" />
          </motion.div>
        </section>

        {/* DOMAINS (Showcase) */}
        <section className="sticky top-0 h-screen bg-[#0e0e0e] flex items-center" id="showcase">
          <div className="max-w-7xl w-full mx-auto px-8 relative flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-5/12 relative h-[60vh] flex items-center">
              {domains.map((domain, index) => {
                const Icon = domain.icon;
                const isActive = activeDomain === index;

                return (
                  <motion.div
                    key={domain.id}
                    className="absolute inset-0 flex items-center"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : index < activeDomain ? -50 : 50,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-3" style={{ color: domain.color }}>
                        <Icon className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">{domain.subtitle}</span>
                      </div>

                      <h2 className="text-5xl font-black text-white leading-tight">{domain.title}</h2>
                      <p className="text-lg text-zinc-400">{domain.description}</p>

                      <div
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 rounded-xl space-y-3"
                        style={{ borderLeftWidth: '4px', borderLeftColor: domain.color + '80' }}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold flex items-center gap-1" style={{ color: domain.color }}>
                            {domain.alertType === 'error' && '⚠️'}
                            {domain.alertType === 'success' && <CheckCircle className="w-4 h-4" />}
                            {domain.alertType === 'info' && <ShieldCheck className="w-4 h-4" />}
                            {domain.alertTitle}
                          </span>
                          {domain.alertType === 'error' && <span className="text-zinc-500">Law Art. 53-2</span>}
                        </div>
                        <div className="bg-black/40 p-3 rounded font-mono text-xs text-zinc-300">
                          {domain.alertContent}
                        </div>
                        {domain.alertAction && (
                          <div className="text-[#47e266] text-sm font-bold flex items-center gap-1">
                            ✨ {domain.alertAction}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="hidden md:block w-7/12 h-[70vh] relative pl-12">
              <div className="w-full h-full rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/10 to-transparent z-10"></div>

                {domains.map((domain, index) => (
                  <motion.img
                    key={domain.id}
                    src={domain.image}
                    alt={domain.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: activeDomain === index ? 0.5 : 0,
                      scale: activeDomain === index ? 1.1 : 1
                    }}
                    transition={{ duration: 1 }}
                  />
                ))}

                <div className="absolute top-10 right-10 z-20 space-y-4">
                  <motion.div
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/20 px-4 py-2 rounded shadow-xl text-[10px] font-mono"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                  >
                    X: 142.921 | Y: -44.022
                  </motion.div>
                  <motion.div
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/20 px-4 py-2 rounded shadow-xl text-[10px] font-mono"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                  >
                    SCALE: 1:100.00
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 💡 구조 변경 포인트 2: 일반 컨텐츠 영역 (main)
        1000vh 스크롤이 완전히 끝난 후, 이전 섹션들을 덮으면서 자연스럽게 올라옵니다.
      */}
      <main className="relative z-30 bg-[#1f1f1f]">

        {/* HOW IT WORKS */}
        <section className="py-32" id="how-it-works">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="w-full md:w-1/2 space-y-12">
                <motion.h2
                  className="text-4xl md:text-5xl font-black text-white tracking-tight"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  How It Works
                </motion.h2>

                <div className="space-y-8">
                  {[
                    { num: '01', title: '도면 데이터 로드', desc: 'AutoCAD 플러그인을 통해 현재 도면의 객체 데이터와 레이어 정보를 sLLM 엔진으로 실시간 전송합니다.' },
                    { num: '02', title: '지능형 법규 분석', desc: '학습된 전문 지식 데이터베이스와 실시간 법령 API를 대조하여 설계상의 오류 및 위반 사항을 초 단위로 식별합니다.' },
                    { num: '03', title: '원클릭 자동 보정', desc: '발견된 문제를 해결하기 위한 최적의 대안을 제안하며, 승인 시 도면 내 객체들을 표준에 맞게 즉시 재배치합니다.' }
                  ].map((step, idx) => (
                    <motion.div
                      key={step.num}
                      className="flex gap-6 group"
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.2 }}
                    >
                      <div className="w-12 h-12 rounded-full border border-[#0071e3]/30 flex items-center justify-center text-[#abc7ff] font-bold shrink-0 group-hover:bg-[#0071e3] group-hover:text-white transition-all">
                        {step.num}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                        <p className="text-zinc-400">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                className="w-full md:w-1/2"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-video bg-white/[0.03] backdrop-blur-xl border border-[#0071e3]/30 rounded-2xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Terminal className="w-32 h-32 text-[#0071e3]/20" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 p-4 rounded-lg font-mono text-[10px] text-[#abc7ff]">
                    &gt; [SYSTEM] Analyzing 1,240 entities...<br />
                    &gt; [ALERT] Minimum clearance violation at Sect-B<br />
                    &gt; [PROPOSAL] Auto-shifting node 42 by 200mm... [Y/n]
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-[#131313] py-32 border-t border-white/5" id="pricing">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              className="text-center mb-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Pricing Plans</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                평생 소장을 통한 영구적 사용부터 대규모 팀을 위한 유연한 구독 모델까지, <br className="hidden md:block" />
                비즈니스 규모에 맞는 최적의 플랜을 선택하세요.
              </p>
              <div className="w-16 h-1 bg-[#0071e3] mx-auto mt-8"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-10 rounded-2xl flex flex-col hover:border-white/20 transition-all group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Basic</h3>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-zinc-400 font-bold tracking-widest uppercase">One-time</span>
                </div>
                <div className="text-4xl font-black mb-1">₩300,000</div>
                <div className="text-sm text-[#abc7ff] font-medium mb-8">(평생 소장)</div>
                <ul className="space-y-4 text-zinc-400 text-sm mb-12 flex-grow">
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>평생 5개의 API 키 지원</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>4개 전 도메인 지원 (건축, 전기, 소방, 배관)</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>14일 무료 체험 가능</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>기본 법규 DB 업데이트 포함</span></li>
                </ul>
                <button className="w-full py-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all uppercase tracking-widest text-xs font-bold">시작하기</button>
              </motion.div>

              <motion.div
                className="bg-zinc-900/40 backdrop-blur-xl border border-[#0071e3] p-10 rounded-2xl flex flex-col relative scale-105 shadow-[0_0_40px_rgba(0,113,227,0.2)]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Best for Teams</div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Pro</h3>
                  <span className="text-[10px] bg-[#0071e3]/20 px-2 py-1 rounded text-[#abc7ff] font-bold tracking-widest uppercase">Subscription</span>
                </div>
                <div className="text-4xl font-black mb-1">₩100,000</div>
                <div className="text-sm text-zinc-400 mb-8">/ 월</div>
                <ul className="space-y-4 text-zinc-200 text-sm mb-12 flex-grow">
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" /><span>Basic의 모든 혜택 포함</span></li>
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" /><span>5개 초과 API 키 무제한 등록 및 관리</span></li>
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" /><span>시방서 무제한 저장 공간 (DB 구축)</span></li>
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" /><span>우선 순위 기술 지원</span></li>
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" /><span>팀 협업 기능 제공</span></li>
                </ul>
                <button className="w-full py-4 bg-[#0071e3] text-white rounded-lg hover:brightness-110 transition-all shadow-xl shadow-[#0071e3]/20 uppercase tracking-widest text-xs font-bold">구독 시작</button>
              </motion.div>

              <motion.div
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-10 rounded-2xl flex flex-col hover:border-white/20 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Enterprise</h3>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-zinc-400 font-bold tracking-widest uppercase">Custom</span>
                </div>
                <div className="text-4xl font-black mb-8">별도 문의</div>
                <ul className="space-y-4 text-zinc-400 text-sm mb-12 flex-grow">
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>온프레미스 설치 및 보안망 지원</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>기업 전용 sLLM 튜닝 및 학습</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>24/7 전담 엔지니어 지원</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" /><span>API 통합 커스텀 개발</span></li>
                </ul>
                <button className="w-full py-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all uppercase tracking-widest text-xs font-bold">Contact Sales</button>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/5 py-24 px-8 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-8 bg-zinc-600"></span>
              <span className="text-xl font-black tracking-tight text-white">Cadence AI</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Cadence는 CAD와 Essence(본질)을 합쳐 도면의 흐름을 완벽하게 관리한다는 의미를 가지며, 단순한 플러그인을 넘어, 도면 위의 모든 엔티티를 법적 관점에서 이해하는 지능형 코파일럿입니다.
            </p>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">© 2026 skn23 family networks inc. Seoul, KR.</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h5 className="text-white text-sm font-bold uppercase tracking-widest">Solutions</h5>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Architecture</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Electrical</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Fire Safety</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Piping</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h5 className="text-white text-sm font-bold uppercase tracking-widest">Company</h5>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Documentation</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Safety Standard</a>
                <a href="#" className="text-zinc-600 text-xs hover:text-[#abc7ff] transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}