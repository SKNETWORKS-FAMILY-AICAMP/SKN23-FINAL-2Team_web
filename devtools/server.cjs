/*
File    : devtools/server.cjs
Author  : 김민정
Create  : 2026-04-21
Description : (Legacy) Node.js/Express 기반 인증 백엔드 및 SSH 터널링 DB 연결 서버

Modification History:
    - 2026-04-21 (김민정) : 초기 인증 API(로그인/로그아웃) 및 SSH 터널링 구현
 */
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const tunnel = require('tunnel-ssh');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- SSH 터널 설정 ---
const sshConfig = {
    username: process.env.SSH_USER,
    host: process.env.SSH_HOST,
    port: parseInt(process.env.SSH_PORT),
    privateKey: fs.readFileSync(process.env.SSH_KEY_PATH),
    dstHost: process.env.DB_HOST,
    dstPort: parseInt(process.env.DB_PORT),
    localHost: '127.0.0.1',
    localPort: 5433 // 로컬에서 가용한 포트로 터널링
};

let dbPool;

// SSH 터널 시작 및 DB 연결
const startServer = () => {
    tunnel(sshConfig, (error, server) => {
        if (error) {
            console.error('SSH 터널 생성 실패:', error);
            return;
        }

        console.log(`SSH 터널 활성화: 127.0.0.1:${sshConfig.localPort} -> ${sshConfig.dstHost}:${sshConfig.dstPort}`);

        // DB 풀 설정 (터널링된 로컬 포트 사용)
        dbPool = new Pool({
            host: '127.0.0.1',
            port: 5433,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`API 서버가 포트 ${PORT}에서 실행 중입니다.`);
        });
    });
};

// --- API Endpoints ---

// 1. 회원가입
app.post('/api/v1/auth/register', async (req, res) => {
    const { company_name, email, password } = req.body;

    try {
        // 이미 가입된 이메일인지 확인
        const existing = await dbPool.query('SELECT * FROM organizations WHERE admin_email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        const orgId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Organization 추가
        await dbPool.query(
            'INSERT INTO organizations (id, company_name, admin_email, password_hash, plan, max_seats, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [orgId, company_name, email, hashedPassword, 'basic', 5, true]
        );

        // 2. License 추가
        const licenseId = crypto.randomUUID();
        const apiKey = `sk-${crypto.randomUUID()}`;
        await dbPool.query(
            'INSERT INTO licenses (id, org_id, api_key, status) VALUES ($1, $2, $3, $4)',
            [licenseId, orgId, apiKey, 'active']
        );

        res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error('회원가입 에러:', err);
        res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
});

// 2. 로그인
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. 기업 관리자 확인
        const orgResult = await dbPool.query('SELECT * FROM organizations WHERE admin_email = $1', [email]);
        const org = orgResult.rows[0];

        if (org) {
            const match = await bcrypt.compare(password, org.password_hash);
            if (match) {
                return res.json({
                    success: true,
                    token: crypto.randomBytes(32).toString('hex'),
                    user: {
                        email: org.admin_email,
                        companyName: org.company_name,
                        role: 'org_admin',
                        org_id: org.id
                    }
                });
            }
        }

        // 2. 시스템 관리자 확인
        const sysResult = await dbPool.query('SELECT * FROM system_admins WHERE email = $1', [email]);
        const sysAdmin = sysResult.rows[0];

        if (sysAdmin) {
            const match = await bcrypt.compare(password, sysAdmin.password_hash);
            if (match) {
                return res.json({
                    success: true,
                    token: crypto.randomBytes(32).toString('hex'),
                    user: {
                        email: sysAdmin.email,
                        role: sysAdmin.role
                    }
                });
            }
        }

        res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    } catch (err) {
        console.error('로그인 에러:', err);
        res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
});

startServer();
