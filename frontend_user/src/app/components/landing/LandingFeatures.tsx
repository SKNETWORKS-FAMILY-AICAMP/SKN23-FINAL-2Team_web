/*
File    : src/app/components/landing/LandingFeatures.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 주요 기능 소개 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
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
    color: "from-purple-500 to-pink-500"
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
    <section className="py-32 px-8 bg-[#0e0e0e]" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-[1px] mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
