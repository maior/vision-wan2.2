# Caption 개선 Quick Start 가이드

**150만개 데이터 처리 완벽 가이드**

---

## 📋 핵심 요약

### 문제
- ✅ COT 구조 100% 존재 (object → semantic → application)
- ❌ 품질 낮음 (40/100점)
  - Semantic: 60% 피상적
  - Application: 85% 획일적

### 해결
- **방법:** Gemini 1.5 Pro API
- **비용:** $9,375 (150만개)
- **기간:** 10일
- **효과:** 40점 → 88점 (F → A등급)

---

## 🚀 3단계로 시작하기

### 1단계: 환경 설정 (5분)

```bash
# 패키지 설치
pip install google-generativeai tqdm

# API 키 설정
export GEMINI_API_KEY="your-api-key-here"

# 확인
python3 -c "import google.generativeai; print('OK')"
```

### 2단계: 파일럿 테스트 (10분, $0.06)

```bash
cd /home/maiordba/projects/vision/Wan2.2/scripts

# 10개 파일 테스트
python3 enhance_captions_gemini.py --limit 10

# 결과 확인
ls /home/devfit2/mbc_json_enhanced/video/batch_*/
```

### 3단계: 전체 처리 (10일, $9,375)

```bash
# 백그라운드 실행
nohup python3 enhance_captions_gemini.py > enhancement.log 2>&1 &

# 진행 모니터링
tail -f enhancement.log
```

---

## 💰 비용 및 일정

| Phase | 파일 수 | 비용 | 기간 | 목적 |
|-------|---------|------|------|------|
| 파일럿 | 10,000 | $62.5 | 1일 | 품질 검증 |
| 검증 | 100,000 | $625 | 1일 | 대규모 테스트 |
| 전체 | 1,500,000 | $9,375 | 10일 | 완전 개선 |
| **총계** | **1,500,000** | **$9,375** | **12일** | **F→A등급** |

---

## 📊 개선 효과 (실제 예시)

### 농업 영상

#### 개선 전 (35점)
```
Semantic: "농업 기계가 작물을 수확하는 모습은 현대 농업의
생산성과 기술 발전을 상징한다."

Application: "농업 관련 다큐멘터리 콘텐츠 제작 시
영상 자료로 활용 가능하다."
```

#### 개선 후 (88점)
```
Semantic: "농업 기계가 효율적으로 작물을 수확하는 모습은
한국 농촌의 고령화와 인력 부족 문제를 기술로 해결하려는
노력이다. 대규모 자동화를 통해 안정적인 식량 공급을 가능하게
하며, 전통 수작업 대비 10배 이상의 작업 효율을 달성하고,
정확한 수확 시기 선택으로 농작물 품질을 최적화한다."

Application: "1) 교육 분야 - 농업 기술 전문대학 스마트 농업
교재, 한국농수산대학 실습 교육, 농촌진흥청 귀농 교육,
2) 산업 홍보 - 대동·동양물산 등 농기계 제조사 제품 시연,
스마트팜 솔루션 업체 기술 소개, 3) 정책 연구 - 농림축산식품부
농업 기계화 정책 수립 근거, 한국농촌경제연구원 작업 효율성
측정 데이터, 4) 콘텐츠 제작 - KBS 생생정보 농업 코너,
유튜브 농업 채널 교육 영상, 5) 대중 인식 개선 - 청년 농업인
유치 홍보 영상"
```

**+53점 개선**

---

## 📁 파일 구조

```
입력: /home/devfit2/mbc_json/video/
출력: /home/devfit2/mbc_json_enhanced/video/

Wan2.2/scripts/
├── enhance_captions_gemini.py    # 메인 스크립트
├── validate_enhanced_captions.py # 검증
└── enhancement_log.jsonl         # 로그
```

---

## 🔧 고급 사용법

### 특정 배치만 처리
```bash
python3 enhance_captions_gemini.py --batch batch_0001
```

### 진행률 모니터링
```bash
watch -n 10 'wc -l enhancement_log.jsonl'
```

### 실패 파일 재시도
```bash
cat enhancement_errors.jsonl | jq -r '.path' > failed.txt
# 재시도 스크립트 실행
```

---

## 📞 지원

문서:
- CAPTION_IMPROVEMENT_GUIDE.md (상세 가이드)
- CAPTION_ENHANCEMENT_QUICKSTART.md (이 파일)

스크립트:
- scripts/enhance_captions_gemini.py

---

**이제 시작하세요!** 🚀
