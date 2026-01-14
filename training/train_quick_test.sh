#!/bin/bash
# 24시간 테스트 학습 스크립트 (5,000 샘플)

set -e

echo "========================================="
echo "Wan2.2 LoRA Quick Test (24h)"
echo "========================================="

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "가상환경 활성화: .venv"
    source .venv/bin/activate
else
    echo "ERROR: 가상환경을 찾을 수 없습니다."
    exit 1
fi

export OMP_NUM_THREADS=8

# 체크포인트 디렉토리
CKPT_DIR="./Wan2.2-TI2V-5B"

echo ""
echo "설정:"
echo "  - 테스트 모드: 5,000 train samples (2,500 per GPU)"
echo "  - Batch size: 2 per GPU"
echo "  - Expected time: 10-12 hours"
echo "  - Backend API: http://localhost:7010/api/training"
echo ""

# 체크포인트 확인
if [ ! -d "$CKPT_DIR" ]; then
    echo "ERROR: 체크포인트 디렉토리가 없습니다: $CKPT_DIR"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "./lora_checkpoints_quick_gpu0"
mkdir -p "./lora_checkpoints_quick_gpu1"
mkdir -p "./training_logs"

# 기존 로그 삭제
rm -f train_lora_gpu0.log train_lora_gpu1.log
rm -f ./training_logs/*.json

echo "GPU 0, GPU 1 병렬 학습 시작..."
echo ""

# GPU 0 학습 (백그라운드)
CUDA_VISIBLE_DEVICES=0 python lora_finetuning/train_lora.py \
    --train_csv "./data_quality_analysis/quick_train_gpu0.csv" \
    --val_csv "./data_quality_analysis_val/quick_val_gpu0.csv" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "./lora_checkpoints_quick_gpu0" \
    > train_lora_gpu0.log 2>&1 &

GPU0_PID=$!
echo "✓ GPU 0 학습 시작 (PID: $GPU0_PID)"

# GPU 0 모델 로딩 대기 (약 2.5분)
echo "⏳ GPU 0 모델 로딩 대기 중... (150초)"
sleep 150

# GPU 1 학습 (백그라운드)
CUDA_VISIBLE_DEVICES=1 python lora_finetuning/train_lora.py \
    --train_csv "./data_quality_analysis/quick_train_gpu1.csv" \
    --val_csv "./data_quality_analysis_val/quick_val_gpu1.csv" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "./lora_checkpoints_quick_gpu1" \
    > train_lora_gpu1.log 2>&1 &

GPU1_PID=$!
echo "✓ GPU 1 학습 시작 (PID: $GPU1_PID)"

# Backend API는 이미 services/backend에서 실행 중
# 별도 대시보드 서버 불필요

echo ""
echo "========================================="
echo "24시간 테스트 학습 실행 중!"
echo "  - GPU 0 PID: $GPU0_PID"
echo "  - GPU 1 PID: $GPU1_PID"
echo ""
echo "📊 모니터링:"
echo "  - Backend API: http://localhost:7010/api/training/status"
echo "  - Frontend: http://localhost:7020"
echo ""
echo "로그 확인:"
echo "  tail -f train_lora_gpu0.log"
echo "  tail -f train_lora_gpu1.log"
echo "========================================="
echo ""

# 프로세스 대기
wait $GPU0_PID
GPU0_EXIT=$?
wait $GPU1_PID
GPU1_EXIT=$?

echo ""
echo "========================================="
echo "학습 완료!"
echo "  - GPU 0 exit code: $GPU0_EXIT"
echo "  - GPU 1 exit code: $GPU1_EXIT"
echo ""
echo "체크포인트:"
echo "  - GPU 0: ./lora_checkpoints_quick_gpu0"
echo "  - GPU 1: ./lora_checkpoints_quick_gpu1"
echo "========================================="

if [ $GPU0_EXIT -eq 0 ] && [ $GPU1_EXIT -eq 0 ]; then
    exit 0
else
    exit 1
fi
