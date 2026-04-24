"""
File    : backend/services/s3_service.py
Author  : 김민정
Create  : 2026-04-23
Description : S3 관련 서비스
"""
import os
import boto3
from datetime import datetime
from fastapi import HTTPException

class S3Service:
    client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "ap-northeast-2")
    )
    BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME", "skn23-final-2team")
    REGION = os.getenv("AWS_REGION", "ap-northeast-2")

    @classmethod
    async def upload_certificate(cls, email: str, file):
        file_ext = file.filename.split(".")[-1]
        s3_key = f"business_regs/{email}_{int(datetime.now().timestamp())}.{file_ext}"
        
        try:
            cls.client.upload_fileobj(
                file.file,
                cls.BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": file.content_type}
            )
            return f"https://{cls.BUCKET_NAME}.s3.{cls.REGION}.amazonaws.com/{s3_key}"
        except Exception as e:
            print(f"[S3 Error] {str(e)}")
            raise HTTPException(status_code=500, detail="S3 업로드 중 오류가 발생했습니다.")

    @classmethod
    def get_presigned_url(cls, s3_url_or_key: str, expires_in: int = 3600):
        """S3 URL 또는 Key를 받아 Pre-signed URL 생성 (보안 조회용)"""
        if not s3_url_or_key:
            return None
        
        # 전체 URL이 들어온 경우 Key만 추출
        s3_key = s3_url_or_key
        prefix = f"https://{cls.BUCKET_NAME}.s3.{cls.REGION}.amazonaws.com/"
        if s3_url_or_key.startswith(prefix):
            s3_key = s3_url_or_key.replace(prefix, "")
        
        try:
            url = cls.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': cls.BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"[S3 Presign Error] {str(e)}")
            return s3_url_or_key

    @classmethod
    async def upload_file(cls, file, folder: str = "documents"):
        """범용 파일 업로드"""
        s3_key = f"{folder}/{int(datetime.now().timestamp())}_{file.filename}"
        
        try:
            cls.client.upload_fileobj(
                file.file,
                cls.BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": file.content_type}
            )
            return f"https://{cls.BUCKET_NAME}.s3.{cls.REGION}.amazonaws.com/{s3_key}"
        except Exception as e:
            print(f"[S3 Upload Error] {str(e)}")
            return None

    @classmethod
    def delete_file(cls, s3_url: str):
        """S3 파일 삭제"""
        if not s3_url: return
        
        s3_key = s3_url
        prefix = f"https://{cls.BUCKET_NAME}.s3.{cls.REGION}.amazonaws.com/"
        if s3_url.startswith(prefix):
            s3_key = s3_url.replace(prefix, "")
            
        try:
            cls.client.delete_object(Bucket=cls.BUCKET_NAME, Key=s3_key)
            return True
        except Exception as e:
            print(f"[S3 Delete Error] {str(e)}")
            return False