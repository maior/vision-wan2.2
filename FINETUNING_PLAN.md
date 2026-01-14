# Wan2.2 TI2V-5B LoRA 파인튜닝 계획

## 프로젝트 개요

**목표**: MBC 뉴스 데이터를 활용하여 한국어 뉴스 영상 생성에 특화된 TI2V-5B 모델 LoRA 파인튜닝

**하드웨어**: V100 32GB × 2

**데이터**: /works/maior/Developer/etri/dqv/data/mbc_json/ (총 455,648개 JSON 파일)

---

## 데이터셋 구조 분석

### JSON 구조:
```json
{
  "file_id": "파일명",
  "source_data_info": {
    "clip_id": "고유 ID",
    "clip_proxy_url": "비디오/이미지 URL",
    "clip_proxy_thumbnail_url": ["썸네일 URL 리스트"],
    "ai_generated_info": {
      "stt_script": "음성 텍스트",
      "scene_description_auto": [
        {
          "tc_in": "시작 타임코드",
          "tc_out": "종료 타임코드",
          "description": "장면 설명"
        }
      ]
    }
  },
  "labeling_data_info": {
    "caption_info": {
      "object_level": [...],      // 객체 수준 캡션
      "semantic_level": [...],    // 의미 수준 캡션
      "application_level": [...]  // 응용 수준 캡션
    }
  },
  "raw_data_info": {
    "source_media_info": {
      "media_type": "image" | "video",
      "details": {
        "length": "비디오 길이",
        "frame_rate": 29.97,
        "resolution": "1920, 1080"
      }
    }
  }
}
```

### 학습에 활용할 데이터:
1. **비디오 URL**: `clip_proxy_url` (CloudFront CDN)
2. **텍스트 프롬프트**:
   - `stt_script` (STT 스크립트)
   - `object_level` 캡션 (구체적 묘사)
   - `semantic_level` 캡션 (의미론적 해석)
3. **참조 이미지**:
   - `clip_proxy_thumbnail_url[0]` (첫 프레임)
   - 또는 이미지 타입인 경우 `clip_proxy_url`

---

## 학습 전략

### 1. 데이터 필터링 기준

```python
# 학습에 사용할 비디오 필터:
- media_type == "video"
- 길이: 3초 ~ 30초 (너무 짧거나 긴 영상 제외)
- 해상도: 1920×1080 (고품질만)
- STT 스크립트 또는 캡션 정보 존재
```

### 2. 프롬프트 생성 전략

```python
def generate_prompt(json_data):
    """
    3단계 프롬프트 생성:
    1. Scene description (장면 묘사)
    2. Object description (객체 수준)
    3. Semantic description (의미론적)
    """
    scene_desc = json_data['ai_generated_info']['scene_description_auto']
    object_captions = json_data['labeling_data_info']['caption_info']['object_level']
    semantic_captions = json_data['labeling_data_info']['caption_info']['semantic_level']

    # 통합 프롬프트 생성
    prompt = combine_descriptions(scene_desc, object_captions, semantic_captions)
    return prompt
```

### 3. 학습 모드

**Mode 1: Text-to-Video (T2V)**
- 입력: 텍스트 프롬프트만
- 출력: 비디오
- 비율: 60%

**Mode 2: Image-to-Video (I2V)**
- 입력: 텍스트 프롬프트 + 첫 프레임 이미지
- 출력: 비디오
- 비율: 40%

---

## 기술 아키텍처

### LoRA 설정

```python
LoRA Configuration:
- Rank (r): 16
- Alpha: 16
- Dropout: 0.1
- Target modules:
  * Self-attention: q, k, v projections
  * Cross-attention: q, k, v projections
  * FFN: up_proj, down_proj (선택적)
```

### 메모리 최적화 전략

```bash
V100 32GB × 2 최적화:
1. FSDP (Fully Sharded Data Parallel)
2. DeepSpeed Ulysses (sequence parallelism)
3. Gradient Checkpointing
4. Mixed Precision (bfloat16)
5. T5 CPU offloading
6. 8bit AdamW optimizer
```

### 예상 메모리 사용량

```
Per GPU (32GB):
- TI2V-5B 모델 (frozen): ~10GB
- LoRA params: ~500MB
- Optimizer states: ~1GB
- Gradients: ~500MB
- Activations (with checkpointing): ~10GB
- Buffer: ~10GB
------------------------
Total per GPU: ~32GB ✅
```

