/*
File    : src/app/context/AuthContext.tsx
Author  : 김민정
Create  : 2026-04-20
Description : 인증 상태 관리 Context 컴포넌트

Modification History:
    - 2026-04-20 (김민정) : 인증 상태 관리 Context 초기 구현
    - 2026-04-21 (김민정) : verification_status 및 plan 필드 추가
    - 2026-04-22 (김민정) : JWT Refresh Token 연동 및 자동 갱신 로직 고도화
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
  register: (companyName: string, email: string, password: string) => Promise<void>;
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setIsAuthenticated(false);
    console.log('[Auth] Logged out, tokens cleared.');
    toast.success('로그아웃 되었습니다.');
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/v1/payments/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data && data.success) {
        setUser(prev => prev ? { ...prev, plan: data.plan_name } : null);
        const savedUserStr = localStorage.getItem('user_info');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          localStorage.setItem('user_info', JSON.stringify({ ...savedUser, plan: data.plan_name }));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      console.log('[Auth] Refreshing access token using refresh token...');
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt })
        });
        const data = await response.json();
        if (data && data.success) {
          localStorage.setItem('access_token', data.token);
          console.log('[Auth] Access token renewed.');
        } else {
          console.warn('[Auth] Refresh token expired or invalid, logging out.');
          logout();
        }
      } catch (error) {
        console.error('[Auth] Refresh request failed:', error);
      }
    } else {
      console.warn('[Auth] No refresh token found, logging out.');
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const rt = localStorage.getItem('refresh_token');

    if (token && rt) {
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);

    const interval = setInterval(() => {
      if (localStorage.getItem('access_token')) {
        refreshToken();
      }
    }, 1000 * 60 * 50);

    return () => clearInterval(interval);
  }, [refreshToken]);

  const login = async (email: string, password?: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'dummy_password' })
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data.detail === 'string' ? data.detail :
          Array.isArray(data.detail) ? data.detail[0].msg :
            data.message || '로그인 실패';
        throw new Error(errorMsg);
      }

      const newUser: User = {
        email: data.user.email,
        companyName: data.user.companyName,
        role: data.user.role,
        orgId: data.user.orgId,
        verification_status: data.user.verification_status,
        plan: data.user.plan
      };
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      console.log('[Auth] Logged in with role:', data.user.role);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (companyName: string, email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data.detail === 'string' ? data.detail :
          Array.isArray(data.detail) ? data.detail[0].msg :
            data.message || '회원가입 실패';
        throw new Error(errorMsg);
      }

      await login(email, password);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, isLoading, refreshToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
