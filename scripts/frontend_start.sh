#!/bin/bash
# Frontend 시작 스크립트

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
FRONTEND_DIR="$PROJECT_DIR/services/frontend"
PID_FILE="$PROJECT_DIR/scripts/.frontend.pid"
LOG_FILE="$PROJECT_DIR/scripts/frontend.log"

echo "================================"
echo "Frontend 시작 중..."
echo "================================"

# 기존 프로세스 확인
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  Frontend가 이미 실행 중입니다 (PID: $OLD_PID)"
        echo "먼저 ./scripts/frontend_stop.sh 를 실행하세요."
        exit 1
    else
        echo "이전 PID 파일 정리 중..."
        rm -f "$PID_FILE"
    fi
fi

# Frontend 디렉토리로 이동
cd "$FRONTEND_DIR"

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 설치하세요: https://nodejs.org/"
    exit 1
fi

# npm 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "의존성 설치 중..."
    npm install
fi

# .env.local 파일 생성 (API URL 설정)
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://211.180.253.250:7010
EOF

echo "환경 변수 설정 완료: NEXT_PUBLIC_API_URL=http://211.180.253.250:7010"

# Next.js 빌드 (production 모드를 위해)
if [ ! -d ".next" ]; then
    echo "프로젝트 빌드 중... (첫 실행 시 시간이 걸릴 수 있습니다)"
    npm run build
fi

# Frontend 시작 (0.0.0.0:7020)
echo "Frontend 시작: http://211.180.253.250:7020"

# Development 모드로 시작 (자동 리로드 지원)
nohup npm run dev -- -H 0.0.0.0 -p 7020 \
    > "$LOG_FILE" 2>&1 &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$PID_FILE"

sleep 3

# 프로세스 확인
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo ""
    echo "✅ Frontend 시작 완료!"
    echo "   PID: $FRONTEND_PID"
    echo "   URL: http://211.180.253.250:7020"
    echo "   로그: $LOG_FILE"
    echo ""
    echo "로그 확인: tail -f $LOG_FILE"
    echo ""
    echo "⚠️  주의: 첫 실행 시 빌드에 30-60초 정도 소요될 수 있습니다."
else
    echo ""
    echo "❌ Frontend 시작 실패"
    echo "로그 확인: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
