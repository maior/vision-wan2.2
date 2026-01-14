# 📋 데이터셋 품질 평가 리포트

**평가 일시**: 2025년 11월 7일
**평가 기준**: RAPA 2025 방송영상 AI 학습용 데이터 품질지표 기준서
**데이터셋**: 방송영상 AI 학습용 비디오 캡셔닝 데이터셋
**총 샘플 수**: 199,941개 (비디오: 99,947 / 이미지: 99,994)

---

## 📊 종합 평가 결과

| 품질 특성 | 목표 | 현재 상태 | 달성률 | 등급 |
|----------|------|----------|--------|------|
| **1. 형식성** | 99% 이상 | ❌ 미측정 | 0% | **F** |
| **2. 다양성(통계)** | 분포 확인 | ⚠️ 일부 달성 | 60% | **C** |
| **3. 다양성(요건)** | 최소값 충족 | ⚠️ 일부 달성 | 50% | **D** |
| **4. 구문 정확성** | 99.5% 이상 | ❌ 미측정 | 0% | **F** |
| **5. 의미 정확성** | 90% 이상 | ❌ 미측정 | 0% | **F** |
| **6. 유효성** | CLIP ≥0.3, FVD ≤1140 | ❌ **미측정** | 0% | **F** |

### 🎯 종합 점수: **30/100점 (F등급)**

**판정**: ❌ **재작업 필요**

---

## 📈 품질 특성별 상세 평가

### 1. 형식성 (Formality) - ❌ F등급

#### 목표
- 파일 유효성: 99% 이상
- 파일 포맷 적합성: 99% 이상
- 파일 속성 적합성: 99% 이상

#### 현재 상태
❌ **검증 미실시**

#### 문제점
1. **파일 유효성 미검증**: 실제 파일 존재 여부 확인 안 됨
2. **파일 손상 검사 없음**: 비디오/이미지 파일이 열리는지 테스트 안 됨
3. **포맷 검증 없음**: mp4, json 형식 준수 여부 미확인
4. **메타데이터 정확성 미검증**: 해상도, 프레임레이트, 길이 등이 실제 파일과 일치하는지 확인 안 됨

#### 개선 방안

**Phase 1: 파일 존재 및 유효성 검증 (1일)**
```python
# scripts/validate_file_existence.py
import os
import pandas as pd
from tqdm import tqdm

def validate_files(csv_path):
    df = pd.read_csv(csv_path)

    valid = 0
    invalid = 0
    missing = []

    for idx, row in tqdm(df.iterrows(), total=len(df)):
        file_path = row['file_path']

        # 파일 존재 확인
        if not os.path.exists(file_path):
            invalid += 1
            missing.append({
                'clip_id': row['clip_id'],
                'file_path': file_path,
                'issue': 'file_not_found'
            })
            continue

        # 파일 크기 확인
        if os.path.getsize(file_path) == 0:
            invalid += 1
            missing.append({
                'clip_id': row['clip_id'],
                'file_path': file_path,
                'issue': 'empty_file'
            })
            continue

        valid += 1

    validity_rate = (valid / len(df)) * 100

    print(f"파일 유효성: {validity_rate:.2f}%")
    print(f"유효: {valid:,} / 무효: {invalid:,}")

    # 목표: 99% 이상
    if validity_rate >= 99.0:
        print("✅ 목표 달성")
    else:
        print(f"❌ 목표 미달 (부족: {99.0 - validity_rate:.2f}%)")

    # 문제 파일 리스트 저장
    if missing:
        pd.DataFrame(missing).to_csv('missing_files.csv', index=False)

    return validity_rate

# 실행
validity = validate_files('./preprocessed_data/all_train.csv')
```

**Phase 2: 비디오 파일 무결성 검증 (2일)**
```python
# scripts/validate_video_integrity.py
import cv2
import subprocess
import json

def check_video_integrity(video_path):
    """비디오 파일 손상 여부 확인"""
    try:
        # OpenCV로 열기 시도
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return False, "cannot_open"

        # 프레임 수 확인
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if frame_count == 0:
            return False, "no_frames"

        # 첫 프레임 읽기 시도
        ret, frame = cap.read()
        if not ret:
            return False, "cannot_read_frame"

        cap.release()

        # ffprobe로 코덱 확인
        cmd = [
            'ffprobe', '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name,width,height,r_frame_rate',
            '-of', 'json',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return False, "ffprobe_error"

        return True, "valid"

    except Exception as e:
        return False, f"exception: {str(e)}"

# 사용
is_valid, issue = check_video_integrity('/path/to/video.mp4')
```

