"""
품질 리포트 관련 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import json

from app.database import get_db, QualityReport as DBReport, DataSample as DBDataSample
from app.models import QualityReport, QualityReportCreate

router = APIRouter()


@router.get("/reports", response_model=List[QualityReport])
def get_quality_reports(db: Session = Depends(get_db)):
    """품질 리포트 목록 조회"""
    reports = db.query(DBReport).order_by(DBReport.generated_at.desc()).all()
    return reports


@router.get("/reports/{report_id}", response_model=QualityReport)
def get_quality_report(report_id: int, db: Session = Depends(get_db)):
    """특정 품질 리포트 조회"""
    report = db.query(DBReport).filter(DBReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.post("/reports/generate", response_model=QualityReport)
def generate_quality_report(report: QualityReportCreate, db: Session = Depends(get_db)):
    """품질 리포트 생성"""

    # 통계 계산
    total_samples = db.query(DBDataSample).count()
    samples_with_issues = db.query(DBDataSample).filter(DBDataSample.has_issues == True).count()

    issue_rate = 0.0
    if total_samples > 0:
        issue_rate = (samples_with_issues / total_samples) * 100

    # 이슈 유형별 카운트 (임시)
    issue_types = {
        "caption": 0,
        "metadata": 0,
        "file": 0,
        "stt": 0,
    }

    # 리포트 생성
    db_report = DBReport(
        report_name=report.report_name,
        total_samples=total_samples,
        samples_with_issues=samples_with_issues,
        issue_rate=issue_rate,
        issue_types_json=json.dumps(issue_types),
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return db_report


@router.get("/summary")
def get_quality_summary(db: Session = Depends(get_db)):
    """품질 요약 통계"""

    total_samples = db.query(DBDataSample).count()
    samples_with_issues = db.query(DBDataSample).filter(DBDataSample.has_issues == True).count()

    avg_quality_score = db.query(func.avg(DBDataSample.quality_score)).scalar() or 0.0

    issue_rate = 0.0
    if total_samples > 0:
        issue_rate = (samples_with_issues / total_samples) * 100

    return {
        "total_samples": total_samples,
        "samples_with_issues": samples_with_issues,
        "issue_rate": issue_rate,
        "avg_quality_score": avg_quality_score,
    }