---

## 학습 하이퍼파라미터

```yaml
# 모델
model: TI2V-5B
lora_rank: 16
lora_alpha: 16
lora_dropout: 0.1

# 학습
batch_size: 1 per GPU (effective: 2)
gradient_accumulation_steps: 8
effective_batch_size: 16
learning_rate: 1e-4
warmup_steps: 500
max_steps: 10000
weight_decay: 0.01

# 비디오
num_frames: 49  # 메모리 고려 (81→49)
resolution: 1280×704  # TI2V-5B 표준
fps: 24

# 최적화
mixed_precision: bf16
gradient_checkpointing: true
use_8bit_adam: true
cpu_offload_t5: true
```

---

## 예상 학습 시간

```
설정:
- 총 스텝: 10,000
- Effective batch size: 16
- 총 샘플: 160,000 (약 35% 데이터셋)

시간 추정:
- 1 iteration: ~8-10분 (49 frames, 720p)
- 10,000 steps: ~1,389시간 = 58일
```

**속도 개선 방법:**
1. Frame 수 줄이기: 81→49→33
2. 해상도 낮추기: 1280×704 → 704×1280
3. 일부 데이터만 사용 (quality filtering)

---

## 디렉토리 구조

```
Wan2.2/
├── lora_finetuning/
│   ├── configs/
│   │   └── ti2v_5b_lora_config.yaml
│   ├── data/
│   │   ├── dataset.py              # MBC Dataset loader
│   │   ├── preprocessing.py        # 데이터 전처리
│   │   └── download_utils.py       # CDN 다운로드 유틸
│   ├── models/
│   │   ├── lora_layers.py          # LoRA 구현
│   │   └── inject_lora.py          # TI2V에 LoRA 주입
│   ├── training/
│   │   ├── train_lora.py           # 메인 학습 스크립트
│   │   ├── trainer.py              # Trainer 클래스
│   │   └── utils.py                # 학습 유틸리티
│   ├── scripts/
│   │   ├── prepare_data.sh         # 데이터 준비
│   │   ├── train.sh                # 학습 실행
│   │   └── test_env.sh             # 환경 테스트
│   └── checkpoints/                # LoRA weights 저장
└── outputs/                        # 생성 결과물
```

---

## 데이터 전처리 파이프라인

### Step 1: JSON 파싱 및 필터링
```python
# 455,648개 JSON → 비디오만 필터 → 품질 체크
- 예상 비디오 수: ~200,000개
- 필터 후: ~100,000개 (3-30초, 고품질)
```

### Step 2: 메타데이터 생성
```python
# metadata.json 생성
{
  "clip_id": "3835852",
  "video_url": "https://...",
  "thumbnail_urls": [...],
  "prompt": "통합 프롬프트",
  "stt_script": "...",
  "duration": 19.75,
  "fps": 29.97
}
```

### Step 3: 비디오 다운로드 (온디맨드)
```python
# 학습 중 실시간 다운로드 또는
# 사전 다운로드 (디스크 용량에 따라)
```

---

## 품질 관리

### 1. 데이터 검증
- 다운로드 성공 여부
- 비디오 길이 확인
- 프레임 수 검증
- 텍스트 품질 (너무 짧거나 없는 경우 제외)

### 2. 학습 모니터링
- Loss tracking (wandb/tensorboard)
- Sample generation (매 500 steps)
- Checkpoint 저장 (매 1000 steps)

### 3. 평가 지표
- FVD (Fréchet Video Distance)
- CLIP Score (text-video alignment)
- Manual inspection

---

## 리스크 및 대응

### 리스크 1: OOM (Out of Memory)
**대응:**
- Frame 수 49 → 33으로 감소
- Resolution 낮추기
- Gradient accumulation 증가

### 리스크 2: CDN 다운로드 실패
**대응:**
- Retry 로직 구현
- 타임아웃 설정
- 캐싱 전략

### 리스크 3: 느린 학습 속도
**대응:**
- 데이터 샘플링 (전체 대신 50%)
- Frame 수 최소화
- Resolution 조정

---

## 다음 단계

1. ✅ 데이터셋 구조 분석 완료
2. 🔄 데이터 로더 구현
3. ⏳ LoRA 모듈 구현
4. ⏳ 학습 스크립트 작성
5. ⏳ 환경 검증
6. ⏳ 학습 시작