**Phase 3: 메타데이터 정확성 검증 (3일)**
```python
# scripts/validate_metadata_accuracy.py
import cv2
from PIL import Image

def extract_actual_metadata(file_path, media_type):
    """실제 파일에서 메타데이터 추출"""
    if media_type == 'video':
        cap = cv2.VideoCapture(file_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        cap.release()

        return {
            'resolution': f"{width}, {height}",
            'length': duration,
            'fps': fps
        }

    elif media_type == 'image':
        img = Image.open(file_path)
        width, height = img.size

        return {
            'resolution': f"{width}, {height}",
            'length': 0,
            'fps': 0
        }

def validate_metadata(csv_path, sample_size=1000):
    """메타데이터 정확성 검증"""
    df = pd.read_csv(csv_path).sample(n=sample_size)

    match = 0
    mismatch = []

    for idx, row in df.iterrows():
        actual = extract_actual_metadata(row['file_path'], row['media_type'])

        # 해상도 비교
        if row['resolution'] != actual['resolution']:
            mismatch.append({
                'clip_id': row['clip_id'],
                'field': 'resolution',
                'expected': row['resolution'],
                'actual': actual['resolution']
            })
        # 길이 비교 (오차 ±1초 허용)
        elif abs(row['length'] - actual['length']) > 1.0:
            mismatch.append({
                'clip_id': row['clip_id'],
                'field': 'length',
                'expected': row['length'],
                'actual': actual['length']
            })
        else:
            match += 1

    accuracy = (match / sample_size) * 100
    print(f"메타데이터 정확성: {accuracy:.2f}%")

    return accuracy, mismatch
```

**예상 소요 시간**: 1주일
**예상 비용**: V100 GPU 40시간 ($200~$400)

---

### 2. 다양성(통계) - ⚠️ C등급

#### 목표
- 장르별 분포: 분포 확인
- 비디오 길이 분포: 평균 20초, 25초 이상 2% 미만
- 카테고리별 분포: 균형적 분포

#### 현재 상태

**✅ 달성 항목:**
- 비디오 평균 길이: **23.40초** (목표: 20초 이상) ✓

**❌ 미달성 항목:**
- 25초 이상 비디오: **14.9%** (목표: 2% 미만) ✗
  - **초과분**: 12.9%p (약 13,000개 비디오)

**⚠️ 개선 필요:**
- 카테고리 분포 불균형:
  - 생활/문화: 28.7% (최다)
  - 무형문화유산: 1.0% (최소)
  - **편차**: 27.7%p

#### 문제점

1. **장편 비디오 과다**: 25초 이상이 14.9%로 목표(2%)의 **7.5배** 초과
2. **카테고리 편중**: 생활/문화가 전체의 1/3 차지
3. **소수 카테고리 부족**: 유형/무형문화유산 합쳐도 2.1%

#### 개선 방안

**Option 1: 장편 비디오 트리밍 (권장)**
```python
# scripts/trim_long_videos.py
import pandas as pd
from moviepy.editor import VideoFileClip

def trim_video(input_path, output_path, max_duration=25.0):
    """25초 이상 비디오를 25초로 트리밍"""
    clip = VideoFileClip(input_path)

    if clip.duration > max_duration:
        trimmed = clip.subclip(0, max_duration)
        trimmed.write_videofile(output_path, codec='libx264')
        clip.close()
        trimmed.close()
        return True

    clip.close()
    return False

# 25초 초과 비디오 식별
df = pd.read_csv('all_train.csv')
long_videos = df[df['length'] > 25.0]

print(f"25초 초과 비디오: {len(long_videos):,}개")
print(f"처리 필요: {len(long_videos) - (len(df) * 0.02):.0f}개")

# 트리밍 또는 제거 결정
# 방법 1: 25초로 트리밍
# 방법 2: 아예 제거하고 20~25초 비디오로 대체
```

**Option 2: 카테고리 리밸런싱**
```python
# scripts/rebalance_categories.py
import pandas as pd

df = pd.read_csv('all_train.csv')

# 목표: 각 카테고리 최소 10%, 최대 20%
target_min = len(df) * 0.10
target_max = len(df) * 0.20

# 오버샘플링: 소수 카테고리 증강
minority_cats = ['유형문화유산', '무형문화유산', '축제']
for cat in minority_cats:
    cat_df = df[df['category'] == cat]
    shortage = target_min - len(cat_df)

    if shortage > 0:
        # 증강 필요
        augmented = cat_df.sample(n=int(shortage), replace=True)
        df = pd.concat([df, augmented])
        print(f"{cat}: {len(cat_df)}개 → {target_min}개 (증강)")

# 언더샘플링: 다수 카테고리 축소
majority_cats = ['생활/문화', '역사/사회']
for cat in majority_cats:
    cat_df = df[df['category'] == cat]
    excess = len(cat_df) - target_max

    if excess > 0:
        # 축소 필요
        keep = cat_df.sample(n=int(target_max))
        df = df[~df.index.isin(cat_df.index) | df.index.isin(keep.index)]
        print(f"{cat}: {len(cat_df)}개 → {target_max}개 (축소)")

df.to_csv('all_train_rebalanced.csv', index=False)
```

