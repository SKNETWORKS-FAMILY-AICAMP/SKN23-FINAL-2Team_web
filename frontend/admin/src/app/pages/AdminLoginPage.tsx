/*
File    : src/app/pages/AdminLoginPage.tsx
Author  : 김민정
Create  : 2026-04-24
Description : 관리자 PIN 로그인 페이지 (라이트 테마)
Modification History:
    - 2026-04-27 : 라이트 테마, 기업 관리자 스타일로 개선
*/
import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { PinLoginForm } from '@/app/components/auth/PinLoginForm';
import { useAdminAuth } from '@/app/context/AdminAuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAdminAuth();

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 왼쪽 브랜드 패널 */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e40af] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}
        />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1e40af] font-black text-sm">C</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">Cadence AI</span>
            <span className="px-2 py-0.5 bg-white/20 text-white/90 text-[10px] font-bold uppercase tracking-widest rounded">Admin</span>
          </div>
          <p className="text-blue-200 text-sm mt-1">Control Tower v2.0</p>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-black text-white leading-tight">
            관리자<br />제어 센터
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            기업 가입 승인, 라이선스 관리, 시스템 사용량 모니터링을 한 곳에서 처리하세요.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: '기업 관리', desc: '가입 승인 · 플랜' },
              { label: '통계 분석', desc: 'API · 토큰 현황' },
              { label: 'Q&A 처리', desc: '고객 문의 응대' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-white text-xs font-bold">{item.label}</p>
                <p className="text-blue-200 text-[10px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-[11px]">© 2026 SKN23 Family Networks Inc.</p>
      </div>

      {/* 오른쪽 로그인 패널 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* 모바일 로고 */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-[#1e40af] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="text-xl font-black tracking-tight text-zinc-900">Cadence AI</span>
          <span className="ml-1 px-2 py-0.5 bg-blue-50 text-[#1e40af] text-[10px] font-black uppercase tracking-widest rounded">Admin</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <PinLoginForm onSuccess={() => navigate('/admin')} />
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-6">
            접근 권한이 없으신가요? 시스템 담당자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
