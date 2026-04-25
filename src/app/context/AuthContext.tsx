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
    - 2026-04-26 (김민정) : qna 파일명 변경
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { authStorage } from '../utils/storage';

export interface User {
  email: string;
  companyName?: string;
  role: string;
  orgId?: string;
  verification_status?: string;
  plan?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (companyName: string, email: string, password: string, certificateFile: File) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('로그아웃 되었습니다.');
  }, []);

  const refreshUser = useCallback(async () => {
    const token = authStorage.getAccessToken();
    if (!token) return;
    try {
      const response = await authApi.getCurrentPayment(token);
      const data = await response.json();
      if (data?.success) {
        setUser(prev => prev ? { ...prev, plan: data.plan_name } : null);
        authStorage.updateUserPlan(data.plan_name);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const rt = authStorage.getRefreshToken();
    if (!rt) { logout(); return; }
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
    const token = authStorage.getAccessToken();
    const rt = authStorage.getRefreshToken();
    if (token && rt) {
      const savedUser = authStorage.getUserInfo();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);

    const interval = setInterval(() => {
      if (authStorage.getAccessToken()) refreshToken();
    }, 1000 * 60 * 50);
    return () => clearInterval(interval);
  }, [refreshToken]);

  const login = async (email: string, password?: string) => {
    try {
      const response = await authApi.login({ email, password: password || 'dummy_password' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || '로그인 실패');
      
      authStorage.setAuthData(data.token, data.refresh_token, data.user);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (companyName: string, email: string, password: string, certificateFile: File) => {
    try {
      const formData = new FormData();
      formData.append('company_name', companyName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('certificate', certificateFile);

      const response = await authApi.register(formData);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '회원가입 실패');
      return data;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await authApi.verifyEmail({ email, code });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '인증 실패');

      authStorage.setAuthData(data.token, data.refresh_token, data.user);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await authApi.requestReset(email);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '요청 실패');
      return data;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const response = await authApi.resetPassword({ email, code, new_password: newPassword });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '변경 실패');
      return data;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, verifyEmail, requestPasswordReset, resetPassword, logout, isLoading, refreshToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};