/*
File    : src/app/context/AuthContext.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 인증 상태 관리 Context 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 인증 상태 관리 Context 초기 구현
    - 2026-04-21 (김민정) : verification_status 및 plan 필드 추가
    - 2026-04-22 (김민정) : JWT Refresh Token 연동 및 자동 갱신 로직 고도화
    - 2026-04-24 (김민정) : 비밀번호 찾기 및 재설정 기능 추가
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { authStorage } from '../utils/storage';
import { User, AuthContextType } from './auth.types';
import { useAuthActions } from './useAuthActions'; // 액션 훅 임포트

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authStorage.getUserInfo());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!authStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(false);

  // 1. 동작(Actions) 가져오기
  const { login, logout, register, verifyEmail } = useAuthActions(setUser, setIsAuthenticated);

  // 2. 부가적인 로직들 (갱신 등)
  const refreshUser = useCallback(async () => {
    const token = authStorage.getAccessToken();
    if (!token) return;
    try {
      const response = await authApi.getCurrentPayment(token);
      const data = await response.json();
      if (data?.success) {
        const updates = {
          plan: data.plan_name,
          ...(data.max_seats != null ? { max_seats: data.max_seats } : {}),
        };
        setUser(prev => prev ? { ...prev, ...updates } : null);
        authStorage.updateUserInfo(updates);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const rt = authStorage.getRefreshToken();
    if (!rt) {
      if (authStorage.getAccessToken()) logout();
      return;
    }
    try {
      const response = await authApi.refresh(rt);
      const data = await response.json();
      if (data?.success) {
        authStorage.updateAccessToken(data.token);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (authStorage.getAccessToken()) refreshToken();
    }, 1000 * 60 * 50);
    return () => clearInterval(interval);
  }, [refreshToken]);

  // 비밀번호 관련은 간단해서 여기 둬도 되고, 필요시 Actions로 옮겨도 됩니다.
  const requestPasswordReset = async (email: string) => {
    const response = await authApi.requestReset(email);
    return response.json();
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const response = await authApi.resetPassword({ email, code, new_password: newPassword });
    return response.json();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, register, verifyEmail,
      requestPasswordReset, resetPassword, logout,
      isLoading, refreshToken, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
