/*
File    : src/app/components/landing/LandingWorkflow.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 작업 프로세스(Workflow) 소개 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
    - 2026-04-27 (송주엽) : 라이트 테마 전환, id 추가
 */
import React from 'react';
import { motion } from 'motion/react';

const steps = [
  {
    num: "01",
    title: "Draw in AutoCAD",
    desc: "평소처럼 도면을 작업하세요. 모든 작업이 실시간으로 동기화됩니다."
  },
  {
    num: "02",
    title: "AI Analysis",
    desc: "클릭 한 번으로 도면 내의 법규 위반 사항과 최적화 요소를 분석합니다."
  },
  {
    num: "03",
    title: "One-Click Apply",
    desc: "AI가 제안하는 수정안을 검토하고 즉시 도면에 반영하세요."
  }
];

export const LandingWorkflow: React.FC = () => {
  return (
    <section className="py-32 px-8 bg-white border-t border-zinc-100 relative overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-20">
          <div className="md:w-1/3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0071e3] mb-4 block">How It Works</span>
            <h2 className="text-4xl font-bold text-zinc-900 mb-6">Seamless<br />Workflow</h2>
            <p className="text-zinc-500 leading-relaxed">학습 없이 바로 사용할 수 있는<br />익숙하고 강력한 도구.</p>
          </div>
          <div className="md:w-2/3 grid gap-0">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="flex gap-8 items-start border-l-2 border-zinc-200 pl-8 pb-12 last:pb-0 relative"
              >
                <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[#0071e3] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-5xl font-black text-zinc-900 select-none">{step.num}</span>
                <div className="pt-1">
                  <h4 className="text-xl font-bold text-zinc-900 mb-2">{step.title}</h4>
                  <p className="text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