**예상 결과**:
- 25초 이상 비디오: 14.9% → **1.5%** (목표 달성)
- 카테고리 최대/최소 편차: 27.7%p → **10%p** (개선)

**예상 소요 시간**: 3일
**예상 비용**: 스토리지 200GB 추가 ($10)

---

### 3. 다양성(요건) - ⚠️ D등급

#### 목표
- 비디오 데이터 시간: 3,600시간 이상
- 비디오 영상 평균 길이: 20초 이상
- 설명문 최소 토큰 수: 50토큰 이상
- 설명문 최소 문장 수: 5문장 이상

#### 현재 상태

**✅ 달성 항목:**
- 비디오 평균 길이: **23.40초** (목표: 20초) ✓

**❌ 미측정 항목:**
- 전체 비디오 시간: **미계산**
- 캡션 토큰 수: **미측정**
- 캡션 문장 수: **미측정**

**⚠️ 예상 문제:**
- 캡션 평균 길이: 450.7자 (매우 김)
  - 한글 토큰화 시 약 150~200토큰 예상 (목표 50토큰은 충족)
  - 하지만 문장 수는 확인 필요

#### 문제점

1. **전체 비디오 시간 미계산**: 3,600시간 달성 여부 불명
2. **토큰 수 미측정**: GPT/Claude 토큰화 기준으로 계산 필요
3. **문장 수 미측정**: 온점(.) 기준 문장 분리 후 카운트 필요

#### 개선 방안

**Phase 1: 전체 비디오 시간 계산 (즉시)**
```python
# scripts/calculate_total_duration.py
import pandas as pd

df = pd.read_csv('all_train.csv')

# 비디오만 필터링
videos = df[df['media_type'] == 'video']

# 총 시간 계산 (초 → 시간)
total_seconds = videos['length'].sum()
total_hours = total_seconds / 3600

print(f"총 비디오 시간: {total_hours:.2f}시간")
print(f"목표: 3,600시간")

if total_hours >= 3600:
    print("✅ 목표 달성")
else:
    shortage = 3600 - total_hours
    print(f"❌ 부족: {shortage:.2f}시간 ({shortage/total_hours*100:.1f}%)")
```

**예상 결과** (99,947개 비디오 × 23.40초):
- 총 시간: **약 650시간**
- **부족**: 약 2,950시간 (82% 부족)
- ❌ **심각한 미달**

**Phase 2: 캡션 토큰 및 문장 수 측정 (1일)**
```python
# scripts/analyze_caption_requirements.py
import pandas as pd
import tiktoken  # OpenAI tokenizer

def count_sentences(text):
    """한글 문장 개수 카운트"""
    # 온점, 물음표, 느낌표로 문장 분리
    sentences = text.replace('?', '.').replace('!', '.').split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    return len(sentences)

def analyze_captions(csv_path):
    df = pd.read_csv(csv_path)

    # OpenAI tiktoken 인코더
    encoder = tiktoken.encoding_for_model("gpt-4")

    results = []

    for idx, row in df.iterrows():
        caption = str(row['caption'])

        # 토큰 수
        tokens = encoder.encode(caption)
        token_count = len(tokens)

        # 문장 수
        sentence_count = count_sentences(caption)

        results.append({
            'clip_id': row['clip_id'],
            'token_count': token_count,
            'sentence_count': sentence_count,
            'meets_token_req': token_count >= 50,
            'meets_sentence_req': sentence_count >= 5
        })

    results_df = pd.DataFrame(results)

    # 통계
    print(f"평균 토큰 수: {results_df['token_count'].mean():.1f}")
    print(f"평균 문장 수: {results_df['sentence_count'].mean():.1f}")
    print(f"토큰 요건 충족: {results_df['meets_token_req'].sum() / len(results_df) * 100:.1f}%")
    print(f"문장 요건 충족: {results_df['meets_sentence_req'].sum() / len(results_df) * 100:.1f}%")

    # 미달성 샘플 식별
    fails = results_df[~(results_df['meets_token_req'] & results_df['meets_sentence_req'])]
    fails.to_csv('caption_requirement_fails.csv', index=False)

    return results_df

# 실행
results = analyze_captions('all_train.csv')
```

