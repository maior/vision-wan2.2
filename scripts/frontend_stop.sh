#!/bin/bash
# Frontend 중지 스크립트

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
PID_FILE="$PROJECT_DIR/scripts/.frontend.pid"

echo "================================"
echo "Frontend 중지 중..."
echo "================================"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  실행 중인 Frontend가 없습니다."

    # Next.js 프로세스 찾기
    PIDS=$(pgrep -f "next.*7020" || true)
    if [ -n "$PIDS" ]; then
        echo "포트 7020에서 실행 중인 프로세스를 발견했습니다:"
        echo "$PIDS"
        echo "이 프로세스들을 종료하시겠습니까? (y/n)"
        read -r response
        if [ "$response" = "y" ]; then
            echo "$PIDS" | xargs kill -15
            echo "✅ 프로세스 종료 완료"
        fi
    fi
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "Frontend 종료 중 (PID: $PID)..."

    # npm/node 프로세스 트리 전체 종료
    pkill -P $PID || true
    kill -15 $PID

    # 프로세스 종료 대기 (최대 10초)
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # 강제 종료가 필요한 경우
    if ps -p $PID > /dev/null 2>&1; then
        echo "강제 종료 중..."
        pkill -9 -P $PID || true
        kill -9 $PID
    fi

    echo "✅ Frontend 중지 완료"
else
    echo "⚠️  프로세스가 이미 종료되었습니다 (PID: $PID)"
fi

rm -f "$PID_FILE"
echo ""
echo "Frontend가 완전히 중지되었습니다."
