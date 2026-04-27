/*
File    : src/app/components/landing/LandingPricing.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 가격 정책 및 결제 안내 컴포넌트 
Modification History:
    - 2026-04-23 (김민정) : 결제 페이지로 이동하는 버튼 추가
*/
import React from 'react';
import { motion } from 'framer-motion'; // motion/react 대신 일반적인 framer-motion 라이브러리 기준
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: "Basic",
    price: "300,000",
    period: "(평생 소장)",
    type: "One-time",
    desc: "학습 및 개인 프로젝트용",
    features: [
      "평생 5개의 API 키 지원",
      "4개 전 도메인 지원 (건축, 전기, 소방, 배관)",
      "14일 무료 체험 가능",
      "기본 법규 DB 업데이트 포함"
    ],
    highlight: false
  },
  {
    name: "Pro",
    price: "100,000",
    period: "/ 월",
    type: "Subscription",
    desc: "전문 건축가 및 소규모 팀을 위한 최적의 선택",
    features: [
      "Basic의 모든 혜택 포함",
      "5개 초과 API 키 무제한 등록",
      "시방서 무제한 저장 공간 (DB 구축)",
      "우선 순위 기술 지원",
      "팀 협업 기능 제공"
    ],
    highlight: true,
    badge: "Best for Teams"
  },
  {
    name: "Enterprise",
    price: "별도 문의",
    period: "",
    type: "Custom",
    desc: "대형 설계 법인 및 건설사 맞춤형 솔루션",
    features: [
      "온프레미스 설치 및 보안망 지원",
      "기업 전용 sLLM 튜닝 및 학습",
      "24/7 전담 엔지니어 지원",
      "API 통합 커스텀 개발"
    ],
    highlight: false
  }
];

interface LandingPricingProps {
  isAuthenticated?: boolean;
  user?: any;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();

  const handleAction = (planName: string) => {
    if (planName === 'Enterprise') {
      return; // Enterprise 버튼 동작 생략
    }

    if (isAuthenticated) {
      // 관리자 권한인 경우 마이페이지나 결제창 대신 관리자 페이지로 이동
      if (user?.role === 'admin' || user?.role === 'superuser') {
        navigate('/admin');
        return;
      }

      // user.plan이 존재하고 'free'가 아니면 결제되어 있는 상태로 판단
      const isSubscribed = user?.plan && user.plan.toLowerCase() !== 'free';

      if (isSubscribed) {
        navigate('/profile', { state: { tab: 'billing' } });
      } else {
        navigate('/payment');
      }
    } else {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    }
  };

  return (
    <section className="bg-[#131313] py-32 border-t border-white/5" id="pricing">
      <div className="max-w-7xl mx-auto px-8">
        {/* 헤더 섹션: 1번 코드의 애니메이션과 디자인 적용 */}
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

        {/* 가격 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ 
                y: -12,
                scale: plan.highlight ? 1.07 : 1.03,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              className={`relative flex flex-col p-10 rounded-[32px] transition-all duration-500 group cursor-default ${plan.highlight
                ? 'bg-zinc-900/60 backdrop-blur-2xl border border-[#0071e3] scale-105 shadow-[0_0_50px_rgba(0,113,227,0.25)] z-10 hover:shadow-[0_0_80px_rgba(0,113,227,0.4)]'
                : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)]'
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(0,113,227,0.5)] transition-transform group-hover:scale-110">
                  {plan.badge}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase ${plan.highlight ? 'bg-[#0071e3]/20 text-[#abc7ff]' : 'bg-white/10 text-zinc-400'
                  }`}>
                  {plan.type}
                </span>
              </div>

              <div className="text-4xl font-black text-white mb-1">
                {plan.price === '별도 문의' ? plan.price : `₩${plan.price}`}
              </div>
              <div className={`text-sm mb-8 ${plan.highlight ? 'text-zinc-300' : 'text-[#abc7ff] font-medium'}`}>
                {plan.period}
              </div>

              <ul className="space-y-4 text-sm mb-12 flex-grow">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3 text-zinc-400">
                    {plan.highlight ? (
                      <ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[#abc7ff] shrink-0" />
                    )}
                    <span className={plan.highlight ? "text-zinc-200" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleAction(plan.name)}
                className={`w-full py-4 rounded-lg transition-all uppercase tracking-widest text-xs font-bold ${plan.highlight
                  ? 'bg-[#0071e3] text-white hover:brightness-110 shadow-xl shadow-[#0071e3]/20'
                  : 'border border-white/10 text-white hover:bg-white/5'
                  }`}>
                {plan.name === 'Enterprise' ? 'Contact Sales' : '시작하기'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};