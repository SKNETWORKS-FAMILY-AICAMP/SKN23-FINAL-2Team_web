export const verifyApi = {
    checkEmail: (email: string) => fetch('http://localhost:8000/api/v1/auth/check-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    }),
    sendCode: (email: string) => fetch('http://localhost:8000/api/v1/auth/send-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    }),
    verifyCode: (email: string, code: string) => fetch('http://localhost:8000/api/v1/auth/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code })
    }),
    checkCompany: (company_name: string) => fetch('http://localhost:8000/api/v1/auth/check-company', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name })
    })
};
