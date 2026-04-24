/*
File    : src/app/utils/storage.ts
Author  : 김민정
Create  : 2026-04-24
Description : 인증 정보 저장 유틸리티

Modification History:
    - 2026-04-24 (김민정) : 모듈화
*/
const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
};

export const authStorage = {
  getAccessToken: () => localStorage.getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH_TOKEN),
  getUserInfo: () => {
    const user = localStorage.getItem(KEYS.USER_INFO);
    return user ? JSON.parse(user) : null;
  },
  setAuthData: (token: string, refreshToken: string, user: any) => {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.USER_INFO, JSON.stringify(user));
  },
  updateAccessToken: (token: string) => {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },
  updateUserPlan: (planName: string) => {
    const user = authStorage.getUserInfo();
    if (user) {
      localStorage.setItem(KEYS.USER_INFO, JSON.stringify({ ...user, plan: planName }));
    }
  },
  clear: () => {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER_INFO);
  }
};