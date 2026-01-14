"""
SQLite 데이터베이스 설정
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./data_quality.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Database Models

class DataSample(Base):
    """데이터 샘플"""
    __tablename__ = "data_samples"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(String, unique=True, index=True)
    media_type = Column(String)  # 'image' or 'video'
    file_path = Column(String)
    caption = Column(Text)
    resolution = Column(String)
    length = Column(String, nullable=True)  # 비디오만
    category = Column(String)
    keyword = Column(String)

    # 품질 관련
    quality_score = Column(Float, default=0.0)
    has_issues = Column(Boolean, default=False)
    issues_json = Column(Text, nullable=True)  # JSON 문자열

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PreprocessingJob(Base):
    """전처리 작업"""
    __tablename__ = "preprocessing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String)  # 'metadata_extraction', 'quality_check', 'resize'
    status = Column(String)  # 'pending', 'running', 'completed', 'failed'
    total_items = Column(Integer, default=0)
    processed_items = Column(Integer, default=0)
    failed_items = Column(Integer, default=0)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class QualityReport(Base):
    """품질 리포트"""
    __tablename__ = "quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String)
    total_samples = Column(Integer)
    samples_with_issues = Column(Integer)
    issue_rate = Column(Float)

    # 이슈 유형별 카운트 (JSON)
    issue_types_json = Column(Text)

    generated_at = Column(DateTime, default=datetime.utcnow)


class Statistics(Base):
    """통계 정보"""
    __tablename__ = "statistics"

    id = Column(Integer, primary_key=True, index=True)
    stat_type = Column(String)  # 'resolution', 'category', 'caption_length', etc.
    stat_key = Column(String)
    stat_value = Column(Float)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database initialization

def init_db():
    """데이터베이스 초기화"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """데이터베이스 세션 가져오기"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
