/*
File    : src/app/components/landing/LandingPricing.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 가격 정책 및 결제 안내 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "학습 및 개인 프로젝트용",
    features: ["기본 건축 도면 분석", "법례 데이터베이스 조회", "기기 1대 등록"]
  },
  {
    name: "Pro",
    price: "49,900",
    desc: "전문 건축가 및 소규모 스튜디오",
    features: ["전 도메인 AI 분석", "실시간 법규 업데이트", "기기 3대 등록", "우선 답변 지원"],
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "대형 설계 법인 및 건설사",
    features: ["커스텀 sLLM 학습", "사내 보안 서버 연동", "무제한 기기", "1:1 기술 파트너십"]
  }
];

interface LandingPricingProps {
  isAuthenticated: boolean;
  user: any;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ isAuthenticated, user }) => {
  return (
    <section className="py-32 px-8 bg-[#0e0e0e]" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-6">Simple Pricing</h2>
          <p className="text-zinc-500">투명하고 합리적인 가격 정책.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.highlight 
                  ? 'bg-white/[0.05] border-[#0071e3] shadow-2xl shadow-[#0071e3]/10' 
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white text-[10px] font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-zinc-500 text-sm mb-8">{plan.desc}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">
                  {plan.price === 'Custom' ? 'Contact' : `₩${plan.price}`}
                </span>
                {plan.price !== 'Custom' && <span className="text-zinc-500 text-sm ml-1">/ Month</span>}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-center gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-[#0071e3]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-xl font-bold transition-all ${
                plan.highlight 
                  ? 'bg-[#0071e3] text-white hover:brightness-110' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}>
                {plan.price === 'Custom' ? '상담 문의' : '시작하기'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
