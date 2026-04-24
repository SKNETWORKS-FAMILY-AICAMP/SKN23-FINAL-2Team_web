"""
File    : backend/email_service.py
Author  : Antigravity
Create  : 2026-04-23
Description : Resend API를 이용한 자동 이메일 발송 서비스 (회원가입, 결제, Q&A, 승인 알림 등)
Modification History:
    - 2026-04-23 (김민정) : 초기 생성
    - 2026-04-24 (김민정) : 결제 영수증 이메일 발송 기능 추가   

"""
import os
import resend
from typing import Optional

# API 키 설정
resend.api_key = os.getenv("RESEND_API_KEY")

class EmailService:
    @staticmethod
    def send_verification_email(to_email: str, code: str):
        """회원가입 및 비밀번호 재설정 인증 이메일 발송"""
        params = {
            "from": "Cadence AI <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "[Cadence AI] 보안 인증 코드 안내",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0071e3;">Cadence AI</h2>
                    <p>안녕하세요. 보안을 위해 아래 인증 코드를 입력해주세요.</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
                        {code}
                    </div>
                    <p style="font-size: 12px; color: #888;">이 코드는 10분간 유효합니다. 만약 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
                </div>
            """
        }
        return resend.Emails.send(params)

    @staticmethod
    def send_receipt_email(to_email: str, company_name: str, amount: float, plan_name: str):
        """결제 영수증 이메일 발송"""
        params = {
            "from": "Cadence AI <billing@resend.dev>",
            "to": [to_email],
            "subject": f"[Cadence AI] {plan_name} 결제 영수증",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0071e3;">결제가 완료되었습니다</h2>
                    <p><strong>{company_name}</strong> 님, Cadence AI 서비스를 이용해 주셔서 감사합니다.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>결제 상품:</strong> {plan_name}</p>
                    <p><strong>결제 금액:</strong> ₩{amount:,.0f}</p>
                    <p><strong>결제 일시:</strong> {os.popen('date /t').read().strip()}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 13px; color: #555;">다음 결제일 전까지는 대시보드에서 모든 기능을 자유롭게 이용하실 수 있습니다.</p>
                </div>
            """
        }
        return resend.Emails.send(params)

    @staticmethod
    def send_qna_answer_notification(to_email: str, ticket_title: str):
        """Q&A 답변 등록 알림"""
        params = {
            "from": "Cadence AI <support@resend.dev>",
            "to": [to_email],
            "subject": "[Cadence AI] 문의하신 내용에 대한 답변이 등록되었습니다.",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h3 style="color: #0071e3;">Q&A 답변 안내</h3>
                    <p>회원님께서 문의하신 <strong>[{ticket_title}]</strong>에 대한 답변이 등록되었습니다.</p>
                    <p>지금 바로 홈페이지의 [마이페이지 > 나의 문의]에서 확인하실 수 있습니다.</p>
                    <div style="margin-top: 30px;">
                        <a href="http://localhost:5173/profile" style="background: #0071e3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">답변 확인하러 가기</a>
                    </div>
                </div>
            """
        }
        return resend.Emails.send(params)

    @staticmethod
    def send_approval_notification(to_email: str, company_name: str, is_approved: bool, reason: Optional[str] = None):
        """계정(사업자등록증) 승인/반려 알림"""
        status_text = "승인" if is_approved else "반려"
        status_color = "#47e266" if is_approved else "#f43f5e"
        
        content = """
            <p>축하합니다! 회원님의 사업자 인증이 성공적으로 완료되었습니다.</p>
            <p>이제 Cadence AI의 모든 비즈니스 기능을 무제한으로 이용하실 수 있습니다.</p>
        """ if is_approved else f"""
            <p>안타깝게도 회원님의 사업자 인증이 반려되었습니다.</p>
            <p><strong>반려 사유:</strong> {reason or '서류 미비'}</p>
            <p>증빙 서류를 재정비하여 마이페이지에서 다시 업로드해 주시기 바랍니다.</p>
        """

        params = {
            "from": "Cadence AI <admin@resend.dev>",
            "to": [to_email],
            "subject": f"[Cadence AI] 계정 승인 심사 결과 안내 ({status_text})",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h3 style="color: {status_color}; text-align: center;">계정 인증 {status_text} 안내</h3>
                    <p>안녕하세요, <strong>{company_name}</strong> 님.</p>
                    {content}
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="http://localhost:5173" style="background: #0071e3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">홈페이지 바로가기</a>
                    </div>
                </div>
            """
        }
        return resend.Emails.send(params)
