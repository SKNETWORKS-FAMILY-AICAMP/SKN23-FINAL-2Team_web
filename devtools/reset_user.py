"""
File    : reset_user.py
Author  : 김민정
Create  : 2026-04-22
Description : 특정 사용자의 데이터 및 상태 초기화 스크립트
"""
import sys
from dotenv import load_dotenv
from sqlalchemy import text
from backend.database import engine, server

def reset_user_plan(email: str):
    try:
        with engine.connect() as conn:
            # Update the plan to 'none' for the specific user
            result = conn.execute(
                text("UPDATE organizations SET plan = 'none' WHERE admin_email = :email"),
                {"email": email}
            )
            conn.commit()
            if result.rowcount > 0:
                print(f"Successfully reset plan for {email} to 'none'.")
            else:
                print(f"User {email} not found in database.")
                
    except Exception as e:
        print(f"Error resetting user: {e}")
    finally:
        if server:
            server.stop()

if __name__ == "__main__":
    reset_user_plan("test@naver.com")
