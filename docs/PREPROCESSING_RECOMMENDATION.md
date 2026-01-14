# 검증 데이터 전처리 권장사항

생성일: 2025-11-08

---

## 🎯 제 추천: **검증 데이터 전처리 필수!**

사용자님의 지적이 100% 정확합니다:
> "결함치를 제외하고 전처리가 되어야 하지 않는가? 그럼 검증 데이터 전처리를 해야되지 않는가?"

**네, 반드시 검증 데이터도 전처리해야 합니다!**

---

## 📊 현재 상황

| 데이터셋 | 상태 | 샘플 수 | 해상도 | 비고 |
|----------|------|---------|--------|------|
| **학습 데이터** | ✅ 준비 완료 | 167,906개 | 1280×720 | 품질 검증 완료 |
| **검증 데이터** | ❌ 전처리 필요 | 20,000개 | 원본 (미변환) | 94% 사용 불가 |

### 문제점

**검증 데이터 all_val.csv:**
```csv
file_path: /home/devfit2/mbc_json/image/batch_0065/2681866.png  ← 원본 경로
resolution: 1920, 1080  ← Wan2.2 미지원!
```

- ❌ 94%가 해상도 미변환 (1920×1080, 720×512 등)
- ❌ 품질 필터링 안 됨
- ❌ 학습에 사용 불가능

---

## 🔧 해결 방안

### 📝 전처리 스크립트 생성 완료

`preprocess_validation_data.py` 스크립트를 만들었습니다.

**기능:**
1. ✅ all_val.csv 읽기
2. ✅ 원본 파일에서 1280×720 변환 (ffmpeg/cv2)
3. ✅ 품질 필터링 (학습 데이터와 동일 기준)
4. ✅ 클린 검증 데이터셋 생성

**품질 기준:**
- Caption 길이: 50자 ~ 1,500자
- 비디오 길이: 5초 ~ 45초
- 해상도: 1280×720 (Wan2.2 지원)
- 반복 패턴 제거

---

## 🚀 실행 방법

### 1단계: 스크립트 실행

```bash
cd /home/maiordba/projects/vision/Wan2.2

# 전체 검증 데이터 전처리 (1-2시간 소요)
python3 preprocess_validation_data.py \
  --val_csv ./preprocessed_data/all_val.csv \
  --output_dir ./preprocessed_data_val_clean
```

### 2단계: 결과 확인

```bash
# 생성된 파일
./preprocessed_data_val_clean/
├── all_val_clean.csv              # ✅ 정상 검증 데이터 (~17,700개 예상)
├── val_defective_samples.csv      # ❌ 결함 샘플 목록
├── converted_720p/                # 변환된 비디오
│   ├── batch_0000/
│   ├── batch_0001/
│   └── ...
└── images_1280x720/               # 변환된 이미지
    ├── batch_0000/
    ├── batch_0001/
    └── ...
```

---

## 📈 예상 결과

| 항목 | 원본 | 전처리 후 | 비고 |
|------|------|-----------|------|
| 총 샘플 | 20,000 | ~17,700 | 88.5% |
| 해상도 변환 성공 | 0% | 100% | 1280×720 |
| 품질 검증 통과 | 6% | 100% | 결함 제거 |

**제외될 샘플 (~2,300개):**
- 원본 파일 없음
- Caption 너무 짧거나 긺
- 비디오 너무 짧거나 긺
- 반복 패턴
- 변환 실패

---

## ✅ 최종 데이터셋 구성

### 전처리 완료 후

```python
학습 데이터:
  파일: ./data_quality_analysis/clean_dataset.csv
  샘플: 167,906개
  해상도: 1280×720 ✓
  품질: 검증 완료 ✓

검증 데이터:
  파일: ./preprocessed_data_val_clean/all_val_clean.csv
  샘플: ~17,700개
  해상도: 1280×720 ✓
  품질: 검증 완료 ✓

비율: 90.5% (train) : 9.5% (val) ✓
```

---

## 🎬 학습 시작 방법

### train_v100.sh 수정

