# Wan2.2 LoRA Fine-tuning 진행 상황

**날짜**: 2025-11-10
**모델**: Wan2.2 TI2V-5B (5B 파라미터)
**하드웨어**: 2x NVIDIA V100 32GB

---

## 진행 경과

### 1단계: 커스텀 Training Pipeline 시도 ❌

#### 시도한 방법
1. **직접 LoRA 학습 구현**
   - `lora_finetuning/train_lora.py` 작성
   - PyTorch DistributedDataParallel 사용
   - LoRA rank=32, alpha=32

#### 발생한 문제들

**문제 1: VAE Encoding Hang**
- **증상**: `model.vae.encode(video_list)` 호출 시 무한 대기
- **원인**: Wan2_2_VAE가 학습 루프에서 사용하도록 설계되지 않음
- **해결 시도**:
  - DataLoader `num_workers=2→0` (multiprocessing 제거)
  - `batch_size=2→1` (부하 감소)
  - `frame_num=81→17` (연산량 감소)
- **결과**: 모두 실패, VAE encoding 여전히 hang

**문제 2: Tensor Shape 불일치**
- **시도**: VAE 전처리 스크립트 작성 (`preprocess_vae_latents.py`)
- **증상**:
  ```
  einops.EinopsError: Shape mismatch
  Input: torch.Size([1, 17, 704, 1280, 3])  # (B, F, H, W, C)
  Expected: torch.Size([1, 3, 17, 704, 1280])  # (B, C, F, H, W)
  ```
- **원인**: Dataset과 VAE의 텐서 형식 불일치
- **결과**: 10개 샘플 모두 실패

**문제 3: NCCL Distributed Synchronization Hang**
- **시도**: Dummy loss 사용 (VAE encoding 건너뛰기)
- **진행**: 모델 로딩 완료 (T5, VAE, DiT 모두 로드됨)
- **증상**: NCCL barrier에서 무한 대기
  ```
  [rank0]: using GPU 0 to perform barrier as devices used by this process are currently unknown
  [rank1]: using GPU 1 to perform barrier as devices used by this process are currently unknown
  ```
- **결과**: LoRA 적용 단계 도달 실패

#### 핵심 발견
**Wan2.2 TI2V-5B는 커스텀 PyTorch 학습 루프로 직접 fine-tuning하도록 설계되지 않음**

---

## 공식 Fine-tuning 방법 발견

### DiffSynth-Studio Framework

AMD ROCm 공식 튜토리얼에서 확인:
- **소스**: https://rocm.blogs.amd.com/artificial-intelligence/finetuning-wan-part1/
- **프레임워크**: DiffSynth-Studio (특정 commit: `f0ea049faa7250f568ef0a0c268a8345481cf6d0`)
- **방식**: DeepSpeed ZeRO Stage 2 + PEFT LoRA

### 사양
```bash
Learning rate: 1e-5
Dataset repeats: 10
Epochs: 5
LoRA rank: 32
Target modules: "q,k,v,o,ffn.0,ffn.2"
Resolution: 480×832 or 1280×704
Frames: 81 or 17
VRAM: ~31GB (V100 32GB에서 실행 가능!)
```

---

## 다음 단계: DiffSynth-Studio 설치

### 설치 계획
1. DiffSynth-Studio 클론 (특정 commit)
2. 의존성 설치:
   - `deepspeed==0.16.7`
   - `diffusers`, `transformers` 등
3. DeepSpeed ZeRO Stage 2 설정
4. 데이터셋 형식 변환
5. 공식 학습 스크립트 실행

### 현재 데이터셋
- **학습**: 170,180개 샘플 (80K videos + 90K images)
- **검증**: 20,000개 샘플 (10K videos + 10K images)
- **형식**: CSV (file_path, caption, media_type)
- **해상도**: 1280×720 (대부분), 1280×704로 변환 필요

---

## 백엔드-프론트엔드 Streaming

### 구축된 인프라
- ✅ FastAPI 백엔드 (`services/backend/main.py`)
- ✅ Next.js 프론트엔드 (`services/frontend/`)
- ✅ JSON 로그 시스템 (`training_logs/`)
- ⚠️ **미검증**: 실제 학습 데이터로 테스트 안됨 (첫 학습 스텝 완료 실패로 인해)

### 향후 검증 계획
DiffSynth-Studio 학습 시작 후:
1. 학습 메트릭이 JSON으로 기록되는지 확인
2. 백엔드 API가 실시간으로 데이터 제공하는지 확인
3. 프론트엔드가 차트로 시각화하는지 확인

---

## 교훈

### 성공한 것
- ✅ 데이터 전처리 파이프라인 구축
- ✅ 품질 분석 시스템 구축
- ✅ 백엔드-프론트엔드 아키텍처 설계
- ✅ V100 GPU 환경 설정

### 실패한 것
- ❌ Wan2.2 커스텀 학습 루프 구현
- ❌ VAE 전처리 스크립트
- ❌ 분산 학습 동기화

### 배운 점
1. **공식 프레임워크 우선**: 대규모 모델은 공식 도구 사용 필수
2. **추론 vs 학습 차이**: 추론용 모델이 학습에 바로 사용 가능하지 않을 수 있음
3. **분산 학습 복잡도**: DDP/FSDP 직접 구현보다 DeepSpeed 같은 검증된 프레임워크 사용

---

## 파일 구조

### 생성된 파일
```
lora_finetuning/
├── train_lora.py           # 커스텀 학습 스크립트 (실패)
├── dataset.py              # MBC 데이터셋 로더
├── lora_config.py          # 설정 파일
└── lora_utils.py           # LoRA 유틸리티

preprocess_vae_latents.py   # VAE 전처리 스크립트 (실패)

services/
├── backend/                # FastAPI 백엔드
│   └── main.py
└── frontend/               # Next.js 프론트엔드
    ├── app/
    └── components/

training_logs/              # JSON 로그 디렉토리 (비어있음)
```

### 주요 설정
- **Checkpoint**: `./Wan2.2-TI2V-5B/`
- **Output**: `./lora_checkpoints/`
- **LoRA rank**: 32
- **Batch size**: 1 (per GPU)
- **Frame num**: 17

---

## 다음 작업: DiffSynth-Studio 마이그레이션

**예상 소요 시간**: 2-3시간
- 설치: 30분
- 데이터셋 변환: 1시간
- 학습 시작: 1시간

**예상 학습 시간**: 170K 샘플, 10 repeats, 5 epochs
- ≈ 8,500,000 스텝
- GPU당 ~5초/스텝 가정 → **총 약 118시간 (5일)**

---

**작성**: Claude Code
**상태**: Custom pipeline 포기, 공식 방법으로 전환 예정
