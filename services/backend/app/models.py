"""
Pydantic 모델 (API 스키마)
"""

from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


# Data Sample Schemas

class DataSampleBase(BaseModel):
    clip_id: str
    media_type: str
    file_path: str
    caption: str
    resolution: str
    length: Optional[str] = None
    category: str
    keyword: str


class DataSampleCreate(DataSampleBase):
    pass


class DataSample(DataSampleBase):
    id: int
    quality_score: float
    has_issues: bool
    issues_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Preprocessing Job Schemas

class PreprocessingJobBase(BaseModel):
    job_type: str


class PreprocessingJobCreate(PreprocessingJobBase):
    pass


class PreprocessingJob(PreprocessingJobBase):
    id: int
    status: str
    total_items: int
    processed_items: int
    failed_items: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Quality Report Schemas

class QualityReportBase(BaseModel):
    report_name: str


class QualityReportCreate(QualityReportBase):
    pass


class QualityReport(QualityReportBase):
    id: int
    total_samples: int
    samples_with_issues: int
    issue_rate: float
    issue_types_json: str
    generated_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas

class Statistic(BaseModel):
    stat_type: str
    stat_key: str
    stat_value: float

    class Config:
        from_attributes = True


# Response Schemas

class DataListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    samples: List[DataSample]


class DashboardStats(BaseModel):
    total_samples: int
    total_images: int
    total_videos: int
    samples_with_issues: int
    issue_rate: float
    avg_quality_score: float
    preprocessing_progress: Optional[float] = 0.0
    training_status: Optional[str] = 'pending'


class PreprocessingProgress(BaseModel):
    job_id: int
    job_type: str
    status: str
    progress: float  # 0-100
    total_items: int
    processed_items: int
    failed_items: int
