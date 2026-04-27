/*
File    : src/app/context/auth.types.ts
Author  : 김민정
Create  : 2026-04-26
Description : 인증 관련 타입 및 인터페이스 정의

Modification History:
    - 2026-04-26 (김민정) : 인증 관련 타입 및 인터페이스 초기 구현
*/

export interface User {
  email: string;
  companyName?: string;
  role: string;
  orgId?: string;
  verification_status?: string;
  plan?: string;
  max_seats: number;
}


export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (companyName: string, email: string, password: string, certificateFile:File) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}