#!/bin/bash
# 전체 서비스 시작 스크립트 (Backend + Frontend)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================"
echo "🚀 Wan2.2 Data Quality Dashboard 시작"
echo "========================================"
echo ""

# Backend 시작
echo "1️⃣  Backend 시작 중..."
bash "$SCRIPT_DIR/backend_start.sh"

echo ""
echo "대기 중... (5초)"
sleep 5

# Frontend 시작
echo ""
echo "2️⃣  Frontend 시작 중..."
bash "$SCRIPT_DIR/frontend_start.sh"

echo ""
echo "========================================"
echo "✅ 모든 서비스 시작 완료!"
echo "========================================"
echo ""
echo "📊 대시보드 접속:"
echo "   Frontend: http://211.180.253.250:7020"
echo "   Backend API: http://211.180.253.250:7010"
echo "   API Docs: http://211.180.253.250:7010/docs"
echo ""
echo "📝 로그 확인:"
echo "   Backend: tail -f $SCRIPT_DIR/backend.log"
echo "   Frontend: tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo "🛑 서비스 중지:"
echo "   bash $SCRIPT_DIR/stop_all.sh"
echo ""
