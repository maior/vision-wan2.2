#!/bin/bash
# V100 × 2 병렬 독립 학습 (각 GPU에서 다른 데이터로 동시 학습)

set -e

echo "========================================="
echo "Wan2.2 LoRA Parallel Training on V100×2"
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
echo "  - 학습 방식: 2개 GPU 병렬 독립 학습 (데이터 분할)"
echo "  - GPU 0: 83,953 train samples"
echo "  - GPU 1: 83,953 train samples"
echo "  - Total: 167,906 samples (100% 커버)"
echo "  - Batch size: 4 per GPU"
echo "  - 학습 속도: 단일 GPU 대비 2배 빠름"
echo ""

# 체크포인트 확인
if [ ! -d "$CKPT_DIR" ]; then
    echo "ERROR: 체크포인트 디렉토리가 없습니다: $CKPT_DIR"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "./lora_checkpoints_v100_5B_gpu0"
mkdir -p "./lora_checkpoints_v100_5B_gpu1"

# 기존 로그 삭제
rm -f train_lora_gpu0.log train_lora_gpu1.log

echo "GPU 0, GPU 1 병렬 학습 시작..."
echo ""

# GPU 0 학습 (백그라운드)
CUDA_VISIBLE_DEVICES=0 python lora_finetuning/train_lora.py \
    --train_csv "./data_quality_analysis/clean_dataset_gpu0.csv" \
    --val_csv "./data_quality_analysis_val/clean_dataset_gpu0.csv" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "./lora_checkpoints_v100_5B_gpu0" \
    > train_lora_gpu0.log 2>&1 &

GPU0_PID=$!
echo "✓ GPU 0 학습 시작 (PID: $GPU0_PID)"

# 잠시 대기 (GPU 0이 모델 로드 시작하도록)
sleep 5

# GPU 1 학습 (백그라운드)
CUDA_VISIBLE_DEVICES=1 python lora_finetuning/train_lora.py \
    --train_csv "./data_quality_analysis/clean_dataset_gpu1.csv" \
    --val_csv "./data_quality_analysis_val/clean_dataset_gpu1.csv" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "./lora_checkpoints_v100_5B_gpu1" \
    > train_lora_gpu1.log 2>&1 &

GPU1_PID=$!
echo "✓ GPU 1 학습 시작 (PID: $GPU1_PID)"

echo ""
echo "========================================="
echo "병렬 학습 실행 중..."
echo "  - GPU 0 PID: $GPU0_PID (log: train_lora_gpu0.log)"
echo "  - GPU 1 PID: $GPU1_PID (log: train_lora_gpu1.log)"
echo ""
echo "로그 확인:"
echo "  tail -f train_lora_gpu0.log"
echo "  tail -f train_lora_gpu1.log"
echo ""
echo "GPU 상태 확인:"
echo "  watch -n 1 nvidia-smi"
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
echo "  - GPU 0: ./lora_checkpoints_v100_5B_gpu0"
echo "  - GPU 1: ./lora_checkpoints_v100_5B_gpu1"
echo "========================================="

if [ $GPU0_EXIT -eq 0 ] && [ $GPU1_EXIT -eq 0 ]; then
    exit 0
else
    exit 1
fi
