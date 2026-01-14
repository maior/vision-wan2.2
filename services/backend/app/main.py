"""
FastAPI 백엔드 메인
데이터 품질 및 전처리 대시보드
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import sys
from pathlib import Path

# 프로젝트 루트를 path에 추가
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from app.database import engine, Base, get_db, init_db
from app.api import data, preprocessing, quality, statistics, validation, caption_quality, caption_improvement_demo, training, inference, data_analysis

# 데이터베이스 초기화
init_db()

# FastAPI 앱 생성
app = FastAPI(
    title="Wan2.2 Data Quality Dashboard",
    description="MBC 데이터셋 품질 검증 및 전처리 대시보드",
    version="1.0.0"
)

# CORS 설정 (Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7020",
        "http://211.180.253.250:7020"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(preprocessing.router, prefix="/api/preprocessing", tags=["preprocessing"])
app.include_router(quality.router, prefix="/api/quality", tags=["quality"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
app.include_router(validation.router, prefix="/api/validation", tags=["validation"])
app.include_router(caption_quality.router, prefix="/api/caption-quality", tags=["caption-quality"])
app.include_router(caption_improvement_demo.router, prefix="/api/caption-improvement", tags=["caption-improvement"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(inference.router, prefix="/api/inference", tags=["inference"])
app.include_router(data_analysis.router, prefix="/api/analysis", tags=["analysis"])


@app.get("/")
def read_root():
    return {
        "message": "Wan2.2 Data Quality Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "data": "/api/data",
            "preprocessing": "/api/preprocessing",
            "quality": "/api/quality",
            "statistics": "/api/statistics",
            "docs": "/docs",
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7010, reload=True)
