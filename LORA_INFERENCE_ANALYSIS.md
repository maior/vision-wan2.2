# LoRA 추론 결과 분석 및 재실행 필요

**작성일**: 2025-11-11
**분석자**: Claude Code
**상태**: ⚠️ 재실행 필요

---

## 1. 핵심 발견

### 🚨 중요: 현재 생성된 비디오는 LoRA 없이 생성되었습니다

현재 `/home/maiordba/projects/vision/Wan2.2/lora_inference_results/`에 있는 3개 비디오는:
- ❌ **LoRA 가중치가 적용되지 않았습니다**
- ✅ 베이스 모델 (Wan2.2-TI2V-5B)만으로 생성되었습니다
- ✅ 학습된 LoRA 체크포인트 (epoch-0.safetensors)는 존재하지만 사용되지 않았습니다

---

## 2. 문제 원인 분석

### 코드 레벨 분석

**파일**: `/home/maiordba/projects/vision/Wan2.2/test_lora_inference.py`

**문제 코드 (47번째 줄)**:
```python
try:
    pipe.dit.load_lora(lora_path)  # ❌ 잘못된 메서드 호출
    print("LoRA weights loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load LoRA directly. Trying alternative method...")
    from safetensors.torch import load_file
    lora_weights = load_file(lora_path)
    print(f"LoRA weights keys: {list(lora_weights.keys())[:5]}...")
    # 이 부분은 DiffSynth의 LoRA 구조에 따라 조정이 필요할 수 있습니다
    # ⚠️ 실제로 모델에 적용하는 코드가 없음!
```

**로그 증거**:
```
Loading LoRA weights from .../diffsynth_lora_output_480x832x9_1k/epoch-0.safetensors...
Warning: Could not load LoRA directly. Trying alternative method...
LoRA weights keys: ['blocks.0.cross_attn.k.lora_A.default.weight', ...]
```

→ 예외가 발생했고, except 블록에서 safetensors를 읽기만 하고 모델에 적용하지 않았습니다.

### 올바른 방법

**DiffSynth 공식 예제에서 확인한 올바른 방법**:

```python
# ✅ 올바른 방법
pipe.load_lora(pipe.dit, lora_path, alpha=1.0)
```

**참고**: `/home/maiordba/projects/vision/diffsynth-studio/examples/wanvideo/model_training/validate_lora/` 의 모든 예제

---

## 3. 현재 결과 재평가

### 현재 생성된 비디오 메트릭 (LoRA 없음)

| 영상 | CLIP Score | FVD Score | Sharpness | Overall Quality | 평가 |
|-----|-----------|----------|-----------|----------------|------|
| **test1 (Seoul)** | 0.602 | 68.96 | 100% | 93.1% | S급 |
| **test2 (Nature)** | 0.622 | 82.03 | 88.4% | 91.8% | S급 |
| **test3 (Action)** | 0.599 | 256.36 | 29.3% | 74.4% | C급 |

### 의미

이 결과는:
- ✅ **베이스 모델 (Wan2.2-TI2V-5B)의 성능**을 나타냅니다
- ✅ **RAPA 2025 기준을 통과**했습니다 (CLIP ≥0.3, FVD ≤1140)
- ⚠️ **LoRA 학습의 효과를 반영하지 않습니다**

### LoRA 적용 시 예상 개선

LoRA는 1,000개 샘플로 학습되었으므로:
- 🎯 **도메인 적응**: 한국어 프롬프트와 특정 장면에 더 잘 반응
- 🎯 **스타일 일관성**: 학습 데이터의 시각적 스타일 반영
- 🎯 **품질 향상**: Sharpness, Temporal Consistency 등에서 5-15% 개선 예상
- 🎯 **FVD 감소**: 평균 10-30 감소 예상

---

## 4. 해결 방안

### 수정된 추론 스크립트 작성

**파일**: `/home/maiordba/projects/vision/Wan2.2/test_lora_inference_fixed.py`