**Phase 3: 부족한 비디오 시간 확보 방안**

**Option 1: 추가 데이터 수집** (권장)
- MBC 추가 방송 영상 2,950시간 확보
- 평균 23초 기준 약 454,000개 클립 필요

**Option 2: 기존 영상 재분할**
- 긴 원본 영상을 더 많은 클립으로 분할
- 예: 5분 영상 → 15개 클립 (20초씩)

**Option 3: 목표 조정 협의**
- RAPA와 협의하여 목표 시간 조정 (3,600시간 → 실제 가능 범위)

**예상 소요 시간**: 추가 데이터 수집 시 2~3개월
**예상 비용**: MBC 추가 라이선스 협상 필요

---

### 4. 구문 정확성 - ❌ F등급

#### 목표
- 구조 정확성: 99.5% 이상 (JSON 스키마 준수)
- 형식 정확성: 99.5% 이상 (타임코드, 날짜 형식 등)

#### 현재 상태
❌ **검증 미실시**

#### 문제점

1. **JSON 스키마 검증 없음**: 라벨링 데이터가 공식 스키마 준수하는지 미확인
2. **필수 필드 검사 없음**: object_level, semantic_level, application_level 캡션 존재 여부 미확인
3. **형식 검증 없음**: 타임코드(00:00:00;00), 날짜, 해상도 형식 미검증

#### 개선 방안

**Phase 1: JSON 스키마 정의 (1일)**
```json
// schema/labeling_schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["file_id", "raw_data_info", "source_data_info", "labeling_data_info"],
  "properties": {
    "file_id": {
      "type": "string",
      "pattern": "^MBC[가-힣]+_[가-힣/]+_[0-9]+\\.mp4$"
    },
    "raw_data_info": {
      "type": "object",
      "required": ["raw_data_info", "source_media_info"]
    },
    "source_data_info": {
      "type": "object",
      "required": ["clip_id", "source_mbc", "broadcast_date", "ai_generated_info"]
    },
    "labeling_data_info": {
      "type": "object",
      "required": ["caption_info"],
      "properties": {
        "caption_info": {
          "type": "object",
          "required": ["object_level", "semantic_level", "application_level"],
          "properties": {
            "object_level": {
              "type": "array",
              "minItems": 1
            },
            "semantic_level": {
              "type": "array",
              "minItems": 1
            },
            "application_level": {
              "type": "array",
              "minItems": 1
            }
          }
        }
      }
    }
  }
}
```

**Phase 2: 스키마 검증 스크립트 (2일)**
```python
# scripts/validate_json_schema.py
import json
import jsonschema
from pathlib import Path
from tqdm import tqdm

def validate_json_files(json_dir, schema_path):
    """모든 JSON 파일 스키마 검증"""

    # 스키마 로드
    with open(schema_path) as f:
        schema = json.load(f)

    json_files = list(Path(json_dir).rglob('*.json'))

    valid = 0
    invalid = []

    for json_file in tqdm(json_files):
        with open(json_file) as f:
            data = json.load(f)

        try:
            jsonschema.validate(instance=data, schema=schema)
            valid += 1
        except jsonschema.exceptions.ValidationError as e:
            invalid.append({
                'file': str(json_file),
                'error': str(e.message),
                'path': list(e.path)
            })

    accuracy = (valid / len(json_files)) * 100

    print(f"구조 정확성: {accuracy:.2f}%")
    print(f"유효: {valid:,} / 무효: {len(invalid):,}")

    if accuracy >= 99.5:
        print("✅ 목표 달성")
    else:
        print(f"❌ 목표 미달 (부족: {99.5 - accuracy:.2f}%)")

    # 오류 리포트 저장
    if invalid:
        pd.DataFrame(invalid).to_csv('schema_validation_errors.csv', index=False)

    return accuracy

# 실행
accuracy = validate_json_files('./preprocessed_data/jsons', './schema/labeling_schema.json')
```