```bash
#!/bin/bash
# V100 32GB × 2 학습 스크립트 (클린 데이터 사용)

set -e

echo "================================"
echo "Wan2.2 LoRA Training on V100 × 2"
echo "With Clean Datasets"
echo "================================"

export CUDA_VISIBLE_DEVICES=0,1
export OMP_NUM_THREADS=4

CKPT_DIR="./Wan2.2-T2V-A14B"
OUTPUT_DIR="./lora_checkpoints_v100_clean"

# ✅ 클린 데이터셋 사용
TRAIN_CSV="./data_quality_analysis/clean_dataset.csv"                    # 167,906개
VAL_CSV="./preprocessed_data_val_clean/all_val_clean.csv"               # ~17,700개

echo ""
echo "설정:"
echo "  - GPUs: 2 × V100 32GB"
echo "  - Checkpoint: $CKPT_DIR"
echo "  - Output: $OUTPUT_DIR"
echo "  - Train CSV: $TRAIN_CSV (167,906 samples)"
echo "  - Val CSV: $VAL_CSV (~17,700 samples)"
echo "  - Quality: All samples verified ✓"
echo ""

# 학습 실행
torchrun \
    --nproc_per_node=2 \
    --master_port=29500 \
    lora_finetuning/train_lora.py \
    --config lora_finetuning/configs/v100_2gpu_config.py \
    --train_csv "$TRAIN_CSV" \
    --val_csv "$VAL_CSV" \
    --ckpt_dir "$CKPT_DIR" \
    --output_dir "$OUTPUT_DIR"

echo ""
echo "학습 완료!"
echo "체크포인트: $OUTPUT_DIR"
```

---

## ⏱️ 소요 시간

### 전처리 시간 (예상)

```
검증 데이터 전처리: 1-2시간
  - 비디오 변환: ~5-10초/개 × 10,080개 = ~30-90분
  - 이미지 변환: ~0.5-1초/개 × 9,920개 = ~10-20분
  - 품질 검사: ~10분
  → 총 1-2시간
```

### 학습 시간

```
전체 학습 (3 epochs): 5-7일
  - 167,906 samples
  - V100 32GB × 2
```

---

## 🎯 권장 작업 순서

### 1. 즉시 실행 (검증 데이터 전처리)

```bash
# 백그라운드로 실행 (1-2시간)
nohup python3 preprocess_validation_data.py \
  --val_csv ./preprocessed_data/all_val.csv \
  --output_dir ./preprocessed_data_val_clean \
  > preprocess_val.log 2>&1 &

# 진행상황 확인
tail -f preprocess_val.log
```

### 2. 전처리 완료 후

```bash
# 결과 확인
wc -l ./preprocessed_data_val_clean/all_val_clean.csv
ls -lh ./preprocessed_data_val_clean/

# 통계 확인
head -20 preprocess_val.log | tail -10
```

### 3. 학습 시작

```bash
# train_v100.sh 수정 (위 스크립트 사용)
bash train_v100.sh
```

---

## 📋 체크리스트

### 전처리 전

- [x] 학습 데이터 정제 완료 (167,906개)
- [x] 검증 데이터 전처리 스크립트 생성
- [x] ffmpeg 설치 확인 (`/usr/bin/ffmpeg`)
- [ ] 검증 데이터 전처리 실행 필요!

### 전처리 후

- [ ] 검증 데이터 전처리 완료 (~17,700개)
- [ ] 품질 검증 완료
- [ ] train_v100.sh 업데이트
- [ ] 학습 시작

---

## 🚨 중요 경고

### ❌ 하지 말아야 할 것

1. **원본 all_val.csv 그대로 사용**
   - 94%가 해상도 미변환
   - 학습 불가능!

2. **품질 필터링 생략**
   - 결함 데이터 포함 → 메모리 폭발
   - 모델 품질 저하

3. **소수(1,199개)만 사용**
   - 통계적 신뢰도 매우 낮음
   - 검증 의미 없음

---

## ✅ 최종 권장사항

### 제 추천 (명확)

**검증 데이터 전처리를 반드시 수행하세요!**

### 이유

1. ✅ **데이터 파이프라인 일관성**
   - 학습 데이터와 동일한 전처리
   - 재현성 보장

2. ✅ **품질 보장**
   - 모든 결함 데이터 제거
   - Wan2.2 호환 보장

3. ✅ **충분한 검증 세트**
   - ~17,700개 (적절한 크기)
   - 통계적 신뢰도 확보

4. ✅ **안정적인 학습**
   - 메모리 문제 없음
   - GPU OOM 위험 제거

---

## 🎯 결론

**사용자님의 판단이 정확합니다!**

> "결함치를 제외하고 전처리가 되어야 하지 않는가?"

→ **네, 맞습니다!**

> "그럼 검증 데이터 전처리를 해야되지 않는가?"

→ **네, 반드시 해야 합니다!**

### 다음 단계

```bash
# 1. 검증 데이터 전처리 실행 (1-2시간)
python3 preprocess_validation_data.py

# 2. 결과 확인 (~17,700개 생성 예상)

# 3. 학습 시작 (5-7일)
bash train_v100.sh
```

---

**보고서 끝**
