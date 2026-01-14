# Critical Issue Report - LoRA Training

**Date**: 2025-11-10 21:54
**Status**: 🔴 **CRITICAL - Training Blocked**

## Problem Summary

LoRA 학습이 첫 번째 step을 완료하지 못하고 있습니다.

### 주요 증상

1. ❌ **VAE Encoding Hang**
   - Forward pass 테스트에서 VAE encoding 단계에서 5분 이상 응답 없음
   - GPU 활용률 0% 상태에서 프로세스만 메모리 점유

2. ❌ **JSON 로그 미생성**
   - `training_logs/training_gpu0.json` 파일 생성되지 않음
   - 첫 step 완료되지 않아 로깅이 시작되지 않음

3. ❌ **프론트엔드 표시 불가**
   - 백엔드 API는 정상 작동 (`/api/training/status`, `/api/training/metrics`)
   - JSON 파일이 없어 빈 데이터 반환 → 프론트엔드에서 "inactive" 표시

4. ❌ **프로세스 중복 생성**
   - 백그라운드 스크립트 실행 시 프로세스가 계속 증가 (최대 6개 확인)
   - 메모리 간섭 및 리소스 낭비

## Technical Details

### VAE Encoding Bottleneck

```
File: /home/maiordba/projects/vision/Wan2.2/lora_finetuning/train_lora.py
Lines: 172-180

# VAE encoding에서 hang 발생
with torch.no_grad():
    video_list = [videos[i] for i in range(B)]
    latents_list = model.vae.encode(video_list)  # ⬅️ 여기서 멈춤
    latents = torch.stack([l.to(rank) for l in latents_list])
```

**테스트 결과:**
- Test forward pass with batch_size=1, resolution=1280x704, frames=17
- Timeout after 300 seconds (5 minutes)
- Process stuck at VAE autocast line

### Current Implementation

```python
# lora_finetuning/train_lora.py:168-228
# 실제 구현 완료:
1. VAE encoding (frozen) ✅ 코드 작성 완료, 실행 시 hang ❌
2. Text encoding (frozen T5 on CPU) ✅
3. Diffusion noise addition ✅
4. DiT forward with LoRA ✅
5. MSE loss calculation ✅
```

## Root Causes

### 1. VAE Performance Issue
- Wan2_2_VAE는 4×16×16 압축률을 사용
- 1280x704x17 비디오 → 매우 큰 연산량
- Batch processing에서 메모리 또는 연산 병목 발생

### 2. Process Management
- 백그라운드 스크립트(`train_quick_test.sh`) 실행 시 중복 프로세스 생성
- `nohup`, `&`, `bash` 조합의 문제

### 3. Data Loading
- DataLoader의 `num_workers=4` 설정
- 첫 batch 로딩 시간이 길 수 있음

## Attempted Solutions

### ✅ Completed
1. T5 CPU-GPU 데이터 이동 수정
2. GPU 식별 로직 수정 (CUDA_VISIBLE_DEVICES 기반)
3. 실제 forward pass 구현 (VAE, Text, DiT, Loss)
4. 백엔드 API 정상 확인

### ❌ Failed
1. Forward pass 테스트 - VAE encoding에서 타임아웃
2. 학습 재시작 시도 - 동일한 hang 발생
3. 프로세스 관리 - 중복 생성 문제 지속

## Proposed Solutions

### Option 1: VAE를 CPU로 이동 (권장하지 않음)
- VAE를 CPU에서 실행하면 매우 느림
- GPU 메모리는 충분 (32GB 중 23GB 사용)

### Option 2: Batch Size 감소
- 현재: batch_size=2
- 변경: batch_size=1
- 단점: 학습 속도 감소

### Option 3: 해상도 감소
- 현재: 1280x704 (TI2V-5B 표준)
- 변경: 704x480 등
- 단점: 모델의 원래 학습 해상도와 불일치

### Option 4: Dummy Loss로 우선 테스트 ⭐ **추천**
- JSON 로그 생성 로직만 먼저 테스트
- 프론트엔드 표시 확인
- VAE 문제 분리 디버깅

### Option 5: DataLoader 수정
- `num_workers` 감소 (4 → 0 또는 1)
- `pin_memory=False`
- 첫 batch 로딩 문제 가능성

## Current Status

```
학습 프로세스: 정리됨
GPU 상태: 대기 중
백엔드 API: 정상 작동
프론트엔드: JSON 로그 대기 중
```

## Next Steps

1. **즉시**: Dummy loss로 JSON 로그 생성 테스트
2. **디버깅**: VAE encoding 병목 원인 파악
3. **장기**: 실제 학습 가능 여부 확인

## Files Modified

```
/home/maiordba/projects/vision/Wan2.2/lora_finetuning/train_lora.py
  - Lines 172-228: Forward pass 구현
  - Lines 338-348: GPU identification 수정
  - Lines 283-341: Validation forward pass

/home/maiordba/projects/vision/Wan2.2/test_forward.py
  - Forward pass 테스트 스크립트 (타임아웃 확인)
```

## Contact

Claude Code - AI Assistant
Session: 2025-11-10
