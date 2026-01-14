# LoRA Fine-tuning 설정 가이드

## 완료된 작업 요약

### 1. 데이터 전처리 ✅

**생성된 파일:**
- `preprocess_mbc_data.py` - 메타데이터 추출 및 CSV 생성
- `analyze_preprocessed_data.py` - 통계 분석
- `PREPROCESSING_REPORT.md` - 상세 보고서

**결과:**
- 총 199,994개 데이터 (이미지 99,994 + 비디오 100,000)
- Train/Val: 90/10 분할
- CSV 파일: `preprocessed_data/` (904MB)

### 2. LoRA 학습 프레임워크 ✅

**생성된 파일:**
- `lora_finetuning/preprocess_resize.py` - 해상도 변환
- `lora_finetuning/dataset.py` - 데이터 로더
- `lora_finetuning/lora_config.py` - 설정 관리
- `lora_finetuning/train_lora.py` - 학습 스크립트

## 빠른 시작

### 1단계: 환경 설정

```bash
# 가상환경 활성화
source .venv/bin/activate

# 필수 패키지 설치
pip install peft wandb
```

### 2단계: 데이터 확인

```bash
# 전처리된 데이터 통계
python analyze_preprocessed_data.py --data_dir ./preprocessed_data
```

### 3단계: 데이터셋 테스트

```bash
cd lora_finetuning
python dataset.py
```

### 4단계: LoRA 학습 시작

```bash
# 8 GPU
torchrun --nproc_per_node=8 lora_finetuning/train_lora.py \
  --train_csv ./preprocessed_data/all_train.csv \
  --val_csv ./preprocessed_data/all_val.csv \
  --ckpt_dir ./Wan2.2-T2V-A14B \
  --output_dir ./lora_checkpoints
```

## 주요 설정

```python
# LoRA
lora_r = 32
lora_alpha = 32
target_modules = ["to_q", "to_k", "to_v", "to_out.0"]

# Training (8×A100 80GB)
batch_size = 1
gradient_accumulation_steps = 4
learning_rate = 1e-4
num_epochs = 3
```

## 다음 단계

1. **Wan2.2 모델 통합** - VAE/DiT/T5 연결
2. **Loss 함수 구현** - Diffusion MSE loss
3. **작은 데이터로 테스트** - 오버피팅 확인

## 참고 문서

- `PREPROCESSING_REPORT.md` - 데이터 분석
- `lora_finetuning/README.md` - 상세 가이드
- `CLAUDE.md` - 프로젝트 개요

