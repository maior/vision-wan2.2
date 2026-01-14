# 데이터 품질 검증 및 개선 가이드

## 왜 데이터 품질이 중요한가?

학습 데이터 품질은 모델 성능에 **직접적이고 결정적인** 영향을 미칩니다.

### 품질 문제의 영향

| 문제 유형 | 모델에 미치는 영향 | 심각도 |
|----------|------------------|-------|
| 짧거나 불완전한 Caption | 모델이 시각적 정보를 제대로 학습하지 못함 | ⚠️⚠️⚠️ 높음 |
| Caption과 영상 불일치 | 잘못된 연관성 학습, 환각(hallucination) 발생 | ⚠️⚠️⚠️ 매우 높음 |
| 중복 데이터 | 특정 패턴 과적합, 다양성 감소 | ⚠️⚠️ 중간 |
| 메타데이터 오류 | 해상도/길이 불일치로 전처리 실패 | ⚠️ 낮음 |
| STT 오류 (비디오) | 오디오 정보 손실, 노이즈 학습 | ⚠️⚠️ 중간 |
| 반복/패턴 오류 | 복붙 오류로 의미없는 텍스트 학습 | ⚠️⚠️ 중간 |

## 검증 도구

### 1. 자동 검증 스크립트

**`validate_data_quality.py`**

전체 데이터셋을 자동으로 검사하여 이슈를 찾아냅니다.

```bash
# 전체 검증 (시간 소요)
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --output ./data_quality_report.csv

# 샘플 검증 (빠른 테스트 - 10개 배치만)
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --output ./quality_report_sample.csv \
  --sample_size 10
```

**검증 항목:**
- ✅ JSON 구조 무결성
- ✅ Caption 존재 및 길이
- ✅ 메타데이터 정확성 (해상도, 길이)
- ✅ 파일 존재 및 읽기 가능 여부
- ✅ STT 품질 (비디오)
- ✅ 반복 패턴 감지
- ✅ 의미없는 텍스트 패턴

**출력:**
- `data_quality_report.csv`: 이슈가 있는 파일 목록
- 콘솔: 통계 및 요약

### 2. 수동 검사 도구

**`inspect_samples.py`**

랜덤 샘플을 시각적으로 확인합니다.

```bash
# 20개 샘플 검사
python inspect_samples.py \
  --data_root /home/devfit2/mbc_json \
  --num_samples 20 \
  --output_dir ./sample_inspection

# 비디오만 검사
python inspect_samples.py \
  --data_root /home/devfit2/mbc_json \
  --num_samples 10 \
  --media_type video \
  --output_dir ./video_samples
```

**출력:**
- `sample_001_video_2014482.jpg`: 비디오 프레임 6개 + Caption + 메타데이터
- `sample_002_image_2000017.jpg`: 이미지 + Caption + 메타데이터

이미지를 열어서 **Caption이 실제 내용과 일치하는지** 직접 확인합니다.

## 검증 워크플로우

### Step 1: 전체 자동 검증 (필수)

```bash
# 전체 데이터 검증 (수 시간 소요 가능)
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --output ./quality_report_full.csv
```

### Step 2: 리포트 분석

```bash
# 리포트 확인
cat quality_report_full.csv | head -50

# 이슈 많은 파일 찾기
cat quality_report_full.csv | sort -t',' -k4 -rn | head -20
```

**주요 확인 사항:**
- 이슈 비율이 얼마나 되는가? (5% 미만이면 양호)
- 어떤 유형의 이슈가 가장 많은가?
- 특정 배치/카테고리에 이슈가 집중되어 있는가?

### Step 3: 랜덤 샘플 수동 검증 (권장)

```bash
# 50개 샘플 시각화
python inspect_samples.py \
  --data_root /home/devfit2/mbc_json \
  --num_samples 50 \
  --output_dir ./manual_inspection
```

