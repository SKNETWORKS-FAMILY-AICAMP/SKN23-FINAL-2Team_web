"""
File    : devtools/inspect_db.py
Author  : 김민정
Create  : 2026-04-21
Description : 데이터베이스 테이블 및 데이터 조회용 디버깅 스크립트
"""
import os
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from backend.database import engine, server

def inspect_db():
    try:
        inspector = inspect(engine)
        
        print("--- All Tables ---")
        tables = inspector.get_table_names()
        print(tables)
        
        for table in tables:
            print(f"\n[Table: {table}]")
            for column in inspector.get_columns(table):
                print(f"  - {column['name']}: {column['type']}")

        if 'organizations' in tables:
            print("\n--- 'organizations' data ---")
            with engine.connect() as conn:
                result = conn.execute(text("SELECT id, company_name, admin_email FROM organizations LIMIT 5"))
                for row in result:
                    print(row)
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if server:
            server.stop()

if __name__ == "__main__":
    inspect_db()
