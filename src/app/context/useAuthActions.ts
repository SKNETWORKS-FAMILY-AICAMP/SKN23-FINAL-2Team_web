/*
File    : src/app/context/useAuthActions.ts
Author  : 김민정
Create  : 2026-04-26
Description : 인증 관련 실제 동작(Action) 로직 분리

Modification History:
    - 2026-04-26 (김민정) : 인증 관련 실제 동작 로직 분리
*/
import { useCallback } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { authStorage } from '../utils/storage';
import { User } from './auth.types';

export const useAuthActions = (
    setUser: (user: User | null) => void,
    setIsAuthenticated: (auth: boolean) => void
) => {

    const login = useCallback(async (email: string, password?: string) => {
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
    }, [setUser, setIsAuthenticated]);

    const logout = useCallback(() => {
        authStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        toast.success('로그아웃 되었습니다.');
    }, [setUser, setIsAuthenticated]);

    const register = useCallback(async (companyName: string, email: string, password: string, certificateFile: File) => {
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
    }, []);

    const verifyEmail = useCallback(async (email: string, code: string) => {
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
    }, [setUser, setIsAuthenticated]);

    return { login, logout, register, verifyEmail };
};