**주요 변경사항**:
```python
# 올바른 LoRA 로드
pipe.load_lora(pipe.dit, lora_path, alpha=1.0)
print("✅ LoRA weights loaded and applied successfully!")
```

**출력 디렉토리**: `/home/maiordba/projects/vision/Wan2.2/lora_inference_results_with_lora/`

### 실행 방법

```bash
# 수정된 스크립트 실행
cd /home/maiordba/projects/vision/Wan2.2
python test_lora_inference_fixed.py

# 예상 실행 시간: 약 5-10분 (3개 비디오)
# GPU 메모리: 약 15-20GB 사용
```

---

## 5. 비교 분석 계획

### 실행 후 비교할 메트릭

| 메트릭 | 베이스 모델 (현재) | LoRA 모델 (재실행) | 예상 변화 |
|-------|------------------|------------------|----------|
| **CLIP Score** | 0.608 (평균) | ? | +0.02~0.05 |
| **FVD Score** | 135.79 (평균) | ? | -10~-30 |
| **Sharpness** | 72.6% (평균) | ? | +5~15% |
| **Overall Quality** | 85.1% (평균) | ? | +3~8% |

### 재실행 후 할 일

1. **메트릭 재계산**:
   ```bash
   python calculate_video_metrics.py \
     --results_dir /home/maiordba/projects/vision/Wan2.2/lora_inference_results_with_lora \
     --output metrics_results_with_lora.json
   ```

2. **비교 보고서 작성**:
   - 베이스 모델 vs LoRA 모델 비교
   - 시각적 차이 분석
   - LoRA 학습 효과 검증

3. **프론트엔드 업데이트**:
   - 두 결과를 나란히 비교할 수 있는 UI 추가
   - "With LoRA" vs "Without LoRA" 토글

---

## 6. LoRA 학습 효과 검증

### 검증 항목

1. **정량적 평가**:
   - CLIP Score 개선도
   - FVD Score 감소량
   - Quality Metrics 향상도

2. **정성적 평가**:
   - 한국어 프롬프트 이해도
   - 시각적 디테일 품질
   - 동작의 자연스러움

3. **학습 데이터 반영도**:
   - 학습 데이터의 스타일이 반영되었는가?
   - 특정 장면 (도시, 자연, 액션)에서 개선이 있는가?

---

## 7. 결론

### 현재 상태

❌ **현재 결과는 LoRA 학습의 효과를 보여주지 않습니다**
- 코드 오류로 인해 LoRA 가중치가 적용되지 않았습니다
- 생성된 비디오는 베이스 모델의 성능만 반영합니다

### 다음 단계

1. ✅ **수정된 스크립트 작성 완료** (`test_lora_inference_fixed.py`)
2. ⏳ **재실행 필요** - 올바른 LoRA 적용으로 비디오 재생성
3. ⏳ **메트릭 재계산** - 새로운 비디오에 대해 CLIP, FVD 측정
4. ⏳ **비교 분석** - 베이스 모델 vs LoRA 모델 비교

### 예상 결과

LoRA 학습이 올바르게 적용되면:
- 📈 **CLIP Score**: 0.61 → 0.64 (약 +5%)
- 📉 **FVD Score**: 136 → 110 (약 -20%)
- 📈 **Overall Quality**: 85% → 90% (약 +5%)
- 🎯 **test3 (Action)의 Sharpness 개선**: 29% → 50%+ 기대

---

## 8. 실행 명령어 요약

```bash
# 1. 수정된 스크립트로 재실행
cd /home/maiordba/projects/vision/Wan2.2
python test_lora_inference_fixed.py

# 2. 메트릭 계산
python calculate_video_metrics.py \
  --results_dir ./lora_inference_results_with_lora \
  --output metrics_results_with_lora.json

# 3. 결과 비교
ls -lh lora_inference_results/
ls -lh lora_inference_results_with_lora/
```

---

**보고서 작성**: Claude Code
**검증 필요**: LoRA 적용 후 재실행
**문서 버전**: 1.0
**업데이트 예정**: 재실행 완료 후
