# 26.08.04 백엔드 구축 Azure SQL Server (pyodbc) 연동 세션 관리
# 26.08.05 @property를 활용해 DB 동적 접속 URL(DATABASE_URL)을 반환하도록 설정

# 26.08.04 백엔드 구축 .env 환경변수 및 Azure DB 접속 설정

from typing import List, Optional, Union
from urllib.parse import quote_plus
from pydantic import AnyHttpUrl, model_validator
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

    # 26.08.10 로컬(Ollama + Chroma) / Azure 전환 스위치.
    # true면 DB_SERVER를 강제로 localhost로 바꾸고, AI 파이프라인은 Ollama/Chroma를 사용.
    USE_LOCAL: bool = False

    # DB Settings (.env 파일에서 자동으로 읽어옴, USE_LOCAL=true일 땐 DB_SERVER는 무시되고 localhost 사용)
    DB_SERVER: str = "localhost"
    DB_PORT: str = "1433"
    DB_NAME: str = "md_dashboard_local"
    DB_USER: str = "sa"
    DB_PASSWORD: str = ""

    # Azure AI Search & OpenAI Settings (USE_LOCAL=false일 때 필수)
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_KEY: Optional[str] = None
    AZURE_DEPLOYMENT_NAME: Optional[str] = None
    AZURE_AI_SEARCH_ENDPOINT: Optional[str] = None
    AZURE_AI_SEARCH_API_KEY: Optional[str] = None

    # 로컬 AI Settings (USE_LOCAL=true일 때 사용, Ollama는 OpenAI 호환 API를 노출함)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION: str = "policy-documents"

    # 역할별 접근 비밀번호 (CEO/MD/재고담당자)
    ROLE_CEO_PASSWORD: str = "1234"
    ROLE_MD_PASSWORD: str = "0000"
    ROLE_STOCK_PASSWORD: str = "5678"

    @model_validator(mode="after")
    def _check_azure_settings_present(self) -> "Settings":
        if not self.USE_LOCAL:
            missing = [
                name
                for name in (
                    "AZURE_OPENAI_ENDPOINT",
                    "AZURE_OPENAI_KEY",
                    "AZURE_DEPLOYMENT_NAME",
                    "AZURE_AI_SEARCH_ENDPOINT",
                    "AZURE_AI_SEARCH_API_KEY",
                )
                if not getattr(self, name)
            ]
            if missing:
                raise ValueError(
                    f".env에 다음 Azure 설정이 없습니다: {', '.join(missing)} "
                    f"(로컬 개발 시에는 USE_LOCAL=true로 설정하세요)"
                )
        return self

    @property
    def DATABASE_URL(self) -> str:
        driver = "ODBC Driver 17 for SQL Server"
        server = "localhost" if self.USE_LOCAL else self.DB_SERVER

        params = quote_plus(
            f"DRIVER={{{driver}}};"
            f"SERVER={server},{self.DB_PORT};"
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