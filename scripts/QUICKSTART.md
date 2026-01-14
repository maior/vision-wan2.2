# 웹 대시보드 빠른 시작 가이드 ⚡

## 🚀 3단계로 시작하기

### 1단계: 서비스 시작
```bash
cd /home/maiordba/projects/vision/Wan2.2
bash scripts/start_all.sh
```

### 2단계: 대시보드 접속
브라우저에서 다음 URL로 접속:
```
http://211.180.253.250:7020
```

### 3단계: 확인
- ✅ Frontend 대시보드가 보이면 성공!
- ✅ 통계 데이터가 표시됩니다

---

## 🛑 서비스 중지
```bash
bash scripts/stop_all.sh
```

---

## 📊 주요 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| 🎨 Frontend | http://211.180.253.250:7020 | 웹 대시보드 |
| 📡 Backend | http://211.180.253.250:7010 | REST API |
| 📚 API Docs | http://211.180.253.250:7010/docs | API 문서 |

---

## 📝 로그 확인
```bash
# Backend 로그
tail -f scripts/backend.log

# Frontend 로그
tail -f scripts/frontend.log
```

---

## ⚠️ 문제 발생 시

### Frontend 접속 안 됨
```bash
cat scripts/frontend.log
bash scripts/frontend_stop.sh
bash scripts/frontend_start.sh
```

### Backend 오류
```bash
cat scripts/backend.log
bash scripts/backend_stop.sh
bash scripts/backend_start.sh
```

### 포트 충돌
```bash
# 기존 프로세스 종료
bash scripts/stop_all.sh

# 강제 종료
lsof -i :7010 && kill -9 <PID>
lsof -i :7020 && kill -9 <PID>
```

---

## 🎯 다음 단계

1. **데이터 전처리**
   ```bash
   python preprocess_mbc_data.py
   ```

2. **품질 검증**
   ```bash
   python validate_data_quality.py --sample_size 10
   ```

3. **V100 학습**
   ```bash
   bash train_v100_test.sh  # 오버피팅 테스트
   bash train_v100.sh       # 전체 학습
   ```

---

## 📖 자세한 문서
- `scripts/README.md` - 스크립트 상세 설명
- `DASHBOARD_SETUP.md` - 완전한 설정 가이드
- `V100_NEXT_STEPS.md` - 학습 가이드
