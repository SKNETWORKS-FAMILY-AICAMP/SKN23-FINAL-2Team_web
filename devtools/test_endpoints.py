"""
File    : devtools/test_endpoints.py
Author  : 김민정
Create  : 2026-04-21
Description : 백엔드 주요 엔드포인트 응답 속도 및 가용성 확인용 스크립트
"""
import requests

def test_keys():
    try:
        response = requests.get("http://localhost:8000/api/v1/keys")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_keys()
