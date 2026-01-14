# Wan2.2 Dashboard 서비스 관리 스크립트

이 폴더에는 Backend (FastAPI) 및 Frontend (Next.js) 서비스를 관리하는 스크립트가 포함되어 있습니다.

## 📂 스크립트 목록

### 전체 서비스 관리
- **`start_all.sh`** - Backend와 Frontend를 모두 시작
- **`stop_all.sh`** - Backend와 Frontend를 모두 중지

### Backend 관리 (FastAPI - Port 7010)
- **`backend_start.sh`** - Backend 시작
- **`backend_stop.sh`** - Backend 중지

### Frontend 관리 (Next.js - Port 7020)
- **`frontend_start.sh`** - Frontend 시작
- **`frontend_stop.sh`** - Frontend 중지

## 🚀 빠른 시작

### 모든 서비스 시작
```bash
bash scripts/start_all.sh
```

### 모든 서비스 중지
```bash
bash scripts/stop_all.sh
```

## 📊 접속 URL

서비스 시작 후 다음 URL로 접속할 수 있습니다:

- **Frontend**: http://211.180.253.250:7020
- **Backend API**: http://211.180.253.250:7010
- **API 문서**: http://211.180.253.250:7010/docs

## 📝 로그 확인

### Backend 로그
```bash
tail -f scripts/backend.log
```

### Frontend 로그
```bash
tail -f scripts/frontend.log
```

## 🔧 개별 서비스 관리

### Backend만 시작/중지
```bash
# 시작
bash scripts/backend_start.sh

# 중지
bash scripts/backend_stop.sh
```

### Frontend만 시작/중지
```bash
# 시작
bash scripts/frontend_start.sh

# 중지
bash scripts/frontend_stop.sh
```

## ⚠️ 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 포트 7010 확인 (Backend)
lsof -i :7010

# 포트 7020 확인 (Frontend)
lsof -i :7020

# 프로세스 강제 종료
kill -9 <PID>
```

### 서비스가 시작되지 않는 경우

1. **로그 확인**
   ```bash
   cat scripts/backend.log
   cat scripts/frontend.log
   ```

2. **가상환경 확인**
   ```bash
   source .venv/bin/activate
   python --version
   ```

3. **의존성 재설치**
   ```bash
   # Backend
   cd services/backend
   pip install -r requirements.txt

   # Frontend
   cd services/frontend
   npm install
   ```

### 데이터베이스 초기화

Backend 시작 시 자동으로 데이터베이스가 초기화됩니다.
수동으로 초기화하려면:

```bash
cd services/backend
source ../../.venv/bin/activate
python -c "
from app.database import engine, Base
Base.metadata.create_all(bind=engine)
"
```

## 📋 프로세스 관리

스크립트는 PID 파일을 사용하여 프로세스를 관리합니다:

- `.backend.pid` - Backend 프로세스 ID
- `.frontend.pid` - Frontend 프로세스 ID

## 🔐 보안 참고사항

- 서비스는 `0.0.0.0`에 바인딩되어 외부 접속이 가능합니다
- 프로덕션 환경에서는 방화벽 설정을 확인하세요
- API 엔드포인트에 대한 인증/인가를 추가하는 것이 좋습니다

## 📚 추가 문서

- Backend API 문서: http://211.180.253.250:7010/docs
- Frontend 문서: `services/frontend/README.md`
- Backend 문서: `services/backend/README.md`
