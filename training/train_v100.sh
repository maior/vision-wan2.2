#!/bin/bash
# V100 32GB × 2 학습 스크립트

set -e

echo "================================"
echo "Wan2.2 LoRA Training on V100 × 2"
echo "================================"

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "가상환경 활성화: .venv"
    source .venv/bin/activate
else
    echo "WARNING: 가상환경을 찾을 수 없습니다."
fi

# 설정
# NOTE: CUDA_VISIBLE_DEVICES는 torchrun 전에 설정하면 안됨 (CUDA 초기화 문제 발생)
# torchrun이 자동으로 GPU를 할당함
export OMP_NUM_THREADS=4

# 체크포인트 디렉토리 (TI2V-5B: V100에 적합한 작은 모델)
CKPT_DIR="./Wan2.2-TI2V-5B"
OUTPUT_DIR="./lora_checkpoints_v100_5B"

# 데이터 (클린 데이터셋 사용 - 품질 검증 완료)
TRAIN_CSV="./data_quality_analysis/clean_dataset.csv"
VAL_CSV="./data_quality_analysis_val/clean_dataset.csv"

# 원본 데이터 (사용 안함 - 결함 샘플 포함)
# TRAIN_CSV="./preprocessed_data/all_train.csv"
# VAL_CSV="./preprocessed_data/all_val.csv"

# 테스트용 (오버피팅 체크)
# TRAIN_CSV="./preprocessed_data/test_100.csv"
# VAL_CSV="./preprocessed_data/test_100.csv"

echo ""
echo "설정:"
echo "  - GPUs: 2 × V100 32GB"
echo "  - Checkpoint: $CKPT_DIR"
echo "  - Output: $OUTPUT_DIR"
echo "  - Train CSV: $TRAIN_CSV (172,939 samples)"
echo "  - Val CSV: $VAL_CSV (19,713 samples)"
echo "  - Total: 192,652 samples (Train/Val: 89.8% / 10.2%)"
echo "  - Quality: 98.6%+ clean samples"
echo ""

# 체크포인트 확인
if [ ! -d "$CKPT_DIR" ]; then
    echo "ERROR: 체크포인트 디렉토리가 없습니다: $CKPT_DIR"
    echo "모델을 다운로드하세요:"
    echo "  huggingface-cli download Wan-AI/Wan2.2-T2V-A14B --local-dir $CKPT_DIR"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

echo "학습 시작..."
echo ""

# 학습 실행 (config 파일 없이 CLI 인자로 직접 전달)
torchrun \
    --nproc_per_node=2 \
    --master_port=29500 \
    lora_finetuning/train_lora.py \
    --train_csv "$TRAIN_CSV" \
    --val_csv "$VAL_CSV" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "$OUTPUT_DIR"

echo ""
echo "학습 완료!"
echo "체크포인트: $OUTPUT_DIR"
