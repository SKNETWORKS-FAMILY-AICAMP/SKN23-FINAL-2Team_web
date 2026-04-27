/*
File    : src/app/api/admin.ts
Author  : 김민정
Create  : 2026-04-24
Description : 시스템 관리자 전용 API 호출 함수 고도화 (필터링 및 Q&A 추가)

Modification History:
    - 2026-04-26 (김민정) : qna -> inquiries 파일명 변경 
*/

const BASE_URL = 'http://localhost:8001/api/v1/admin';

export const adminApi = {
    // 가입 승인 대기열
    getPendingApprovals: (token: string) =>
        fetch(`${BASE_URL}/pending-approvals`, { headers: { 'Authorization': `Bearer ${token}` } }),

    // 전체 회원 관리 (검색/필터 추가)
    getOrganizations: (token: string, companyName?: string, plan?: string) => {
        let url = `${BASE_URL}/organizations?`;
        if (companyName) url += `company_name=${encodeURIComponent(companyName)}&`;
        if (plan && plan !== 'all') url += `plan=${plan}&`;
        return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    },

    // 요금제 변경 이력 조회
    getPlanHistory: (token: string, orgId: string) =>
        fetch(`${BASE_URL}/plan-history/${orgId}`, { headers: { 'Authorization': `Bearer ${token}` } }),

    // 기기 관리 (기업별 필터 추가)
    getDevices: (token: string, orgId?: string) => {
        const url = orgId && orgId !== 'all' ? `${BASE_URL}/devices?org_id=${orgId}` : `${BASE_URL}/devices`;
        return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    },

    // 대시보드 요약 통계
    getDashboardStats: (token: string) =>
        fetch(`${BASE_URL}/dashboard-stats`, { headers: { 'Authorization': `Bearer ${token}` } }),

    // 사용량 통계 (기업별 필터)
    getUsageStats: (token: string, start: string, end: string, orgId?: string) => {
        let url = `${BASE_URL}/usage-stats?start_date=${start}&end_date=${end}`;
        if (orgId && orgId !== 'all') url += `&org_id=${orgId}`;
        return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    },

    // 승인/거절 액션
    executeAction: (token: string, endpoint: 'approve' | 'reject', orgId: string, reason?: string) =>
        fetch(`${BASE_URL}/${endpoint}/${orgId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        }),

    // 요금제 수동 변경
    updatePlan: (token: string, orgId: string, plan: string) =>
        fetch(`${BASE_URL}/organizations/${orgId}/plan`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        }),

    // 기기 차단
    blockDevice: (token: string, deviceId: string) =>
        fetch(`${BASE_URL}/devices/${deviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }),

    // Q&A 관리
    getInquiries: (token: string, status?: string) => {
        const url = status ? `${BASE_URL}/tickets?status=${status}` : `${BASE_URL}/tickets`;
        return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    },

    answerTicket: (token: string, ticketId: number, answer: string) =>
        fetch(`${BASE_URL}/tickets/${ticketId}/answer`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer })
        }),

    // 문서 관리 (S3)
    getDocuments: (token: string, category?: string) => {
        const url = category && category !== 'all' ? `${BASE_URL}/documents?category=${encodeURIComponent(category)}` : `${BASE_URL}/documents`;
        return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    },

    uploadDocument: (token: string, file: File, category: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        return fetch(`${BASE_URL}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    },

    deleteDocument: (token: string, docId: string) =>
        fetch(`${BASE_URL}/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
};