# 26.08.04 백엔드 구축 
# 26.08.05 Azure SQL Server (pyodbc) 연동 세션 관리

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# config.py의 DATABASE_URL 프로퍼티 활용
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()