**확인 방법:**
1. `manual_inspection/` 폴더의 이미지들을 하나씩 열기
2. Caption이 실제 비디오/이미지 내용과 일치하는지 확인
3. Caption이 너무 짧거나 모호한지 확인
4. 의미없는 반복이나 오타가 있는지 확인

### Step 4: 문제 데이터 필터링

검증 결과를 바탕으로 문제 데이터를 제거합니다.

```python
# quality_report_full.csv에서 이슈 많은 파일 제거
import pandas as pd

# 리포트 로드
df = pd.read_csv('quality_report_full.csv')

# 이슈가 있는 clip_id 목록
bad_ids = set(df['clip_id'].tolist())

# 전처리된 CSV에서 제거
train_df = pd.read_csv('preprocessed_data/all_train.csv')
train_df_clean = train_df[~train_df['clip_id'].isin(bad_ids)]

print(f"원본: {len(train_df):,}개")
print(f"필터링 후: {len(train_df_clean):,}개")
print(f"제거됨: {len(train_df) - len(train_df_clean):,}개 ({(len(train_df) - len(train_df_clean))/len(train_df)*100:.2f}%)")

# 저장
train_df_clean.to_csv('preprocessed_data/all_train_clean.csv', index=False)
```

## 품질 개선 전략

### 전략 1: 엄격한 필터링 (보수적)

**장점:** 고품질 데이터만 사용, 안정적인 학습
**단점:** 데이터 수 감소

**기준:**
- Caption 길이 < 20자 → 제거
- 메타데이터 불일치 → 제거
- 파일 손상 → 제거
- 반복 패턴 감지 → 제거

**예상 결과:** 데이터의 10-20% 제거

### 전략 2: 선별적 필터링 (균형)

**장점:** 중대한 결함만 제거, 데이터 수 유지
**단점:** 일부 노이즈 남음

**기준:**
- Caption 길이 < 10자 → 제거
- 파일 손상/없음 → 제거
- 심각한 메타데이터 불일치 (해상도 50% 이상 차이) → 제거
- 경미한 이슈 → 유지

**예상 결과:** 데이터의 5-10% 제거

### 전략 3: Caption 보강 (고급)

**방법:** 문제가 있는 Caption을 재생성

```python
# Vision-Language 모델로 Caption 재생성
from transformers import Blip2Processor, Blip2ForConditionalGeneration

processor = Blip2Processor.from_pretrained("Salesforce/blip2-opt-2.7b")
model = Blip2ForConditionalGeneration.from_pretrained("Salesforce/blip2-opt-2.7b")

# 이미지에 대해 Caption 재생성
image = Image.open("path/to/image.jpg")
inputs = processor(image, return_tensors="pt")
generated_ids = model.generate(**inputs)
generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
```

**장점:** 데이터 손실 없음, 품질 향상
**단점:** 시간과 리소스 많이 소요

### 전략 4: 가중치 기반 샘플링

**방법:** 품질이 좋은 데이터를 더 자주 샘플링

```python
# 품질 점수 계산
def quality_score(row):
    score = 100
    if len(row['caption']) < 50:
        score -= 30
    if 'issues' in row:
        score -= len(row['issues']) * 10
    return max(score, 0)

train_df['quality_score'] = train_df.apply(quality_score, axis=1)

# 가중치 기반 샘플러
from torch.utils.data import WeightedRandomSampler

weights = train_df['quality_score'].values
sampler = WeightedRandomSampler(weights, len(weights), replacement=True)
```

**장점:** 모든 데이터 활용, 고품질 데이터 강조
**단점:** 저품질 데이터도 일부 사용

## 권장 워크플로우

### 최소한의 검증 (시간 부족 시)

```bash
# 1. 샘플 검증 (10개 배치만)
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --sample_size 10 \
  --output ./quality_sample.csv

# 2. 수동 검사 (20개)
python inspect_samples.py \
  --num_samples 20 \
  --output_dir ./inspection
```

→ 대략적인 품질 파악, 큰 문제 발견

### 철저한 검증 (권장)

