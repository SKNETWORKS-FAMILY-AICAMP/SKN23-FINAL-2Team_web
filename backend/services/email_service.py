"""
File    : backend/services/email_service.py
Author  : Antigravity
Create  : 2026-04-23
Description : SMTP 기반 자동 이메일 발송 서비스 (회원가입, Q&A, 승인 알림 등)
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# 이메일 발송 환경변수
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")

class EmailService:
    @staticmethod
    def _send_smtp_email(receiver_email: str, subject: str, html_content: str) -> tuple[bool, str]:
        """내부용 SMTP 공통 발송 로직"""
        if not SENDER_EMAIL or not APP_PASSWORD:
            print("[EmailService Error] SENDER_EMAIL or APP_PASSWORD not configured.")
            return False, "서버의 이메일 설정이 누락되었습니다."
            
        msg = MIMEMultipart()
        msg['From'] = f"Cadence AI <{SENDER_EMAIL}>"
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))
        
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())
            server.quit()
            return True, "성공"
        except Exception as e:
            print(f"[EmailService Error] {str(e)}")
            return False, f"이메일 발송 실패: {str(e)}"

    @staticmethod
    def send_verification_email(to_email: str, code: str):
        """회원가입 및 비밀번호 재설정 인증 이메일 발송"""
        subject = "[Cadence AI] 보안 인증 코드 안내"
        html_content = f"""
        <html>
        <body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p style="margin-bottom: 30px; font-size: 15px;">안녕하세요. <strong>Cadence AI (AutoCAD Agent)</strong>입니다.</p>
            <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #222;">인증 번호를 입력하고 가입을 진행하세요.</p>
            <p style="margin-bottom: 30px; font-size: 15px;">서비스 이용을 위한 코드는 다음과 같습니다.</p>
            
            <div style="background-color: #f8f9fa; border: 1px solid #eaeaec; border-radius: 8px; padding: 40px 20px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">인증 번호</p>
                <p style="font-size: 42px; font-weight: bold; color: #0071e3; letter-spacing: 16px; margin: 0; padding-left: 16px;">{code}</p>
            </div>
            
            <p style="margin-bottom: 25px; font-size: 15px;">요청하신 페이지에 위 코드를 입력하여 인증을 완료해 주세요.</p>
            <p style="font-size: 13px; color: #888; line-height: 1.7; margin-bottom: 30px;">
                보안을 위해 10분간 유효한 코드입니다.<br>
                본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
            </p>
            <p style="font-size: 15px; font-weight: bold; color: #888; margin: 0;">Cadence AI 드림</p>
        </body>
        </html>
        """
        success, msg = EmailService._send_smtp_email(to_email, subject, html_content)
        if not success:
            raise Exception(msg)
        return True

    @staticmethod
    def send_receipt_email(to_email: str, company_name: str, amount: float, plan_name: str):
        """결제 영수증 이메일 발송"""
        subject = f"[Cadence AI] {plan_name} 결제 영수증"
        html_content = f"""
        <html>
        <body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p style="margin-bottom: 30px; font-size: 15px;">안녕하세요. <strong>Cadence AI (AutoCAD Agent)</strong>입니다.</p>
            <h2 style="color: #0071e3;">결제가 완료되었습니다</h2>
            <p><strong>{company_name}</strong> 님, 서비스를 이용해 주셔서 감사합니다.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>결제 상품:</strong> {plan_name}</p>
            <p><strong>결제 금액:</strong> ₩{amount:,.0f}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 13px; color: #555;">다음 결제일 전까지는 모든 기능을 자유롭게 이용하실 수 있습니다.</p>
        </body>
        </html>
        """
        success, msg = EmailService._send_smtp_email(to_email, subject, html_content)
        if not success:
            raise Exception(msg)
        return True

    @staticmethod
    def send_qna_answer_notification(to_email: str, ticket_title: str):
        """Q&A 답변 등록 알림"""
        subject = "[Cadence AI] 문의하신 내용에 대한 답변이 등록되었습니다."
        html_content = f"""
        <html>
        <body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p style="margin-bottom: 30px; font-size: 15px;">안녕하세요. <strong>Cadence AI (AutoCAD Agent)</strong>입니다.</p>
            <h3 style="color: #0071e3;">Q&A 답변 안내</h3>
            <p>회원님께서 문의하신 <strong>[{ticket_title}]</strong>에 대한 답변이 등록되었습니다.</p>
            <div style="margin-top: 30px;">
                <a href="http://localhost:5173/profile" style="background: #0071e3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">답변 확인하러 가기</a>
            </div>
        </body>
        </html>
        """
        success, msg = EmailService._send_smtp_email(to_email, subject, html_content)
        if not success:
            raise Exception(msg)
        return True

    @staticmethod
    def send_approval_notification(to_email: str, company_name: str, is_approved: bool, reason: Optional[str] = None):
        """계정(사업자등록증) 승인/반려 알림"""
        status_text = "승인" if is_approved else "반려"
        status_color = "#47e266" if is_approved else "#f43f5e"
        
        content = """
            <p>축하합니다! 회원님의 사업자 인증이 성공적으로 완료되었습니다.</p>
            <p>이제 Cadence AI (AutoCAD Agent)의 모든 비즈니스 기능을 무제한으로 이용하실 수 있습니다.</p>
        """ if is_approved else f"""
            <p>안타깝게도 회원님의 사업자 인증이 반려되었습니다.</p>
            <p><strong>반려 사유:</strong> {reason or '서류 미비'}</p>
            <p>증빙 서류를 재정비하여 다시 업로드해 주시기 바랍니다.</p>
        """

        subject = f"[Cadence AI] 계정 승인 심사 결과 안내 ({status_text})"
        html_content = f"""
        <html>
        <body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p style="margin-bottom: 30px; font-size: 15px;">안녕하세요. <strong>Cadence AI (AutoCAD Agent)</strong>입니다.</p>
            <h3 style="color: {status_color};">계정 인증 {status_text} 안내</h3>
            <p>안녕하세요, <strong>{company_name}</strong> 님.</p>
            {content}
            <div style="margin-top: 30px;">
                <a href="http://localhost:5173" style="background: #0071e3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">홈페이지 바로가기</a>
            </div>
        </body>
        </html>
        """
        success, msg = EmailService._send_smtp_email(to_email, subject, html_content)
        if not success:
            raise Exception(msg)
        return True
