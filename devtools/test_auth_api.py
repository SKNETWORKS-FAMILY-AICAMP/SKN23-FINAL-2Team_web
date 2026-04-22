"""
File    : devtools/test_auth_api.py
Author  : 김민정
Create  : 2026-04-21
Description : 인증 관련 API(로그인, 가입) 기능 테스트 스크립트
"""
import requests
import json

base_url = "http://localhost:8000/api/v1/auth"

def test_register():
    url = f"{base_url}/register"
    data = {
        "company_name": "Test Company",
        "admin_email": "test_register@skn23.local",
        "password": "password123"
    }
    response = requests.post(url, json=data)
    print("Register Response Status:", response.status_code)
    print("Register Response Body:", response.json())
    return response.status_code == 200

def test_login():
    url = f"{base_url}/login"
    data = {
        "email": "test_register@skn23.local",
        "password": "password123"
    }
    response = requests.post(url, json=data)
    print("Login Response Status:", response.status_code)
    print("Login Response Body:", response.json())
    return response.status_code == 200

if __name__ == "__main__":
    if test_register():
        test_login()
    else:
        # Try login anyway in case it was already registered
        test_login()
