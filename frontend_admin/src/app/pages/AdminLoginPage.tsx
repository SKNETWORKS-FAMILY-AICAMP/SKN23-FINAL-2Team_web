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
    <div className="dark min-h-screen bg-[#0e0e0e] flex items-center justify-center">
      <div
        className="w-full max-w-md mx-4 p-10 rounded-2xl
                   bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
        style={{ boxShadow: '0 0 80px rgba(0, 113, 227, 0.08)' }}
      >
        <PinLoginForm onSuccess={() => navigate('/admin')} />
      </div>
    </div>
  );
}