**Phase 3: 형식 정확성 검증 (1일)**
```python
# scripts/validate_format_accuracy.py
import re
from datetime import datetime

def validate_timecode(tc):
    """타임코드 형식 검증: HH:MM:SS;FF"""
    pattern = r'^\d{2}:\d{2}:\d{2};\d{2}$'
    return bool(re.match(pattern, tc))

def validate_date(date_str):
    """날짜 형식 검증"""
    try:
        datetime.fromisoformat(date_str.replace('GMT+0900 (Korean Standard Time)', '').strip())
        return True
    except:
        return False

def validate_resolution(res_str):
    """해상도 형식 검증: 'width, height'"""
    pattern = r'^\d+,\s*\d+$'
    return bool(re.match(pattern, res_str))

def validate_formats(json_data):
    """모든 형식 검증"""
    errors = []

    # 타임코드 검증
    for caption in json_data.get('labeling_data_info', {}).get('caption_info', {}).get('object_level', []):
        if not validate_timecode(caption.get('tc_in', '')):
            errors.append(f"Invalid tc_in: {caption.get('tc_in')}")
        if not validate_timecode(caption.get('tc_out', '')):
            errors.append(f"Invalid tc_out: {caption.get('tc_out')}")

    # 날짜 검증
    broadcast_date = json_data.get('source_data_info', {}).get('broadcast_date', '')
    if not validate_date(broadcast_date):
        errors.append(f"Invalid broadcast_date: {broadcast_date}")

    # 해상도 검증
    resolution = json_data.get('raw_data_info', {}).get('raw_data_info', {}).get('basic_info', {}).get('resolution', '')
    if not validate_resolution(resolution):
        errors.append(f"Invalid resolution: {resolution}")

    return len(errors) == 0, errors

# 전체 파일 검증 후 정확도 계산
```

**예상 소요 시간**: 4일
**예상 결과**: 구조 정확성 95~98%, 형식 정확성 96~99% 예상

---

### 5. 의미 정확성 - ❌ F등급

#### 목표
- 표현 적절성: 90% 이상
- 영상-설명문 일치성: 90% 이상

#### 현재 상태
❌ **검증 미실시**

#### 문제점

1. **샘플링 검증 없음**: 실제 캡션 품질 수동 검사 안 함
2. **일치성 평가 없음**: 캡션과 영상 내용이 매칭되는지 미확인
3. **기준 불명확**: 무엇이 "적절"하고 "일치"하는지 정의 필요

#### 개선 방안

**Phase 1: 평가 기준 정의 (1일)**
```markdown
# 캡션 품질 평가 기준

## 표현 적절성
1. 문법: 완결된 문장 구조
2. 맞춤법: 오타 없음
3. 표현: 자연스러운 한국어
4. 구체성: 구체적 명사/동사 사용
5. 일관성: 시제/어조 일관

## 영상-설명문 일치성
1. 객체 정확도: 실제 등장하는 객체만 언급
2. 행동 정확도: 실제 일어나는 행동만 서술
3. 장면 정확도: 배경/장소 정확 묘사
4. 시간 순서: 영상 흐름대로 서술
5. 세부 정보: 색상, 위치 등 정확

각 항목 1~5점, 평균 3.5점 이상 → 적절/일치로 판정
```

**Phase 2: 샘플링 전략 (1일)**
```python
# scripts/sample_for_manual_review.py
import pandas as pd

def stratified_sampling(csv_path, n=1000):
    """계층적 샘플링"""
    df = pd.read_csv(csv_path)

    # 카테고리별 비율 유지하며 샘플링
    samples = df.groupby('category', group_keys=False).apply(
        lambda x: x.sample(n=int(len(x) / len(df) * n))
    )

    # 비디오 길이별로도 균형
    length_bins = [0, 15, 20, 25, 100]
    samples['length_bin'] = pd.cut(samples['length'], bins=length_bins)

    # 최종 샘플 저장
    samples.to_csv('manual_review_samples.csv', index=False)

    print(f"샘플링 완료: {len(samples)}개")
    print("\n카테고리 분포:")
    print(samples['category'].value_counts())
    print("\n길이 분포:")
    print(samples['length_bin'].value_counts())

    return samples

# 1,000개 샘플 추출
samples = stratified_sampling('all_train.csv', n=1000)
```

**Phase 3: 검토 인터페이스 구축 (3일)**
```python
# 간단한 Flask 웹 인터페이스
from flask import Flask, render_template, request
import pandas as pd

app = Flask(__name__)

samples = pd.read_csv('manual_review_samples.csv')
current_idx = 0

@app.route('/')
def review():
    global current_idx
    sample = samples.iloc[current_idx]

    return render_template('review.html',
        clip_id=sample['clip_id'],
        video_path=sample['file_path'],
        caption=sample['caption'],
        current=current_idx+1,
        total=len(samples)
    )

@app.route('/submit', methods=['POST'])
def submit():
    global current_idx

    # 평가 점수 저장
    scores = {
        'clip_id': samples.iloc[current_idx]['clip_id'],
        'expression_score': request.form.get('expression'),
        'alignment_score': request.form.get('alignment'),
        'comments': request.form.get('comments')
    }

    # CSV에 저장
    with open('review_results.csv', 'a') as f:
        f.write(f"{scores['clip_id']},{scores['expression_score']},{scores['alignment_score']},{scores['comments']}\n")

    current_idx += 1
    return redirect('/')

# 실행: python review_app.py
```

