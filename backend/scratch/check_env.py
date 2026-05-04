import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("dotenv not found")

print(f"SECRET_KEY from env: {os.getenv('SECRET_KEY')}")
print(f"ADMIN_PIN from env: {os.getenv('ADMIN_PIN')}")
