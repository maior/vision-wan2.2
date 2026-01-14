# V100 32GB × 2 설정 가이드

## 하드웨어 사양
- **GPU**: V100 32GB × 2
- **메모리**: 총 64GB VRAM
- **제약**: A100 80GB보다 메모리 제한적

## 최적화 전략

### 메모리 최적화

| 설정 | A100 | V100 | 이유 |
|------|------|------|------|
| LoRA Rank | 32 | **16** | 메모리 50% 감소 |
| Frame Num | 81 | **49** | 메모리 40% 감소 |
| Gradient Accum | 4 | **16** | 배치 크기 유지 |
| Caption Length | 512 | **256** | 메모리 절약 |
| T5 CPU | No | **Yes** | GPU 메모리 절약 |
| VAE CPU | No | **Yes** | GPU 메모리 절약 |
| Optimizer | AdamW | **AdamW 8bit** | 메모리 절약 |

### Effective Batch Size 유지

```
A100: 1 × 4 × 8 = 32
V100: 1 × 16 × 2 = 32  ✓ 동일
```

## 빠른 시작

### 1. 환경 준비

```bash
# 가상환경 활성화
source .venv/bin/activate

# 추가 패키지 설치 (8bit optimizer)
pip install bitsandbytes

# GPU 확인
nvidia-smi
```

### 2. 체크포인트 다운로드

```bash
# T2V-A14B 모델 다운로드 (필수)
huggingface-cli download Wan-AI/Wan2.2-T2V-A14B --local-dir ./Wan2.2-T2V-A14B

# 또는 ModelScope
# modelscope download Wan-AI/Wan2.2-T2V-A14B --local_dir ./Wan2.2-T2V-A14B
```

### 3. 테스트 데이터셋 생성 (완료됨)

```bash
# 100개 샘플 (이미 생성됨)
# ./preprocessed_data/test_100.csv
```

### 4. 오버피팅 테스트 (필수!)

**작은 데이터로 먼저 테스트하여 학습이 작동하는지 확인:**

```bash
# 오버피팅 테스트 (30-60분 예상)
bash train_v100_test.sh

# 또는 수동 실행
python lora_finetuning/train_lora.py \
  --train_csv ./preprocessed_data/test_100.csv \
  --val_csv ./preprocessed_data/test_100.csv \
  --ckpt_dir ./Wan2.2-T2V-A14B \
  --output_dir ./lora_checkpoints_v100_test \
  --num_epochs 5
```

**확인 사항:**
1. ✅ Loss가 감소하는가? (과적합 되어야 함)
2. ✅ GPU 메모리 사용량 < 30GB/32GB
3. ✅ 체크포인트가 저장되는가?

**예상 결과:**
- Epoch 1: Loss ~0.5
- Epoch 3: Loss ~0.1
- Epoch 5: Loss ~0.01 (과적합 성공!)

### 5. 전체 학습

오버피팅 테스트가 성공하면 전체 데이터로 학습:

```bash
# 전체 데이터 학습
bash train_v100.sh

# 예상 시간: ~5-7일 (3 epochs)
# GPU당 ~30GB 메모리 사용
```

## 모니터링

### GPU 메모리 확인

```bash
# 실시간 모니터링
watch -n 1 nvidia-smi

# 메모리 사용량만 확인
nvidia-smi --query-gpu=memory.used,memory.total --format=csv -l 1
```

### 학습 로그 확인

```bash
# 로그 파일 위치
tail -f lora_checkpoints_v100/train.log

# Loss 추적
grep "Loss:" lora_checkpoints_v100/train.log
```

### TensorBoard (선택)

```bash
tensorboard --logdir ./lora_checkpoints_v100/logs
```

## 예상 성능

### 오버피팅 테스트 (100 샘플)
- **시간**: 30-60분
- **메모리**: ~28-30GB/GPU
- **Loss**: 0.5 → 0.01

### 전체 학습 (179,994 샘플)
- **시간**: ~5-7일 (3 epochs)
- **메모리**: ~30GB/GPU
- **Loss**: 0.15 → 0.03

## 메모리 부족 시 대처

### 1. OOM (Out of Memory) 발생

```python
# lora_finetuning/configs/v100_2gpu_config.py 수정

# 옵션 1: 프레임 수 줄이기
frame_num = 33  # 49 → 33

# 옵션 2: LoRA rank 줄이기
lora_r = 8  # 16 → 8

# 옵션 3: Gradient accumulation 늘리기
gradient_accumulation_steps = 32  # 16 → 32
```

### 2. 너무 느림

```python
# 데이터 로더 워커 늘리기
num_workers = 4  # 2 → 4

# 또는 mixed precision 확인
mixed_precision = "bf16"  # 또는 "fp16"
```

## 문제 해결

### 1. CUDA Out of Memory

```bash
# GPU 초기화
nvidia-smi --gpu-reset

# 프로세스 확인 및 종료
ps aux | grep python
kill -9 <PID>
```

### 2. bitsandbytes 설치 실패

```bash
# CUDA 버전 확인
nvcc --version

# 재설치
pip uninstall bitsandbytes
pip install bitsandbytes --no-cache-dir
```

### 3. 학습이 시작되지 않음

```bash
# PyTorch 버전 확인
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"

# CUDA 재설치 (필요시)
pip install torch torchvision --force-reinstall
```

## 체크리스트

학습 시작 전 확인:

- [ ] GPU 2장 인식 확인 (`nvidia-smi`)
- [ ] 체크포인트 다운로드 (`./Wan2.2-T2V-A14B/`)
- [ ] 테스트 데이터 생성 (`./preprocessed_data/test_100.csv`)
- [ ] bitsandbytes 설치 (`pip list | grep bitsandbytes`)
- [ ] 오버피팅 테스트 성공
- [ ] 디스크 공간 충분 (최소 100GB)

## 다음 단계

1. ✅ **오버피팅 테스트 실행** (필수)
   ```bash
   bash train_v100_test.sh
   ```

2. ⚠️ **결과 확인**
   - Loss 감소 확인
   - 메모리 사용량 확인
   - 체크포인트 저장 확인

3. ⚠️ **전체 학습 시작**
   ```bash
   bash train_v100.sh
   ```

4. ⚠️ **모니터링 및 평가**

## 참고 문서

- `lora_finetuning/configs/v100_2gpu_config.py` - 상세 설정
- `DATA_QUALITY_GUIDE.md` - 데이터 품질 검증
- `LORA_SETUP_GUIDE.md` - 일반 LoRA 가이드

## 예상 타임라인

| 단계 | 시간 | 상태 |
|------|------|------|
| 환경 설정 | 30분 | ⚠️ 진행 중 |
| 오버피팅 테스트 | 1시간 | ⬜ 대기 |
| 전체 학습 | 5-7일 | ⬜ 대기 |
| 평가 및 분석 | 1일 | ⬜ 대기 |

**총 예상 시간: 약 1주일**