**Phase 4: 통계 계산 (즉시)**
```python
# scripts/calculate_semantic_accuracy.py
import pandas as pd

def calculate_accuracy(results_csv):
    df = pd.read_csv(results_csv)

    # 3.5점 이상을 "적절/일치"로 판정
    expression_pass = (df['expression_score'] >= 3.5).sum()
    alignment_pass = (df['alignment_score'] >= 3.5).sum()

    expression_rate = (expression_pass / len(df)) * 100
    alignment_rate = (alignment_pass / len(df)) * 100

    print(f"표현 적절성: {expression_rate:.1f}%")
    print(f"영상-설명문 일치성: {alignment_rate:.1f}%")

    if expression_rate >= 90 and alignment_rate >= 90:
        print("✅ 목표 달성")
    else:
        print("❌ 목표 미달")

    return expression_rate, alignment_rate

# 실행
exp_rate, align_rate = calculate_accuracy('review_results.csv')
```

**예상 소요 시간**: 2주 (검토자 2명 × 1주일)
**예상 비용**: 검토 인력 비용 + 시간

---

### 6. 유효성 - ❌ F등급 (최우선!)

#### 목표
- **FVD (Fréchet Video Distance): ≤ 1140**
- **CLIP Score: ≥ 0.3**

#### 현재 상태
❌ **측정 미실시**

**이것은 가장 중요한 메트릭입니다!**
사업 성공/실패를 판가름하는 핵심 지표입니다.

#### 문제점

1. **CLIP Score 미측정**: 텍스트-비디오 정렬도 불명
2. **FVD 미측정**: 비디오 품질 객관적 지표 없음
3. **Reference Dataset 없음**: FVD 계산을 위한 비교 데이터셋 부재

#### 개선 방안 (최우선 작업!)

**Phase 1: CLIP Score 측정 (3일, GPU 필요)**

```bash
# 설치
pip install git+https://github.com/openai/CLIP.git
pip install torch torchvision
```

```python
# scripts/calculate_clip_score_batch.py
import clip
import torch
import pandas as pd
import cv2
import numpy as np
from tqdm import tqdm
from PIL import Image

def calculate_clip_score(video_path, caption, model, preprocess, device):
    """단일 비디오-캡션 쌍의 CLIP Score 계산"""

    # 비디오에서 프레임 샘플링 (균등하게 8프레임)
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frames = []
    frame_indices = np.linspace(0, frame_count-1, num=8, dtype=int)

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_pil = Image.fromarray(frame_rgb)
            frames.append(preprocess(frame_pil))

    cap.release()

    if not frames:
        return 0.0

    # 프레임 텐서 준비
    frames_tensor = torch.stack(frames).to(device)

    # 텍스트 토큰화
    text_tokens = clip.tokenize([caption], truncate=True).to(device)

    # CLIP 인코딩
    with torch.no_grad():
        frame_features = model.encode_image(frames_tensor)
        text_features = model.encode_text(text_tokens)

        # 정규화
        frame_features = frame_features / frame_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        # 코사인 유사도 계산 (각 프레임과 텍스트)
        similarity = (frame_features @ text_features.T).squeeze()

        # 평균 유사도
        clip_score = similarity.mean().item()

    return clip_score

def batch_calculate_clip(csv_path, sample_size=5000, model_name='ViT-B/32'):
    """배치로 CLIP Score 계산"""

    # CLIP 모델 로드
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load(model_name, device=device)

    # 데이터 로드 및 샘플링
    df = pd.read_csv(csv_path)
    videos_df = df[df['media_type'] == 'video'].sample(n=min(sample_size, len(df)))

    results = []

    for idx, row in tqdm(videos_df.iterrows(), total=len(videos_df)):
        try:
            score = calculate_clip_score(
                row['file_path'],
                row['caption'],
                model,
                preprocess,
                device
            )

            results.append({
                'clip_id': row['clip_id'],
                'clip_score': score
            })

        except Exception as e:
            print(f"Error processing {row['clip_id']}: {e}")
            continue

    # 결과 저장
    results_df = pd.DataFrame(results)
    results_df.to_csv('clip_scores.csv', index=False)

    # 통계
    mean_score = results_df['clip_score'].mean()
    median_score = results_df['clip_score'].median()
    pass_rate = (results_df['clip_score'] >= 0.3).sum() / len(results_df) * 100

    print(f"\n=== CLIP Score 결과 ===")
    print(f"샘플 수: {len(results_df):,}")
    print(f"평균 CLIP Score: {mean_score:.4f}")
    print(f"중앙값: {median_score:.4f}")
    print(f"0.3 이상 비율: {pass_rate:.1f}%")

    if mean_score >= 0.3:
        print("✅ 목표 달성")
    else:
        shortage = 0.3 - mean_score
        print(f"❌ 목표 미달 (부족: {shortage:.4f})")

    return results_df, mean_score

# 실행
results, avg_score = batch_calculate_clip('all_train.csv', sample_size=5000)
```

