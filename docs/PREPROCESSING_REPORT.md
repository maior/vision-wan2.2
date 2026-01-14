# MBC 데이터셋 전처리 보고서

## 개요

MBC 방송 영상 아카이브 데이터셋의 전처리를 완료했습니다.

- **데이터 소스**: `/home/devfit2/mbc_json`
- **전처리 결과**: `./preprocessed_data`
- **전처리 일시**: 2025-11-07

## 데이터셋 구성

### 전체 통계

| 구분 | 이미지 | 비디오 | 총합 |
|------|--------|--------|------|
| 전체 | 99,994 | 100,000 | 199,994 |
| Train (90%) | 90,074 | 89,920 | 179,994 |
| Val (10%) | 9,920 | 10,080 | 20,000 |

### 생성된 파일 목록

```
preprocessed_data/
├── all_data.csv        # 전체 데이터 (226MB)
├── all_train.csv       # 전체 학습 데이터 (204MB)
├── all_val.csv         # 전체 검증 데이터 (23MB)
├── image_all.csv       # 이미지 전체 (67MB)
├── image_train.csv     # 이미지 학습 (61MB)
├── image_val.csv       # 이미지 검증 (6.7MB)
├── video_all.csv       # 비디오 전체 (160MB)
├── video_train.csv     # 비디오 학습 (144MB)
└── video_val.csv       # 비디오 검증 (16MB)
```

## 데이터 특성 분석

### 1. 해상도 분포

| 해상도 | 개수 | 비율 |
|--------|------|------|
| 1920×1080 | 155,552 | 77.78% |
| 720×512 | 31,048 | 15.52% |
| **1280×720** | **11,724** | **5.86%** |
| 720×486 | 902 | 0.45% |
| 기타 | 768 | 0.38% |

**⚠️ 중요**: Wan2.2가 지원하는 1280×720 해상도는 전체의 **5.86%**에 불과합니다.
- 비디오: 10,963개 (10.96%)
- 이미지: 761개 (0.76%)

### 2. 비디오 길이 분포

| 범위 | 개수 | 비율 |
|------|------|------|
| 0-10초 | 20 | 0.02% |
| 10-20초 | 43,609 | 43.61% |
| 20-30초 | 49,360 | 49.36% |
| 30-60초 | 5,919 | 5.92% |
| 60초 이상 | 1,092 | 1.09% |

- **평균 길이**: 23.17초
- **최소 길이**: 2.97초
- **최대 길이**: 2383.65초 (약 40분)

### 3. 카테고리 분포

| 카테고리 | 개수 | 비율 |
|----------|------|------|
| 생활/문화 | 57,300 | 28.65% |
| 역사/사회 | 36,158 | 18.08% |
| 자연/풍경 | 33,819 | 16.91% |
| 공간/건축 | 32,940 | 16.47% |
| 사건/사고 | 21,209 | 10.60% |
| 축제 | 14,394 | 7.20% |
| 유형문화유산 | 2,220 | 1.11% |
| 무형문화유산 | 1,954 | 0.98% |

### 4. Caption 텍스트 통계

**전체 평균**:
- **평균 길이**: 440자
- **최소 길이**: 125자
- **최대 길이**: 10,766자

**미디어 타입별**:
- **이미지**: 평균 243자 (짧은 설명)
- **비디오**: 평균 636자 (장면 설명 + STT + Caption)

## CSV 파일 구조

각 CSV 파일은 다음 컬럼으로 구성됩니다:

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| `clip_id` | 클립 ID | `2014482` |
| `media_type` | 미디어 타입 | `video` 또는 `image` |
| `file_path` | 파일 절대 경로 | `/home/devfit2/mbc_json/video/batch_0001/2014482.mp4` |
| `caption` | 결합된 캡션 텍스트 | 장면 설명 + 객체/의미/응용 레벨 캡션 + STT |
| `resolution` | 해상도 | `1920, 1080` |
| `length` | 비디오 길이 | `00:00:21.37` (이미지는 빈 문자열) |
| `category` | 카테고리 | `역사/사회` |
| `keyword` | 키워드 | `평양 냉면` |

