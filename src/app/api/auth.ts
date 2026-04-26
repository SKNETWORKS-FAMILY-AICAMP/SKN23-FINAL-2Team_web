/*
File    : src/app/api/auth.ts
Author  : 김민정
Create  : 2026-04-24
Description : 인증 API 모듈

Modification History:
    - 2026-04-24 (김민정) : 모듈화
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경
*/
const BASE_URL = 'http://localhost:8000/api/v1';

export const authApi = {
  login: (payload: object) => 
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  register: (formData: FormData) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: formData,
    }),

  refresh: (refreshToken: string) =>
    fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    }),

  verifyEmail: (payload: object) =>
    fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  requestReset: (email: string) =>
    fetch(`${BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: object) =>
    fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  getCurrentPayment: (token: string) =>
    fetch(`${BASE_URL}/payments/current`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
};