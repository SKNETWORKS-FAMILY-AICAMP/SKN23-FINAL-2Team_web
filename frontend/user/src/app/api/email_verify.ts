import { API_BASE_URL } from './client';

export const verifyApi = {
    checkEmail: (email: string) => fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    }),
    sendCode: (email: string) => fetch(`${API_BASE_URL}/auth/send-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    }),
    verifyCode: (email: string, code: string) => fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code })
    }),
    checkCompany: (company_name: string) => fetch(`${API_BASE_URL}/auth/check-company`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name })
    })
};
