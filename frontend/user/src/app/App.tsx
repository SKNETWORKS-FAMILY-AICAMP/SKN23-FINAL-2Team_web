/*
File    : src/app/App.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 랜딩 페이지 및 도메인별(건축, 전기, 소방, 배관) 지능화 서비스 소개 컴포넌트

Modification History:
    - 2026-04-21 (김민정) : AuthContext 연동 및 네비게이션 개선
    - 2026-04-22 (김민정) : 요금제 정보 기반 동적 내비게이션 및 비로그인 플로우 최적화
    - 2026-04-23 (김민정) : 랜딩 페이지 섹션 모듈화 및 스크롤 섹션 유지 보강
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경
    - 2026-04-27 (송주엽) : 라이트 테마 전환, 데모 영상 버튼 제거, Spline 제거
    - 2026-05-14 (김지우) : AuthModalContext 연동으로 비로그인 CTA 인증 모달 호출 방식 개선
    - 2026-05-14 (김지우) : 랜딩 페이지 우측 하단 가이드 챗봇 추가
 */
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useAuthModal } from './context/AuthModalContext';

import {
  Building2,
  Zap,
  ShieldAlert,
  Droplets,
  ChevronDown,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFeatures } from '@/app/components/landing/LandingFeatures';
import { LandingWorkflow } from '@/app/components/landing/LandingWorkflow';
import { LandingPricing } from '@/app/components/landing/LandingPricing';
import { LandingFAQ } from '@/app/components/landing/LandingFAQ';
import { LandingFooter } from '@/app/components/landing/LandingFooter';
import { LandingGuideChatbot } from '@/app/components/landing/LandingGuideChatbot';
import landingMainImage from '@/assets/landing-main.png';

const HERO_BACKGROUND_IMAGE = landingMainImage;

const domains = [
  {
    id: 'architecture',
    icon: Building2,
    title: '건축 설계 지능화',
    subtitle: '01 / Architecture',
    description: '일조권, 사선 제한, 용적률 등 복잡한 건축법규를 실시간 대조합니다. 설계 변경 시 즉각적인 위반 여부를 판단합니다.',
    image: 'https://images.unsplash.com/photo-1771153511650-095180992e08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
    color: '#3b82f6',
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
    color: '#10b981',
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
    color: '#ef4444',
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
    color: '#0071e3',
    alertType: 'success',
    alertTitle: 'CLASH RESOLVED',
    alertContent: 'HVAC 덕트와 급수 배관 간섭 자동 해결 (Offset 150mm 적용)'
  }
];

export default function App() {
  const [activeDomain, setActiveDomain] = useState(0);
  const { scrollYProgress } = useScroll();
  const { isAuthenticated, user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [searchParams] = useSearchParams();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  useEffect(() => {
    const domain = searchParams.get('domain');
    if (domain) {
      const domainIndex = domains.findIndex(d => d.id === domain);
      if (domainIndex >= 0) {
        setTimeout(() => {
          const showcaseStart = 0.2;
          const showcaseEnd = 0.65;
          const targetPercent = showcaseStart + (domainIndex / domains.length) * (showcaseEnd - showcaseStart);
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: targetPercent * maxScroll, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

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
    <div className="min-h-screen bg-white text-zinc-900">
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />


      <div className="h-[1000vh] relative z-10">
        {/* HERO */}
        <section className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-black">
          <img
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
            src={HERO_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
          />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/70 via-black/35 to-black/80" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-black/20" />
          {/* 좌우 엣지 페이드 */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{ boxShadow: 'inset 120px 0 120px -48px rgba(0,0,0,0.72), inset -120px 0 120px -48px rgba(0,0,0,0.72)' }}
          />

          <motion.div
            className="relative z-20 text-center max-w-5xl px-6"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >


            <motion.h1
              className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.02]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.72)]">PRECISION</span> <br />
              <span className="text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.72)]">
                WITHOUT LIMITS
              </span>
            </motion.h1>

            <motion.p
              className="text-base md:text-lg text-white/78 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              도면의 충돌, 치수 오류, 기준 위반을 실시간으로 탐지합니다.<br />
              검토 결과와 수정 제안을 확인하고 필요한 항목만 바로 적용하세요.
            </motion.p>

            {!isAuthenticated && (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <button
                  onClick={() => openAuthModal('login')}
                  className="relative bg-white text-zinc-950 px-10 py-4 rounded-xl font-bold text-base shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:bg-white/90 hover:scale-105 transition-all overflow-hidden"
                >
                  도면 분석 시작하기
                </button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-20"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[9px] uppercase tracking-[0.4em] block mb-2 text-white/50">SCROLL TO ANALYZE</span>
            <ChevronDown className="w-6 h-6 mx-auto text-white/50" />
          </motion.div>
        </section>

        {/* DOMAINS (Showcase) */}
        <section className="sticky top-0 h-screen bg-slate-50 flex items-center" id="showcase">
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
                      <h2 className="text-5xl font-black text-zinc-900 leading-tight">{domain.title}</h2>
                      <p className="text-lg text-zinc-600">{domain.description}</p>
                      <div
                        className="bg-white border border-zinc-200 p-6 rounded-xl space-y-3 shadow-sm"
                        style={{ borderLeftWidth: '4px', borderLeftColor: domain.color }}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold flex items-center gap-1" style={{ color: domain.color }}>
                            {domain.alertType === 'error' && '⚠️'}
                            {domain.alertType === 'success' && <CheckCircle className="w-4 h-4" />}
                            {domain.alertType === 'info' && <ShieldCheck className="w-4 h-4" />}
                            {domain.alertTitle}
                          </span>
                          {domain.alertType === 'error' && <span className="text-zinc-400">Law Art. 53-2</span>}
                        </div>
                        <div className="bg-zinc-50 border border-zinc-100 p-3 rounded font-mono text-xs text-zinc-700">
                          {domain.alertContent}
                        </div>
                        {domain.alertAction && (
                          <div className="text-emerald-600 text-sm font-bold flex items-center gap-1">
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
              <div className="absolute inset-0 bg-[#0071e3]/5 blur-[100px] rounded-full" />
              <div className="w-full h-full rounded-2xl bg-white border border-zinc-200 relative overflow-hidden shadow-lg">
                {domains.map((domain, index) => (
                  <motion.img
                    key={domain.id}
                    src={domain.image}
                    alt={domain.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: activeDomain === index ? 0.65 : 0,
                      scale: activeDomain === index ? 1.05 : 1
                    }}
                    transition={{ duration: 1 }}
                  />
                ))}
                <div className="absolute top-8 right-8 z-20 space-y-3">
                  <motion.div
                    className="bg-white/90 backdrop-blur border border-zinc-200 px-4 py-2 rounded-lg shadow-md text-[10px] font-mono text-zinc-700"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                  >
                    X: 142.921 | Y: -44.022
                  </motion.div>
                  <motion.div
                    className="bg-white/90 backdrop-blur border border-zinc-200 px-4 py-2 rounded-lg shadow-md text-[10px] font-mono text-zinc-700"
                    animate={{ y: [0, -8, 0] }}
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

      <main className="relative z-30 bg-white">
        <LandingFeatures />
        <LandingWorkflow />
        <LandingPricing isAuthenticated={isAuthenticated} user={user} />
        <LandingFAQ />
      </main>

      <LandingFooter />
      <LandingGuideChatbot />
    </div>
  );
}
