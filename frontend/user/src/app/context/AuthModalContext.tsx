/*
Modification History:
    - 2026-05-14 (김지우) : 전역 인증 모달 상태 관리를 위한 AuthModalProvider 및 useAuthModal 추가
    - 2026-05-14 (김지우) : 인증 모달을 전용 페이지(/login)로 전환 — navigate 방식으로 변경
*/
import React, { createContext, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthStep } from '@/app/components/auth/AuthModal';

type AuthModalMode = Extract<AuthStep, 'login' | 'signup' | 'forgot_password'>;

interface AuthModalContextValue {
  openAuthModal: (mode?: AuthModalMode) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const openAuthModal = useCallback((nextMode: AuthModalMode = 'login') => {
    navigate(`/login?mode=${nextMode}`);
  }, [navigate]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return context;
};
