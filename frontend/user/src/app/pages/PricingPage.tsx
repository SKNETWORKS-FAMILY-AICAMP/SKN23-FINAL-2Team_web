import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFooter } from '@/app/components/landing/LandingFooter';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoMark from '@/assets/chat_logo_mark.png';

const detailedPlans = [
  {
    name: "무료",
    tagline: "Cadence AI가 제공하는 가장 기본적인 AI 에이전트 기능을 무료로 시작해보세요.",
    price: "0",
    period: "매월 0 KRW",
    buttonText: "시작하기",
    features: [
      {
        title: "기본적인 튜토리얼 엑세스",
        desc: "AI를 체험해보고 어떻게 동작하는지 14일간 기초 모델에 접근할 수 있습니다."
      },
      {
        title: "10회 일일 검토 한도",
        desc: "하루 최대 10번까지 설계 오류 및 시방서 위반 항목을 자동으로 추론합니다."
      },
      {
        title: "기본 규칙 템플릿 제공",
        desc: "자체적으로 보유한 표준 시방서 중 기초적인 내용으로 자동 매핑 스키마를 구성합니다."
      }
    ]
  },
  {
    name: "Basic",
    tagline: "학습 및 개인 프로젝트 또는 프리랜서 건축가를 위한 강력한 보조 도구를 활용하세요.",
    price: "600,000",
    period: "매년 600,000 KRW",
    buttonText: "시작하기",
    features: [
      {
        title: "무료 버전의 모든 기능과 추가 혜택:",
        desc: ""
      },
      {
        title: "기본 5명의 사용자 시트 (6만/시트)",
        desc: "사무소에 소속된 팀원과 함께 작업 내역과 검토 의견을 일부 공유할 수 있습니다."
      },
      {
        title: "전 도메인 지원 (건축, 전기, 소방, 배관)",
        desc: "각 도메인 간의 간섭 여부와 공정 간의 충돌 문제를 사전에 파악할 수 있는 스캐너 포함."
      },
      {
        title: "이메일 기술 지원",
        desc: "기술적 어려움이 발생했을 경우 전담 티켓 시스템을 통해 전문가의 조언을 제공합니다."
      }
    ]
  },
  {
    name: "Pro",
    tagline: "전문 건축사무소 및 소규모 협업 팀을 위해 최고의 속도와 기능을 발휘할 수 있는 환경.",
    price: "1,200,000",
    period: "매년 1,200,000 KRW",
    buttonText: "시작하기",
    isPopular: true,
    features: [
      {
        title: "Basic의 모든 기능과 추가 혜택:",
        desc: ""
      },
      {
        title: "기본 10명의 사용자 시트 (12만/시트)",
        desc: "더 많은 협업자를 무제한으로 등록 가능하며 대규모 프로젝트 파일의 교차 검증을 지원."
      },
      {
        title: "외부 연동 API 제한 해제",
        desc: "API 키 생성 제한이 풀리며 파이프라인 외부 시스템에 직접 코드를 매핑하여 검토 가능."
      },
      {
        title: "자체 시방서 무제한 학습",
        desc: "우리 회사만의 고유한 규칙이나 튜닝된 시방서를 업로드하여 Agent가 자동 반영하도록 구축."
      }
    ]
  },
  {
    name: "Enterprise",
    tagline: "글로벌 단위의 거대 팀, 건설사, 혹은 최고 권한 보안 보증이 필요한 특수 기관 전용.",
    price: "3,600,000",
    period: "매년 3,600,000 KRW",
    buttonText: "시작하기",
    features: [
      {
        title: "Pro의 모든 기능과 추가 혜택:",
        desc: ""
      },
      {
        title: "기본 30명 사용자 + 무제한 확장 (10만/시트)",
        desc: "전사적으로 확장이 가능하며 시트당 추가 비용이 합리적 가격으로 조정된 엔터프라이즈 전용 요금."
      },
      {
        title: "연간 5,000,000 Token 제공 한도 보장",
        desc: "대규모 언어 모델 처리를 위한 엄청난 용량의 토큰 크레딧 기본 제공."
      },
      {
        title: "온프레미스 & sLLM 프라이빗 튜닝",
        desc: "사내망에 직접 데이터 망을 구축하거나 회사만의 모델을 학습시키는 컨설팅 지원."
      }
    ]
  }
];

