# 26.08.04 백엔드 구축 Azure SQL Server (pyodbc) 연동 세션 관리
# 26.08.05 @property를 활용해 DB 동적 접속 URL(DATABASE_URL)을 반환하도록 설정

# 26.08.04 백엔드 구축 .env 환경변수 및 Azure DB 접속 설정

from typing import List, Union
from urllib.parse import quote_plus
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "MD Dashboard API"
    API_V1_STR: str = "/api/v1"
    
    # Security Settings
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE"  # 실제 운용 시 임의의 긴 문자열로 변경
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8일
    
    # CORS Settings (React/Next.js 프론트엔드 연결용)
    CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # DB Settings (.env 파일에서 자동으로 읽어옴)
    DB_SERVER: str
    DB_PORT: str = "1433"
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    # Azure AI Search & OpenAI Settings (신규 추가)
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_KEY: str
    AZURE_DEPLOYMENT_NAME: str
    AZURE_AI_SEARCH_ENDPOINT: str
    AZURE_AI_SEARCH_API_KEY: str

    @property
    def DATABASE_URL(self) -> str:
        driver = "ODBC Driver 17 for SQL Server"
        
        params = quote_plus(
            f"DRIVER={{{driver}}};"
            f"SERVER={self.DB_SERVER},{self.DB_PORT};"
            f"DATABASE={self.DB_NAME};"
            f"UID={self.DB_USER};"
            f"PWD={self.DB_PASSWORD};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30;"
        )
        return f"mssql+pyodbc:///?odbc_connect={params}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # 기타 정의되지 않은 .env 항목 무시

settings = Settings()