#!/bin/bash
# FastAPI 백엔드 실행 스크립트

cd "$(dirname "$0")"

echo "Starting FastAPI backend on port 7010..."
uvicorn app.main:app --host 0.0.0.0 --port 7010 --reload
