# 웹 대시보드 설정 완료! 🎉

## ✅ 생성된 파일

### 서비스 관리 스크립트 (`scripts/`)
```
scripts/
├── backend_start.sh       # Backend 시작
├── backend_stop.sh        # Backend 중지
├── frontend_start.sh      # Frontend 시작
├── frontend_stop.sh       # Frontend 중지
├── start_all.sh           # 전체 서비스 시작
├── stop_all.sh            # 전체 서비스 중지
└── README.md              # 스크립트 사용 설명서
```

### 서비스 구조
```
services/
├── backend/               # FastAPI Backend (포트 7010)
│   ├── app/
│   │   ├── main.py       # FastAPI 앱 진입점
│   │   ├── database.py   # SQLite 데이터베이스
│   │   └── api/          # REST API 엔드포인트
│   └── requirements.txt
│
└── frontend/              # Next.js Frontend (포트 7020)
    ├── app/
    ├── components/
    ├── lib/
    └── package.json
```

## 🚀 빠른 시작 가이드

### 1. 모든 서비스 시작

```bash
cd /home/maiordba/projects/vision/Wan2.2
bash scripts/start_all.sh
```

**예상 소요 시간**:
- Backend: ~5초
- Frontend: ~30-60초 (첫 실행 시 빌드 필요)

### 2. 대시보드 접속

서비스가 시작되면 다음 URL로 접속:

- **🎨 Frontend 대시보드**: http://211.180.253.250:7020
- **📡 Backend API**: http://211.180.253.250:7010
- **📚 API 문서**: http://211.180.253.250:7010/docs

### 3. 서비스 중지

```bash
bash scripts/stop_all.sh
```

## 📊 대시보드 기능

### 메인 대시보드 (/)
- **전체 통계**: 총 샘플 수, 품질 점수, 이슈 개수
- **해상도 분포**: 비디오/이미지 해상도 차트
- **카테고리 분포**: 데이터 카테고리별 분포

### API 엔드포인트

#### 데이터 관리
- `GET /api/data/samples` - 샘플 목록 조회 (페이지네이션)
- `GET /api/data/samples/{clip_id}` - 특정 샘플 조회
- `POST /api/data/samples` - 새 샘플 추가
- `GET /api/data/search?q={query}` - 검색

#### 전처리 작업
- `POST /api/preprocessing/start` - 전처리 시작
- `GET /api/preprocessing/jobs` - 작업 목록
- `GET /api/preprocessing/jobs/{job_id}` - 작업 상태

#### 품질 검증
- `POST /api/quality/validate` - 품질 검증 실행
- `GET /api/quality/reports` - 검증 리포트 목록

#### 통계
- `GET /api/statistics/dashboard` - 대시보드 통계
- `GET /api/statistics/resolutions` - 해상도 분포
- `GET /api/statistics/categories` - 카테고리 분포

## 🔧 고급 사용법

### 개별 서비스 관리

#### Backend만 시작/중지
```bash
# 시작
bash scripts/backend_start.sh

# 중지
bash scripts/backend_stop.sh
```

#### Frontend만 시작/중지
```bash
# 시작
bash scripts/frontend_start.sh

# 중지
bash scripts/frontend_stop.sh
```

### 로그 모니터링

```bash
# Backend 로그
tail -f scripts/backend.log

# Frontend 로그
tail -f scripts/frontend.log

# 실시간 모니터링 (두 개 창에서)
# 창 1
tail -f scripts/backend.log
# 창 2
tail -f scripts/frontend.log
```

### 프로세스 상태 확인

```bash
# 실행 중인 프로세스 확인
ps aux | grep -E "uvicorn|next"

# 포트 사용 확인
lsof -i :7010  # Backend
lsof -i :7020  # Frontend
```

## ⚠️ 문제 해결

### 1. Frontend가 접속되지 않는 경우

**증상**: http://211.180.253.250:7020 접속 불가

**해결 방법**:
```bash
# 로그 확인
cat scripts/frontend.log

# 빌드 오류가 있는 경우
cd services/frontend
npm install
npm run build

# 재시작
bash scripts/frontend_stop.sh
bash scripts/frontend_start.sh
```

### 2. Backend API 오류

**증상**: API 호출 시 500 에러

