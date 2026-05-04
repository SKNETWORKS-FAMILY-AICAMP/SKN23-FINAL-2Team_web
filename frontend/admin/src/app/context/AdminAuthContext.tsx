import React, { createContext, useContext, useState } from 'react';

const ADMIN_TOKEN_KEY = 'admin_token';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => !!localStorage.getItem(ADMIN_TOKEN_KEY)
  );

  const adminLogin = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (data?.success && data?.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setIsAdminAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: data?.detail || data?.message || 'PIN이 올바르지 않습니다.' };
    } catch (err) {
      console.error('[Admin Auth] Login Error:', err);
      return { success: false, message: '서버 연결에 실패했습니다.' };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
};

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