**예상 소요 시간**: 3일 (V100 GPU × 2)
**예상 결과**: CLIP Score 0.25~0.35 예상 (경계선)

**Phase 2: FVD 측정 (5일, GPU 필요)**

```bash
# 설치
pip install tensorflow-gpu tensorflow-gan
```

```python
# scripts/calculate_fvd_batch.py
import tensorflow as tf
import tensorflow_gan as tfgan
import numpy as np
from tqdm import tqdm

def load_videos(video_paths, num_frames=16):
    """비디오 로드 및 전처리"""
    videos = []

    for path in video_paths:
        cap = cv2.VideoCapture(path)
        frames = []

        # 균등 샘플링
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        indices = np.linspace(0, frame_count-1, num=num_frames, dtype=int)

        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                # 리사이즈 및 정규화
                frame = cv2.resize(frame, (224, 224))
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame)

        cap.release()

        if len(frames) == num_frames:
            videos.append(np.array(frames))

    return np.array(videos)

def calculate_fvd(real_videos, generated_videos):
    """FVD 계산"""

    # I3D 모델 로드 (ImageNet + Kinetics 사전학습)
    i3d_model = tfgan.eval.get_inception_model()

    # 특징 추출
    print("Extracting features from real videos...")
    real_features = i3d_model(real_videos)

    print("Extracting features from generated/dataset videos...")
    gen_features = i3d_model(generated_videos)

    # FVD 계산
    fvd_score = tfgan.eval.frechet_inception_distance(
        real_features,
        gen_features
    )

    return fvd_score

def batch_calculate_fvd(dataset_csv, reference_dir, sample_size=2000):
    """배치로 FVD 계산"""

    # 데이터셋 비디오
    df = pd.read_csv(dataset_csv)
    dataset_videos = df[df['media_type'] == 'video'].sample(n=sample_size)
    dataset_paths = dataset_videos['file_path'].tolist()

    # Reference 비디오 (고품질 실사 비디오)
    # Kinetics-700, WebVid, 또는 자체 고품질 셋
    reference_paths = list(Path(reference_dir).glob('*.mp4'))[:sample_size]

    print(f"Loading {len(dataset_paths)} dataset videos...")
    dataset_vids = load_videos(dataset_paths)

    print(f"Loading {len(reference_paths)} reference videos...")
    reference_vids = load_videos([str(p) for p in reference_paths])

    print("Calculating FVD...")
    fvd = calculate_fvd(reference_vids, dataset_vids)

    print(f"\n=== FVD 결과 ===")
    print(f"FVD Score: {fvd:.2f}")
    print(f"목표: ≤ 1140")

    if fvd <= 1140:
        print("✅ 목표 달성")
    else:
        excess = fvd - 1140
        print(f"❌ 목표 초과 (+{excess:.2f})")

    return fvd

# Reference 데이터셋 준비 필요!
# Option 1: Kinetics-700 다운로드
# Option 2: WebVid-10M 샘플
# Option 3: 자체 고품질 MBC 영상 셋

fvd_score = batch_calculate_fvd(
    'all_train.csv',
    '/path/to/reference_videos',
    sample_size=2000
)
```

**중요: Reference Dataset 준비**
```bash
# Option 1: Kinetics-700 다운로드 (권장)
# 고품질 액션 비디오 데이터셋
git clone https://github.com/cvdfoundation/kinetics-dataset
python download.py --classes 50 --num_workers 8

# Option 2: 자체 Reference 구축
# MBC의 고품질 HD 방송 영상 중 우수한 것 2,000개 선별
# - 손상 없음
# - 1080p 이상
# - 조명/색감 우수
# - 카메라 워크 안정적
```

**예상 소요 시간**: 1주일 (Reference 준비 3일 + 계산 2일)
**예상 비용**: V100 GPU 80시간 ($400~$800)

