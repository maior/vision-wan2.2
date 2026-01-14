# Wan2.2 Data Quality Dashboard

MBC 데이터셋 품질 검증 및 전처리 과정을 시각화하는 웹 대시보드

## 시스템 구성

```
services/
├── backend/          # FastAPI (포트 7010)
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── api/
│   ├── requirements.txt
│   └── run.sh
└── frontend/         # Next.js (포트 7020)
    ├── app/
    ├── lib/
    ├── package.json
    └── ...
```

## 빠른 시작

### 1. Backend 설치 및 실행

```bash
cd backend

# 가상환경 생성 (선택)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 실행
bash run.sh
# 또는
python -m app.main
```

**Backend URL**: http://localhost:7010
**API Docs**: http://localhost:7010/docs

### 2. Frontend 설치 및 실행

```bash
cd frontend

# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행
npm run dev
# 또는
yarn dev
```

**Frontend URL**: http://localhost:7020

## 주요 기능

### Backend (FastAPI)

#### API 엔드포인트

**데이터 관리** (`/api/data`)
- `GET /api/data/samples` - 데이터 샘플 목록 (페이지네이션)
- `GET /api/data/samples/{clip_id}` - 특정 샘플 조회
- `POST /api/data/samples` - 샘플 추가
- `GET /api/data/search?query=...` - 검색

**전처리 작업** (`/api/preprocessing`)
- `GET /api/preprocessing/jobs` - 작업 목록
- `POST /api/preprocessing/jobs` - 작업 생성
- `GET /api/preprocessing/jobs/{id}/progress` - 진행률

**품질 리포트** (`/api/quality`)
- `GET /api/quality/reports` - 리포트 목록
- `POST /api/quality/reports/generate` - 리포트 생성
- `GET /api/quality/summary` - 품질 요약

**통계** (`/api/statistics`)
- `GET /api/statistics/dashboard` - 대시보드 통계
- `GET /api/statistics/resolution` - 해상도 분포
- `GET /api/statistics/category` - 카테고리 분포
- `GET /api/statistics/caption-length` - Caption 길이 분포

#### 데이터베이스 (SQLite)

- `data_quality.db` (자동 생성)
- 테이블:
  - `data_samples` - 데이터 샘플
  - `preprocessing_jobs` - 전처리 작업
  - `quality_reports` - 품질 리포트
  - `statistics` - 통계 정보

### Frontend (Next.js)

#### 페이지

- `/` - 대시보드 홈 (통계 요약)
- `/data` - 데이터 샘플 목록 및 검색 (TODO)
- `/preprocessing` - 전처리 작업 관리 (TODO)
- `/quality` - 품질 리포트 (TODO)

#### 주요 컴포넌트

- **StatCard** - 통계 카드
- **API Client** (`lib/api.ts`) - Backend API 호출

## 개발 워크플로우

### 1. 데이터 로드

먼저 전처리된 CSV 데이터를 DB에 로드합니다:

```bash
# Backend에서
curl -X POST http://localhost:7010/api/preprocessing/jobs \
  -H "Content-Type: application/json" \
  -d '{"job_type": "metadata_extraction"}'
```

또는 Frontend에서 UI로 실행

### 2. 대시보드 확인

http://localhost:7020 에서 통계 확인

### 3. API 테스트

http://localhost:7010/docs 에서 인터랙티브 API 문서 확인

## 배포

### Backend 배포

```bash
# Gunicorn 설치
pip install gunicorn

# 실행
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:7010
```

### Frontend 배포

```bash
# 빌드
npm run build

# 실행
npm run start
```

## 환경 변수

### Backend

`.env` 파일 생성 (선택):
```
DATABASE_URL=sqlite:///./data_quality.db
CORS_ORIGINS=http://localhost:7020,https://yourdomain.com
```

### Frontend

`.env.local` 파일 생성:
```
NEXT_PUBLIC_API_URL=http://localhost:7010
```

## 문제 해결

### Backend 실행 안됨

```bash
# 의존성 재설치
pip install --upgrade -r requirements.txt

# SQLAlchemy 버전 확인
pip show sqlalchemy
```

### Frontend 빌드 에러

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### CORS 에러

Backend의 `app/main.py`에서 CORS origins 확인:
```python
allow_origins=["http://localhost:7020"]
```

### DB 초기화

```bash
# DB 파일 삭제 후 재시작
rm data_quality.db
python -m app.main
```

## 추가 개발 TODO

### Backend
- [ ] 사용자 인증
- [ ] 파일 업로드 API
- [ ] 품질 검증 실시간 실행
- [ ] WebSocket (실시간 진행률)
- [ ] 배치 작업 스케줄러

### Frontend
- [ ] 데이터 테이블 페이지
- [ ] 검색 및 필터링
- [ ] 차트 시각화 (Recharts)
- [ ] 전처리 작업 모니터링
- [ ] 품질 리포트 상세 페이지
- [ ] 다크 모드

## 라이선스

Apache 2.0 License (Wan2.2와 동일)
