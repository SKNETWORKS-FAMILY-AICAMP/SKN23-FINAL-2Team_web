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
    price: "600,000",
    period: "/ 년",
    type: "Yearly",
    desc: "학습 및 개인 프로젝트용 (기본 5개 시트)",
    features: [
      "기본 5명의 사용자 (시트당 6만원 추가)",
      "4개 전 도메인 지원 (건축, 전기, 소방, 배관)",
      "기본 법규 DB 업데이트 포함",
      "이메일 기술 지원"
    ],
    highlight: false
  },
  {
    name: "Pro",
    price: "1,200,000",
    period: "/ 년",
    type: "Yearly",
    desc: "전문 건축가 및 소규모 팀을 위한 최적의 선택 (기본 10개 시트)",
    features: [
      "기본 10명의 사용자 (시트당 12만원 추가)",
      "무제한 API 키 생성을 통한 외부 연동",
      "시방서 무제한 저장 공간 (DB 구축)",
      "우선 순위 기술 지원 및 팀 협업 기능"
    ],
    highlight: true,
    badge: "Best for Teams"
  },
  {
    name: "Enterprise",
    price: "3,600,000",
    period: "/ 년",
    type: "Yearly",
    desc: "대형 설계 법인 및 건설사 맞춤형 솔루션 (기본 30개 시트)",
    features: [
      "기본 30명의 사용자 (시트당 10만원 추가)",
      "연간 5,000,000 Token 제공 한도 보장",
      "온프레미스 설치 및 보안망 지원",
      "기업 전용 sLLM 튜닝 및 학습 지원"
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
    <section className="bg-white py-20 border-t border-black/5" id="pricing">
      <div className="max-w-6xl mx-auto px-8">
        {/* 헤더 섹션: 1번 코드의 애니메이션과 디자인 적용 */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4">Pricing Plans</h2>
          <p className="text-zinc-600 max-w-2xl mx-auto text-base leading-relaxed">
            평생 소장을 통한 영구적 사용부터 대규모 팀을 위한 유연한 구독 모델까지, <br className="hidden md:block" />
            비즈니스 규모에 맞는 최적의 플랜을 선택하세요.
          </p>
          <div className="w-14 h-1 bg-[#0071e3] mx-auto mt-6"></div>
        </motion.div>

        {/* 가격 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ 
                y: -6,
                scale: 1.01,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              className={`relative flex flex-col p-7 rounded-2xl transition-all duration-500 group cursor-default ${plan.highlight
                ? 'bg-white border-2 border-[#0071e3] shadow-[0_10px_32px_rgba(0,113,227,0.13)] z-10 hover:shadow-[0_18px_44px_rgba(0,113,227,0.18)]'
                : 'bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]'
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-[0_5px_15px_rgba(0,113,227,0.4)]">
                  {plan.badge}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase ${plan.highlight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                  {plan.type}
                </span>
              </div>

              <div className="text-3xl font-black text-zinc-900 mb-1">
                {plan.price === '별도 문의' ? plan.price : `₩${plan.price}`}
              </div>
              <div className={`text-sm mb-6 ${plan.highlight ? 'text-zinc-500' : 'text-[#0071e3] font-medium'}`}>
                {plan.period}
              </div>

              <ul className="space-y-3 text-sm mb-8 flex-grow">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3 text-zinc-600">
                    {plan.highlight ? (
                      <ShieldCheck className="w-5 h-5 text-[#47e266] shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[#0071e3] shrink-0" />
                    )}
                    <span className={plan.highlight ? "text-zinc-800 font-medium" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleAction(plan.name)}
                className={`w-full py-3 rounded-lg transition-all uppercase tracking-widest text-xs font-bold ${plan.highlight
                  ? 'bg-[#0071e3] text-white hover:brightness-110 shadow-lg shadow-[#0071e3]/20'
                  : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400'
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