export default function PricingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const highlightedPlan = hoveredPlan;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin' || user?.role === 'superuser') {
        navigate('/admin');
      } else {
        const isSubscribed = user?.plan && user.plan.toLowerCase() !== 'free';
        if (isSubscribed) {
          navigate('/profile', { state: { tab: 'billing' } });
        } else {
          navigate('/payment');
        }
      }
    } else {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />

      <main className="flex-1 pt-32 pb-24 border-b border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-20 space-y-5 flex flex-col items-center">
            <img src={logoMark} alt="Cadence AI Logo" className="w-16 h-16 object-contain mb-2" />
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mt-0">
              <span className="text-[#0071e3]">Cadence AI</span>를 최대한 활용하세요
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {detailedPlans.map((plan, idx) => {
              const isHighlighted = highlightedPlan === plan.name;

              return (
              <div
                key={plan.name}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                onFocus={() => setHoveredPlan(plan.name)}
                onBlur={() => setHoveredPlan(null)}
                className={`group flex flex-col p-8 rounded-3xl bg-white cursor-pointer transition-all duration-300 ease-out focus-within:-translate-y-2 ${
                  isHighlighted
                    ? 'border-2 border-[#0071e3] shadow-[0_4px_24px_rgba(0,113,227,0.12)] hover:-translate-y-2 hover:shadow-[0_18px_48px_rgba(0,113,227,0.22)] focus-within:shadow-[0_18px_48px_rgba(0,113,227,0.22)]'
                    : 'border-2 border-zinc-200 hover:border-[#0071e3]/60 hover:-translate-y-2 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] focus-within:border-[#0071e3]/60 focus-within:shadow-[0_18px_42px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-zinc-900 mb-4">{plan.name}</h3>
                  <p className="text-[13px] text-zinc-600 leading-relaxed font-medium min-h-[60px]">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  {plan.price === "0" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-zinc-500">Cadence AI 계정당 매월</span>
                      <span className={`text-3xl font-black ml-1 transition-colors ${isHighlighted ? 'text-[#0071e3]' : 'text-zinc-900'}`}>₩0</span>
                      <span className="text-xs font-bold">KRW</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-500">{plan.period}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-3xl font-black transition-colors ${isHighlighted ? 'text-[#0071e3]' : 'text-zinc-900'}`}>₩{plan.price}</span>
                        <span className="text-xs font-bold">KRW</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  {idx === 0 ? (
                    <button onClick={handleAction} className={`w-full py-2.5 rounded-full border font-bold text-sm tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 ${
                      isHighlighted
                        ? 'border-[#0071e3] bg-[#0071e3] text-white hover:brightness-110'
                        : 'border-zinc-300 text-zinc-700 group-hover:border-zinc-400 group-hover:bg-zinc-50'
                    }`}>
                      {plan.buttonText}
                    </button>
                  ) : (
                    <button onClick={handleAction} className="w-full py-2.5 rounded-full bg-[#0071e3] text-white font-bold text-sm tracking-wide transition-all group-hover:brightness-110 group-hover:shadow-lg group-hover:shadow-[#0071e3]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30">
                      {plan.buttonText}
                    </button>
                  )}
                </div>

                <ul className="flex-1 space-y-6">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-4">
                      {feature.desc === "" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Check className={`w-4 h-4 ${idx === 0 && !isHighlighted ? 'text-zinc-400' : 'text-[#0071e3]'}`} strokeWidth={3} />
                          <span className="text-sm font-bold text-zinc-900">{feature.title}</span>
                        </div>
                      ) : (
                        <>
                          <div className="mt-0.5">
                            <span className={`text-xl transition-colors ${isHighlighted ? 'text-[#0071e3]' : 'text-zinc-900'}`}>✦</span>
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-zinc-900 flex items-center gap-1.5 mb-1">
                              {feature.title}
                            </div>
                            <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[200px]">
                              {feature.desc}
                            </p>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>

          <div className="mt-8 text-center text-xs text-zinc-400 space-y-1">
            <p>Enterprise 요금제는 150개가 넘는 국가 및 지역에서 맞춤 적용될 수 있습니다. 전체 국가 목록을 확인하세요.</p>
            <p>각 플랜에는 법인 세금이 포함되어 있지 않습니다.</p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
