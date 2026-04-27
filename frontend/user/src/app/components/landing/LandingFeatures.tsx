/*
File    : src/app/components/landing/LandingFeatures.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 주요 기능 소개 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-27 (송주엽) : 라이트 테마 전환
 */
import React from 'react';
import { motion } from 'motion/react';
import { Terminal, ShieldCheck, Zap } from 'lucide-react';

const features = [
  {
    icon: Terminal,
    title: "AI Compliance Engine",
    description: "최신 법규 데이터를 학습한 sLLM이 도면의 모든 요소를 검토합니다.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: ShieldCheck,
    title: "Zero-Risk Precision",
    description: "99.9% 의 높은 정확도로 설계의 사소한 오차까지 잡아냅니다.",
    color: "from-violet-500 to-purple-400"
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "도면 로드 즉시 수초 내로 분석 결과를 시각화하여 제공합니다.",
    color: "from-amber-400 to-orange-500"
  }
];

export const LandingFeatures: React.FC = () => {
  return (
    <section className="py-32 px-8 bg-slate-50 border-t border-zinc-100" id="features">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4">Core Features</h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">도면 설계의 모든 단계를 AI가 실시간으로 지원합니다.</p>
          <div className="w-12 h-1 bg-[#0071e3] mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
