#!/bin/bash
# 전체 서비스 중지 스크립트 (Backend + Frontend)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================"
echo "🛑 Wan2.2 Data Quality Dashboard 중지"
echo "========================================"
echo ""

# Frontend 중지
echo "1️⃣  Frontend 중지 중..."
bash "$SCRIPT_DIR/frontend_stop.sh"

echo ""

# Backend 중지
echo "2️⃣  Backend 중지 중..."
bash "$SCRIPT_DIR/backend_stop.sh"

echo ""
echo "========================================"
echo "✅ 모든 서비스 중지 완료!"
echo "========================================"
echo ""
