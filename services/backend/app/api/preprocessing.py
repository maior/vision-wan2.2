"""
전처리 작업 관련 API
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import sys
from pathlib import Path

# 프로젝트 루트 추가
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from app.database import get_db, PreprocessingJob as DBJob, DataSample as DBDataSample
from app.models import PreprocessingJob, PreprocessingJobCreate, PreprocessingProgress

router = APIRouter()


def run_metadata_extraction(job_id: int, db: Session):
    """메타데이터 추출 작업 실행"""
    import pandas as pd

    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    job.status = "running"
    job.started_at = datetime.utcnow()
    db.commit()

    try:
        # CSV에서 데이터 로드
        df = pd.read_csv('preprocessed_data/all_data.csv')
        job.total_items = len(df)
        db.commit()

        # 데이터베이스에 삽입
        for idx, row in df.iterrows():
            # 중복 체크
            existing = db.query(DBDataSample).filter(DBDataSample.clip_id == row['clip_id']).first()
            if existing:
                continue

            sample = DBDataSample(
                clip_id=row['clip_id'],
                media_type=row['media_type'],
                file_path=row['file_path'],
                caption=row['caption'],
                resolution=row['resolution'],
                length=row['length'] if row['length'] else None,
                category=row['category'],
                keyword=row['keyword'],
            )

            db.add(sample)
            job.processed_items += 1

            if (idx + 1) % 100 == 0:
                db.commit()

        db.commit()

        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        job.completed_at = datetime.utcnow()
        db.commit()


@router.get("/jobs", response_model=List[PreprocessingJob])
def get_preprocessing_jobs(db: Session = Depends(get_db)):
    """전처리 작업 목록 조회"""
    jobs = db.query(DBJob).order_by(DBJob.created_at.desc()).all()
    return jobs


@router.get("/jobs/{job_id}", response_model=PreprocessingJob)
def get_preprocessing_job(job_id: int, db: Session = Depends(get_db)):
    """특정 전처리 작업 조회"""
    job = db.query(DBJob).filter(DBJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


@router.get("/jobs/{job_id}/progress", response_model=PreprocessingProgress)
def get_job_progress(job_id: int, db: Session = Depends(get_db)):
    """작업 진행률 조회"""
    job = db.query(DBJob).filter(DBJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    progress = 0.0
    if job.total_items > 0:
        progress = (job.processed_items / job.total_items) * 100

    return PreprocessingProgress(
        job_id=job.id,
        job_type=job.job_type,
        status=job.status,
        progress=progress,
        total_items=job.total_items,
        processed_items=job.processed_items,
        failed_items=job.failed_items,
    )


@router.post("/jobs", response_model=PreprocessingJob)
def create_preprocessing_job(
    job: PreprocessingJobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """전처리 작업 생성 및 실행"""

    # 작업 생성
    db_job = DBJob(
        job_type=job.job_type,
        status="pending",
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # 백그라운드로 실행
    if job.job_type == "metadata_extraction":
        background_tasks.add_task(run_metadata_extraction, db_job.id, db)
    else:
        db_job.status = "failed"
        db_job.error_message = f"Unknown job type: {job.job_type}"
        db.commit()

    return db_job


@router.delete("/jobs/{job_id}")
def delete_preprocessing_job(job_id: int, db: Session = Depends(get_db)):
    """전처리 작업 삭제"""
    job = db.query(DBJob).filter(DBJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "running":
        raise HTTPException(status_code=400, detail="Cannot delete running job")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}


@router.get("/status")
def get_preprocessing_status():
    """전처리 완료 상태 조회"""
    import os
    import csv

    csv_path = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv"
    video_dir = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data/converted_720p"
    image_dir = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_1280x720"
    model_dir = "/home/maiordba/projects/vision/Wan2.2/Wan2.2-T2V-A14B"

    # CSV 통계
    total_data = 0
    video_count = 0
    image_count = 0

    if os.path.exists(csv_path):
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_data += 1
                if row['media_type'] == 'video':
                    video_count += 1
                elif row['media_type'] == 'image':
                    image_count += 1

    # 전처리 완료 파일 수
    video_processed = 0
    image_processed = 0

    if os.path.exists(video_dir):
        video_processed = sum(1 for _ in Path(video_dir).rglob('*.mp4'))

    if os.path.exists(image_dir):
        image_processed = sum(1 for _ in Path(image_dir).rglob('*.png'))

    # 모델 다운로드 상태
    model_downloaded = os.path.exists(model_dir) and os.path.isdir(model_dir)
    model_files = 0
    if model_downloaded:
        model_files = len(list(Path(model_dir).rglob('*.*')))

    return {
        "csv_updated": os.path.exists(csv_path + ".backup"),
        "total_data": total_data,
        "video": {
            "total": video_count,
            "processed": video_processed,
            "progress": round((video_processed / video_count * 100) if video_count > 0 else 0, 1)
        },
        "image": {
            "total": image_count,
            "processed": image_processed,
            "progress": round((image_processed / image_count * 100) if image_count > 0 else 0, 1)
        },
        "model": {
            "downloaded": model_downloaded,
            "files": model_files,
            "path": model_dir
        },
        "ready_for_training": (
            video_processed > 0 and
            image_processed > 0 and
            model_downloaded and
            model_files > 10
        )
    }
