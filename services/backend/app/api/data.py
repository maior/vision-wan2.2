"""
데이터 샘플 관련 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json

from app.database import get_db, DataSample as DBDataSample
from app.models import DataSample, DataListResponse, DataSampleCreate

router = APIRouter()


@router.get("/samples", response_model=DataListResponse)
def get_data_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    media_type: Optional[str] = Query(None),
    has_issues: Optional[bool] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """데이터 샘플 목록 조회 (페이지네이션)"""

    query = db.query(DBDataSample)

    # 필터링
    if media_type:
        query = query.filter(DBDataSample.media_type == media_type)
    if has_issues is not None:
        query = query.filter(DBDataSample.has_issues == has_issues)
    if category:
        query = query.filter(DBDataSample.category == category)

    # 총 개수
    total = query.count()

    # 페이지네이션
    offset = (page - 1) * page_size
    samples = query.offset(offset).limit(page_size).all()

    return DataListResponse(
        total=total,
        page=page,
        page_size=page_size,
        samples=samples
    )


@router.get("/samples/{clip_id}", response_model=DataSample)
def get_data_sample(clip_id: str, db: Session = Depends(get_db)):
    """특정 데이터 샘플 조회"""

    sample = db.query(DBDataSample).filter(DBDataSample.clip_id == clip_id).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    return sample


@router.post("/samples", response_model=DataSample)
def create_data_sample(sample: DataSampleCreate, db: Session = Depends(get_db)):
    """데이터 샘플 추가"""

    # 중복 체크
    existing = db.query(DBDataSample).filter(DBDataSample.clip_id == sample.clip_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sample already exists")

    db_sample = DBDataSample(**sample.dict())
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)

    return db_sample


@router.delete("/samples/{clip_id}")
def delete_data_sample(clip_id: str, db: Session = Depends(get_db)):
    """데이터 샘플 삭제"""

    sample = db.query(DBDataSample).filter(DBDataSample.clip_id == clip_id).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    db.delete(sample)
    db.commit()

    return {"message": "Sample deleted successfully"}


@router.get("/search")
def search_data_samples(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """데이터 샘플 검색 (caption, clip_id, keyword)"""

    results = db.query(DBDataSample).filter(
        (DBDataSample.caption.contains(query)) |
        (DBDataSample.clip_id.contains(query)) |
        (DBDataSample.keyword.contains(query))
    ).limit(50).all()

    return {"total": len(results), "results": results}
