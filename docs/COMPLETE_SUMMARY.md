# Wan2.2 LoRA Fine-tuning 및 Data Quality Dashboard 완료 요약

## 완료된 작업

### 1. 데이터 전처리 ✅
- **199,994개** MBC 데이터 전처리 완료
- Train/Val split (90/10)
- CSV 생성: `preprocessed_data/` (904MB)

### 2. 데이터 품질 검증 도구 ✅
- `validate_data_quality.py` - 자동 품질 검증
- `inspect_samples.py` - 수동 시각적 검증
- `DATA_QUALITY_GUIDE.md` - 품질 검증 가이드

### 3. LoRA Fine-tuning 프레임워크 ✅
- `lora_finetuning/dataset.py` - 데이터 로더
- `lora_finetuning/lora_config.py` - 설정 관리
- `lora_finetuning/train_lora.py` - 학습 스크립트
- `lora_finetuning/preprocess_resize.py` - 해상도 변환

### 4. 웹 대시보드 ✅
- **Backend**: FastAPI (포트 7010)
- **Frontend**: Next.js (포트 7020)
- **Database**: SQLite

## 파일 구조

```
Wan2.2/
├── preprocessed_data/              # 전처리된 데이터 (904MB)
│   ├── all_train.csv (179,994개)
│   └── all_val.csv (20,000개)
│
├── lora_finetuning/                # LoRA 학습
│   ├── dataset.py
│   ├── lora_config.py
│   ├── train_lora.py
│   └── preprocess_resize.py
│
├── services/                       # 웹 대시보드
│   ├── backend/                    # FastAPI (포트 7010)
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   └── api/
│   │   ├── requirements.txt
│   │   └── run.sh
│   └── frontend/                   # Next.js (포트 7020)
│       ├── app/
│       ├── lib/
│       └── package.json
│
├── validate_data_quality.py        # 품질 검증
├── inspect_samples.py              # 샘플 시각화
│
└── 문서/
    ├── PREPROCESSING_REPORT.md
    ├── DATA_QUALITY_GUIDE.md
    ├── LORA_SETUP_GUIDE.md
    └── services/README.md
```

## 빠른 시작

### 데이터 품질 검증

```bash
# 1. 샘플 검증 (10분)
python validate_data_quality.py --sample_size 5

# 2. 시각적 확인 (20분)
python inspect_samples.py --num_samples 30
```

### 웹 대시보드 실행

```bash
# Backend (터미널 1)
cd services/backend
pip install -r requirements.txt
bash run.sh
# → http://localhost:7010

# Frontend (터미널 2)
cd services/frontend
npm install
npm run dev
# → http://localhost:7020
```

### LoRA 학습

```bash
# 8 GPU
torchrun --nproc_per_node=8 lora_finetuning/train_lora.py \
  --train_csv ./preprocessed_data/all_train.csv \
  --val_csv ./preprocessed_data/all_val.csv \
  --ckpt_dir ./Wan2.2-T2V-A14B \
  --output_dir ./lora_checkpoints
```

## 주요 포인트

### 데이터 품질
- Caption과 영상 불일치가 **가장 치명적**
- 최소 20-50개 샘플 수동 확인 권장
- 품질 필터링으로 5-20% 데이터 제거 예상

### LoRA 학습
- **메모리**: 8×A100 80GB 권장
- **Effective Batch Size**: 32 (1×4×8)
- **예상 시간**: ~36시간 (3 epochs)

### 웹 대시보드
- 실시간 데이터 품질 모니터링
- 전처리 진행 상황 추적
- API 문서: http://localhost:7010/docs

## 다음 단계

### 우선순위 1 (필수)
1. **데이터 품질 검증 실행**
   ```bash
   python validate_data_quality.py
   python inspect_samples.py --num_samples 50
   ```

2. **Wan2.2 모델 통합**
   - VAE 인코딩
   - DiT forward pass
   - Loss 계산

### 우선순위 2 (권장)
3. **작은 데이터로 오버피팅 테스트**
4. **웹 대시보드에 데이터 로드**
5. **해상도 변환** (시간 소요, 선택)

## 참고 문서

- `DATA_QUALITY_GUIDE.md` - 품질 검증 상세 가이드
- `LORA_SETUP_GUIDE.md` - LoRA 학습 빠른 시작
- `services/README.md` - 웹 대시보드 설정
- `PREPROCESSING_REPORT.md` - 데이터 분석 보고서

## 완료!

모든 인프라가 준비되었습니다. 이제 품질 검증 → 모델 통합 → 학습 시작할 수 있습니다!