**예상 결과**:
- CLIP Score: 0.25~0.30 (경계선, 캡션 개선 필요할 수 있음)
- FVD: 800~1500 (불확실, Reference 품질에 따라 변동)

---

## 🎯 우선순위별 개선 로드맵

### 🔴 Critical (즉시 실행, 1주일)

1. **CLIP Score 측정** (3일)
   - 5,000개 샘플 측정
   - GPU: V100 × 2, 48시간
   - 예산: $200~$400

2. **FVD 측정** (4일)
   - Reference dataset 준비
   - 2,000개 샘플 측정
   - GPU: V100 × 2, 32시간
   - 예산: $300~$600

**이 두 메트릭이 목표 미달이면 사업 자체가 위험합니다!**

### 🟠 High Priority (2주 이내)

3. **장편 비디오 처리** (3일)
   - 25초 이상 14.9% → 2% 미만으로 감축
   - 트리밍 또는 제거

4. **캡션 토큰/문장 수 검증** (2일)
   - 50토큰, 5문장 요건 확인
   - 미달 샘플 보완

5. **파일 유효성 검증** (3일)
   - 전수 검사: 파일 존재, 손상 여부
   - 목표: 99% 이상

### 🟡 Medium Priority (1개월 이내)

6. **JSON 스키마 검증** (4일)
   - 스키마 정의 및 전수 검사
   - 목표: 99.5% 이상

7. **카테고리 리밸런싱** (1주)
   - 오버/언더 샘플링
   - 최대 편차 10%p 이내

8. **비디오 시간 확보** (협의)
   - 현재: ~650시간
   - 목표: 3,600시간
   - 부족: ~2,950시간

### 🟢 Low Priority (2개월 이내)

9. **의미 정확성 수동 검증** (2주)
   - 1,000개 샘플 수동 검토
   - 검토 인터페이스 구축

10. **메타데이터 정확성 검증** (1주)
    - 실제 파일과 비교
    - 목표: 99% 이상

---

## 📊 예상 최종 결과

### 모든 개선 작업 완료 시

| 품질 특성 | 현재 | 개선 후 | 목표 | 달성 |
|----------|------|---------|------|------|
| 형식성 | 0% | **99.2%** | 99% | ✅ |
| 다양성(통계) | 60% | **85%** | 분포 확인 | ✅ |
| 다양성(요건) | 50% | **70%** | 최소값 | ⚠️ |
| 구문 정확성 | 0% | **99.3%** | 99.5% | ⚠️ |
| 의미 정확성 | 0% | **91%** | 90% | ✅ |
| 유효성 | 0% | **CLIP: 0.28, FVD: 1250** | CLIP ≥0.3, FVD ≤1140 | ❌ |

### 종합 점수: **75/100점 (C등급)**

**판정**: ⚠️ **조건부 합격 (개선 필요)**

### 핵심 리스크

1. **비디오 시간 부족**: 650시간 vs 목표 3,600시간 (18% 달성)
2. **CLIP Score 불확실**: 실측 전까지 목표 달성 여부 불명
3. **FVD 불확실**: Reference dataset 품질에 따라 변동

---

## 💰 총 소요 예산 및 시간

### 예산
- GPU 비용: $800~$1,500
- 인력 비용 (검토자): $2,000~$4,000
- 스토리지: $50
- **총 예산: $3,000~$6,000**

### 시간
- Critical 작업: 1주
- High Priority: 2주
- Medium Priority: 4주
- Low Priority: 8주
- **총 소요 시간: 2~3개월**

### 인력
- ML 엔지니어: 1명 (풀타임)
- 데이터 검증자: 2명 (파트타임)
- GPU 엔지니어: 1명 (파트타임)

---

## 🚨 즉시 조치 필요 사항

### 오늘 바로 시작
1. ✅ CLIP Score 측정 환경 구축
2. ✅ Reference dataset 확보 시작
3. ✅ GPU 리소스 확보 (V100 × 2)

### 이번 주 내
4. ✅ CLIP Score 전수 측정
5. ✅ FVD 계산 완료
6. ✅ 장편 비디오 트리밍 시작

### 2주 내
7. ✅ 파일 유효성 전수 검사
8. ✅ 캡션 요건 검증
9. ✅ 개선 계획 RAPA 보고

---

**결론**: 현재 데이터셋은 공식 품질지표 기준에 크게 미달합니다. 특히 **유효성(CLIP/FVD)**과 **다양성(요건)** 항목이 심각하며, 즉각적인 측정과 개선이 필요합니다. 2~3개월의 집중적인 품질 개선 작업이 필수입니다.
