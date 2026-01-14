# 데이터 품질 검증 요약

## 생성된 도구

### 1. 자동 검증 스크립트
**`validate_data_quality.py`** - 전체 데이터셋 품질 자동 검사

**사용법:**
```bash
# 전체 검증
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --output ./quality_report.csv

# 샘플 검증 (3개 배치)
python validate_data_quality.py \
  --data_root /home/devfit2/mbc_json \
  --sample_size 3 \
  --output ./quality_sample.csv
```

**검증 항목:**
- JSON 구조 무결성
- Caption 품질 (길이, 반복 패턴, 완성도)
- 메타데이터 정확성 (해상도, 길이)
- STT 품질 (비디오)
- 파일 존재 및 읽기 가능 여부

### 2. 수동 검사 도구
**`inspect_samples.py`** - 랜덤 샘플 시각화

**사용법:**
```bash
python inspect_samples.py \
  --data_root /home/devfit2/mbc_json \
  --num_samples 20 \
  --output_dir ./sample_inspection
```

**출력:** 비디오/이미지 + Caption + 메타데이터를 하나의 이미지로 결합

## 데이터 품질이 중요한 이유

| 문제 유형 | 영향 | 심각도 |
|----------|------|--------|
| Caption과 영상 불일치 | 잘못된 학습, 환각 발생 | ⚠️⚠️⚠️ 매우 높음 |
| 짧거나 불완전한 Caption | 정보 부족 | ⚠️⚠️⚠️ 높음 |
| 반복/패턴 오류 | 노이즈 학습 | ⚠️⚠️ 중간 |
| 중복 데이터 | 과적합 | ⚠️⚠️ 중간 |

## 권장 워크플로우

1. **샘플 검증** (10분)
   ```bash
   python validate_data_quality.py --sample_size 5
   ```

2. **수동 확인** (20분)
   ```bash
   python inspect_samples.py --num_samples 30
   # 생성된 이미지들을 육안으로 확인
   ```

3. **전체 검증** (수 시간, 옵션)
   ```bash
   nohup python validate_data_quality.py > validate.log 2>&1 &
   ```

4. **문제 데이터 필터링**
   - quality_report.csv 분석
   - 심각한 이슈가 있는 데이터 제거
   - 클린 데이터셋 생성

## 다음 단계: 웹 대시보드

데이터 품질 및 전처리 과정을 시각화하는 웹 애플리케이션 개발:

- **Backend**: FastAPI
- **Frontend**: Next.js
- **Database**: SQLite

→ 실시간으로 데이터 품질 모니터링 및 전처리 진행 상황 확인