```bash
# 1. 전체 자동 검증 (밤새 실행)
nohup python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --output ./quality_full.csv > validate.log 2>&1 &

# 2. 리포트 분석
python analyze_quality_report.py  # (별도 작성 필요)

# 3. 수동 검사 (50-100개)
python inspect_samples.py \
  --num_samples 100 \
  --output_dir ./manual_check

# 4. 문제 데이터 필터링
python filter_bad_data.py \
  --quality_report ./quality_full.csv \
  --train_csv ./preprocessed_data/all_train.csv \
  --output ./preprocessed_data/all_train_clean.csv

# 5. 통계 재분석
python analyze_preprocessed_data.py \
  --data_dir ./preprocessed_data
```

## 품질 메트릭

### 좋은 Caption의 기준

✅ **길이:** 50-500자 (너무 짧거나 길지 않음)
✅ **구체성:** "사람이 있다" (X) → "흰색 조리복을 입은 사람이 주방에서 요리하고 있다" (O)
✅ **정확성:** 실제 영상 내용과 일치
✅ **다양성:** 여러 레벨의 설명 (object, semantic, application)
✅ **완결성:** 문장이 완전하고 의미 있음

### 나쁜 Caption의 예시

❌ 너무 짧음: "장면"
❌ 반복: "사람이 있다. 사람이 있다. 사람이 있다."
❌ 모호함: "무언가가 있다"
❌ 불완전: "이 장면에서는"
❌ 불일치: 비디오는 자연 풍경인데 Caption은 "사람이 말하고 있다"

## 예상 결과

### 검증 전 (raw 데이터)
- 총 199,994개
- 품질 불명

### 검증 후 (예상)
- 심각한 이슈: 5-10% (10,000-20,000개)
- 경미한 이슈: 10-20% (20,000-40,000개)
- 고품질: 70-85% (140,000-170,000개)

### 필터링 후
- **보수적 전략:** ~160,000개 (고품질만)
- **균형 전략:** ~180,000개 (중대 결함 제거)
- **관대 전략:** ~190,000개 (파일 손상만 제거)

## 다음 단계

1. ✅ 자동 검증 실행
2. ✅ 리포트 분석
3. ✅ 수동 샘플 확인
4. ⚠️ 필터링 전략 결정
5. ⚠️ 클린 데이터셋 생성
6. ⚠️ 학습 시작

## 참고: 실전 팁

### Tip 1: 배치별 품질 차이 확인

```bash
# 특정 배치의 품질 확인
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json/video/batch_0001 \
  --output ./batch_0001_quality.csv
```

품질이 좋은 배치를 먼저 학습에 사용할 수 있습니다.

### Tip 2: 카테고리별 품질 확인

```python
# quality_report.csv 로드
df = pd.read_csv('quality_report_full.csv')
train_df = pd.read_csv('preprocessed_data/all_train.csv')

# 카테고리별 이슈율
merged = train_df.merge(df, on='clip_id', how='left')
category_quality = merged.groupby('category').agg({
    'issues': lambda x: (x.notna()).sum() / len(x)
})

print(category_quality.sort_values('issues', ascending=False))
```

### Tip 3: 점진적 학습

1. **Phase 1:** 고품질 데이터만 (80,000개)
2. **Phase 2:** 중품질 데이터 추가 (140,000개)
3. **Phase 3:** 모든 데이터 (180,000개)

각 단계에서 성능을 측정하여 품질의 영향을 확인합니다.

## 요약

**반드시 해야 할 것:**
1. 자동 검증 실행 (최소한 샘플이라도)
2. 파일 손상/누락 제거
3. 랜덤 샘플 수동 확인 (20-50개)

**추천하는 것:**
1. 전체 자동 검증
2. Caption 길이 필터링
3. 중복 데이터 제거
4. 메타데이터 수정

**선택 사항:**
1. Caption 재생성
2. 가중치 기반 샘플링
3. 카테고리별 분석
