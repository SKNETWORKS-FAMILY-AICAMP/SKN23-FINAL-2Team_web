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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      {/* 중앙 로고 */}
      <div className="flex items-center gap-2 mb-8 transform -translate-y-4">
        <div className="w-9 h-9 bg-[#1e40af] rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10">
          <span className="text-white font-black text-lg">C</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-zinc-900">Cadence AI</span>
        <span className="ml-1.5 px-2.5 py-1 bg-blue-100/60 text-[#1e40af] text-[10px] font-black uppercase tracking-widest rounded-md">
          Admin
        </span>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-10 shadow-2xl shadow-slate-200/50">
          <PinLoginForm onSuccess={() => navigate('/admin')} />
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          접근 권한이 없으신가요? 시스템 담당자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
