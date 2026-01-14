#!/bin/bash
# V100 32GB 단일 GPU 학습 스크립트 (DDP 테스트용)

set -e

echo "===================================="
echo "Wan2.2 LoRA Training on Single V100"
echo "===================================="

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "가상환경 활성화: .venv"
    source .venv/bin/activate
else
    echo "WARNING: 가상환경을 찾을 수 없습니다."
fi

# 설정
export CUDA_VISIBLE_DEVICES=0
export OMP_NUM_THREADS=8

# 체크포인트 디렉토리 (TI2V-5B: V100에 적합한 작은 모델)
CKPT_DIR="./Wan2.2-TI2V-5B"
OUTPUT_DIR="./lora_checkpoints_v100_5B_single"

# 데이터 (클린 데이터셋 사용 - 품질 검증 완료)
TRAIN_CSV="./data_quality_analysis/clean_dataset.csv"
VAL_CSV="./data_quality_analysis_val/clean_dataset.csv"

echo ""
echo "설정:"
echo "  - GPU: 1 × V100 32GB"
echo "  - Checkpoint: $CKPT_DIR"
echo "  - Output: $OUTPUT_DIR"
echo "  - Train CSV: $TRAIN_CSV (172,939 samples)"
echo "  - Val CSV: $VAL_CSV (19,713 samples)"
echo "  - Total: 192,652 samples (Train/Val: 89.8% / 10.2%)"
echo "  - Quality: 98.6%+ clean samples"
echo "  - Batch size: 8 (single GPU, no DDP)"
echo ""

# 체크포인트 확인
if [ ! -d "$CKPT_DIR" ]; then
    echo "ERROR: 체크포인트 디렉토리가 없습니다: $CKPT_DIR"
    echo "모델을 다운로드하세요:"
    echo "  huggingface-cli download Wan-AI/Wan2.2-TI2V-5B --local-dir $CKPT_DIR"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

echo "학습 시작..."
echo ""

# 단일 GPU 학습 실행 (torchrun 없이 직접 실행)
python lora_finetuning/train_lora.py \
    --train_csv "$TRAIN_CSV" \
    --val_csv "$VAL_CSV" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "$OUTPUT_DIR"

echo ""
echo "학습 완료!"
echo "체크포인트: $OUTPUT_DIR"
