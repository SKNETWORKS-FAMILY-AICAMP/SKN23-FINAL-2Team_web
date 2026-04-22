/*
File    : src/app/App.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 랜딩 페이지 및 도메인별(건축, 전기, 소방, 배관) 지능화 서비스 소개 컴포넌트

Modification History:
    - 2026-04-21 (김민정) : AuthContext 연동 및 네비게이션 개선
    - 2026-04-22 (김민정) : 요금제 정보 기반 동적 내비게이션 및 비로그인 플로우 최적화
    - 2026-04-23 (김민정) : 랜딩 페이지 섹션 모듈화 및 스크롤 섹션 유지 보강
 */
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Spline from '@splinetool/react-spline';
import { useAuth } from './context/AuthContext';

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

// Modular Landing Components
import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFeatures } from '@/app/components/landing/LandingFeatures';
import { LandingWorkflow } from '@/app/components/landing/LandingWorkflow';
import { LandingPricing } from '@/app/components/landing/LandingPricing';
import { LandingFooter } from '@/app/components/landing/LandingFooter';

const domains = [
  // ... (omitted for brevity, keeping the domains array as is in the file)
  // ... (domains array remains the same)
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
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

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
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />

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
              <div className="absolute inset-0 bg-[#0071e3]/10 blur-[120px] rounded-full"></div>
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

      <main className="relative z-30 bg-[#1f1f1f]">
        <LandingFeatures />
        <LandingWorkflow />
        <LandingPricing isAuthenticated={isAuthenticated} user={user} />
      </main>

      <LandingFooter />
    </div>
  );
}