## 다음 단계: LoRA Fine-tuning 준비

### 1. 해상도 변환 필요

현재 데이터의 대부분이 1920×1080이므로, Wan2.2 학습을 위해 **해상도 변환**이 필요합니다.

**옵션 1: 다운스케일링**
```python
# 1920×1080 → 1280×720 (16:9 유지)
target_resolution = (1280, 720)
```

**옵션 2: 센터 크롭 후 리사이징**
```python
# 1920×1080 → 1280×720 (중앙 영역 크롭)
```

### 2. 데이터 로더 구현

```python
import pandas as pd
from torch.utils.data import Dataset

class MBCVideoDataset(Dataset):
    def __init__(self, csv_path, transform=None):
        self.data = pd.read_csv(csv_path)
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        video_path = row['file_path']
        caption = row['caption']

        # Load and process video
        frames = load_video(video_path)  # 구현 필요
        if self.transform:
            frames = self.transform(frames)

        return frames, caption
```

### 3. LoRA 설정 권장사항

Wan2.2-T2V-A14B/I2V-A14B (14B 파라미터) 기준:

```python
lora_config = {
    'r': 32,              # LoRA rank
    'lora_alpha': 32,     # LoRA alpha
    'target_modules': [   # DiT attention layers
        'to_q', 'to_k', 'to_v', 'to_out'
    ],
    'lora_dropout': 0.05,
    'bias': 'none',
}
```

**메모리 최적화**:
- FSDP (Fully Sharded Data Parallel) 사용
- Gradient checkpointing 활성화
- Mixed precision (bf16) 학습

### 4. 학습 권장 설정

```bash
# 8×80GB GPU 기준
torchrun --nproc_per_node=8 train_lora.py \
  --data_csv ./preprocessed_data/all_train.csv \
  --val_csv ./preprocessed_data/all_val.csv \
  --ckpt_dir ./Wan2.2-T2V-A14B \
  --output_dir ./lora_checkpoints \
  --batch_size 1 \
  --gradient_accumulation_steps 4 \
  --learning_rate 1e-4 \
  --num_epochs 3 \
  --dit_fsdp \
  --mixed_precision bf16 \
  --gradient_checkpointing
```

## 잠재적 이슈 및 해결방안

### 이슈 1: 해상도 불일치
**문제**: 77.78%의 데이터가 1920×1080 (Wan2.2 미지원)
**해결**: 전처리 파이프라인에 리사이징 추가

### 이슈 2: 긴 비디오
**문제**: 일부 비디오가 40분 이상 (메모리 부족 가능)
**해결**: 비디오를 일정 길이로 자르거나 샘플링

### 이슈 3: Caption 길이 편차
**문제**: 최대 10,766자까지 존재 (T5 토큰 제한)
**해결**: Caption을 512 토큰으로 제한

### 이슈 4: 불균형 카테고리
**문제**: 생활/문화(28%) vs 무형문화유산(0.98%)
**해결**: 클래스 가중치 또는 오버샘플링

## 실행 스크립트

### 전처리 실행
```bash
# 가상환경 활성화
source .venv/bin/activate

# 전처리 (이미 완료)
python preprocess_mbc_data.py \
  --data_root /home/devfit2/mbc_json \
  --output_dir ./preprocessed_data
```

### 통계 분석
```bash
python analyze_preprocessed_data.py --data_dir ./preprocessed_data
```

## 참고 자료

- Wan2.2 README: `/home/maiordba/projects/vision/Wan2.2/README.md`
- CLAUDE.md: 프로젝트 가이드
- 원본 데이터: `/home/devfit2/mbc_json`

## 작성 정보

- **작성자**: Claude Code
- **작성일**: 2025-11-07
- **버전**: 1.0