**해결 방법**:
```bash
# 로그 확인
cat scripts/backend.log

# 데이터베이스 재초기화
cd services/backend
source ../../.venv/bin/activate
python -c "
from app.database import engine, Base
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
"

# 재시작
bash scripts/backend_stop.sh
bash scripts/backend_start.sh
```

### 3. 포트가 이미 사용 중인 경우

```bash
# 7010 포트 확인 및 종료
lsof -i :7010
kill -9 <PID>

# 7020 포트 확인 및 종료
lsof -i :7020
kill -9 <PID>

# 또는 stop 스크립트 사용
bash scripts/stop_all.sh
```

### 4. 가상환경 문제

```bash
# 가상환경 재생성
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r services/backend/requirements.txt
```

## 📝 데이터베이스

### 위치
`services/backend/data_quality.db`

### 테이블 구조
- `data_samples` - 데이터 샘플 (clip_id, media_type, caption, etc.)
- `preprocessing_jobs` - 전처리 작업 기록
- `quality_reports` - 품질 검증 리포트
- `statistics` - 통계 데이터

### 직접 접근
```bash
cd services/backend
sqlite3 data_quality.db

# SQLite 명령어
.tables           # 테이블 목록
.schema           # 스키마 확인
SELECT * FROM data_samples LIMIT 10;
```

## 🌐 네트워크 설정

### 내부 접속
- Backend: http://localhost:7010
- Frontend: http://localhost:7020

### 외부 접속
- Backend: http://211.180.253.250:7010
- Frontend: http://211.180.253.250:7020

### CORS 설정
Backend는 다음 origin을 허용합니다:
- http://localhost:7020
- http://211.180.253.250:7020

추가 origin이 필요한 경우 `services/backend/app/main.py` 수정:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7020",
        "http://211.180.253.250:7020",
        "http://your-new-origin:port"  # 추가
    ],
    ...
)
```

## 🔐 보안 고려사항

### 현재 설정
- **인증**: 없음 (개발 환경)
- **HTTPS**: 없음
- **외부 접속**: 허용 (0.0.0.0 바인딩)

### 프로덕션 권장사항
1. **인증 추가**: JWT 또는 OAuth2
2. **HTTPS 설정**: Let's Encrypt 인증서
3. **방화벽 설정**: 필요한 포트만 개방
4. **환경 변수**: 민감한 정보는 .env 파일로 관리

## 📚 다음 단계

### 1. 데이터 전처리 실행
```bash
# API를 통해 전처리 시작
curl -X POST http://211.180.253.250:7010/api/preprocessing/start \
  -H "Content-Type: application/json" \
  -d '{
    "source_dir": "/home/devfit2/mbc_json",
    "output_dir": "./preprocessed_data"
  }'
```

### 2. 품질 검증 실행
```bash
python validate_data_quality.py --sample_size 10
```

### 3. 대시보드에서 데이터 확인
http://211.180.253.250:7020

### 4. V100 학습 준비
```bash
# 오버피팅 테스트
bash train_v100_test.sh

# 전체 학습
bash train_v100.sh
```

## 📖 참고 문서

- `scripts/README.md` - 스크립트 상세 설명
- `services/README.md` - 서비스 아키텍처
- `V100_NEXT_STEPS.md` - V100 학습 가이드
- `FINAL_SUMMARY_V100.md` - 전체 프로젝트 요약

## 💡 팁

### 자동 시작 설정 (systemd)
프로덕션 환경에서는 systemd 서비스로 등록하면 재부팅 후 자동 시작됩니다:

```bash
# /etc/systemd/system/wan-dashboard.service
[Unit]
Description=Wan2.2 Dashboard Service
After=network.target

[Service]
Type=forking
User=maiordba
WorkingDirectory=/home/maiordba/projects/vision/Wan2.2
ExecStart=/bin/bash /home/maiordba/projects/vision/Wan2.2/scripts/start_all.sh
ExecStop=/bin/bash /home/maiordba/projects/vision/Wan2.2/scripts/stop_all.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 🎯 요약

```bash
# 1. 서비스 시작
bash scripts/start_all.sh

# 2. 대시보드 접속
# http://211.180.253.250:7020

# 3. 로그 확인
tail -f scripts/backend.log
tail -f scripts/frontend.log

# 4. 서비스 중지
bash scripts/stop_all.sh
```

**모든 준비가 완료되었습니다! 🚀**
