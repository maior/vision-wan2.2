#!/bin/bash
# V100 오버피팅 테스트 (100개 샘플)
# 빠르게 학습이 작동하는지 확인

set -e

echo "========================================"
echo "V100 Overfitting Test (100 samples)"
echo "========================================"

export CUDA_VISIBLE_DEVICES=0,1
export OMP_NUM_THREADS=4

CKPT_DIR="./Wan2.2-T2V-A14B"
OUTPUT_DIR="./lora_checkpoints_v100_test"
TRAIN_CSV="./preprocessed_data/test_100.csv"
VAL_CSV="./preprocessed_data/test_100.csv"

echo ""
echo "테스트 설정:"
echo "  - 데이터: 100개 샘플"
echo "  - 목표: 빠른 오버피팅 (Loss 감소 확인)"
echo "  - 예상 시간: ~30-60분"
echo ""

mkdir -p "$OUTPUT_DIR"

# 학습 실행 (간단한 파라미터)
python lora_finetuning/train_lora.py \
    --train_csv "$TRAIN_CSV" \
    --val_csv "$VAL_CSV" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "$OUTPUT_DIR" \
    --num_epochs 5 \
    --batch_size 1 \
    --gradient_accumulation_steps 4 \
    --learning_rate 1e-4 \
    --save_steps 50 \
    --eval_steps 50 \
    --logging_steps 5

echo ""
echo "테스트 완료!"
echo ""
echo "확인 사항:"
echo "  1. Loss가 감소했는가?"
echo "  2. GPU 메모리 사용량 (nvidia-smi)"
echo "  3. 체크포인트 저장 확인"
echo ""
echo "로그: $OUTPUT_DIR/train.log"
