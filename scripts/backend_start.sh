#!/bin/bash
# Backend 시작 스크립트

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKEND_DIR="$PROJECT_DIR/services/backend"
PID_FILE="$PROJECT_DIR/scripts/.backend.pid"
LOG_FILE="$PROJECT_DIR/scripts/backend.log"

echo "================================"
echo "Backend 시작 중..."
echo "================================"

# 기존 프로세스 확인
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  Backend가 이미 실행 중입니다 (PID: $OLD_PID)"
        echo "먼저 ./scripts/backend_stop.sh 를 실행하세요."
        exit 1
    else
        echo "이전 PID 파일 정리 중..."
        rm -f "$PID_FILE"
    fi
fi

# 가상환경 활성화 확인
if [ ! -d "$PROJECT_DIR/.venv" ]; then
    echo "❌ 가상환경이 없습니다: $PROJECT_DIR/.venv"
    echo "먼저 'python3 -m venv .venv'를 실행하세요."
    exit 1
fi

# 백엔드 디렉토리로 이동
cd "$BACKEND_DIR"

# 의존성 확인
echo "의존성 확인 중..."
source "$PROJECT_DIR/.venv/bin/activate"

if ! python -c "import fastapi" 2>/dev/null; then
    echo "FastAPI 설치 중..."
    pip install -r requirements.txt
fi

# 데이터베이스 초기화
echo "데이터베이스 초기화 중..."
python -c "
from app.database import engine, Base
Base.metadata.create_all(bind=engine)
print('✅ 데이터베이스 초기화 완료')
" || echo "⚠️  데이터베이스 초기화 건너뛰기"

# Backend 시작 (0.0.0.0:7010)
echo "Backend 시작: http://211.180.253.250:7010"
nohup python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 7010 \
    --reload \
    > "$LOG_FILE" 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > "$PID_FILE"

sleep 2

# 프로세스 확인
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo ""
    echo "✅ Backend 시작 완료!"
    echo "   PID: $BACKEND_PID"
    echo "   URL: http://211.180.253.250:7010"
    echo "   Docs: http://211.180.253.250:7010/docs"
    echo "   로그: $LOG_FILE"
    echo ""
    echo "로그 확인: tail -f $LOG_FILE"
else
    echo ""
    echo "❌ Backend 시작 실패"
    echo "로그 확인: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
