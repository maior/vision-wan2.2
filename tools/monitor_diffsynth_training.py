#!/usr/bin/env python3
"""
DiffSynth-Studio 학습 로그를 파싱해서 프론트엔드용 JSON으로 변환
"""
import re
import json
import time
from pathlib import Path
from datetime import datetime

# 로그 파일 경로
LOG_FILE = Path("/home/maiordba/projects/vision/Wan2.2/diffsynth_train.log")
OUTPUT_DIR = Path("/home/maiordba/projects/vision/Wan2.2/training_logs")
OUTPUT_FILE = OUTPUT_DIR / "training_gpu0.json"

# 출력 디렉토리 생성
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def parse_log_line(line):
    """로그 라인에서 학습 정보 추출"""
    # 예상 로그 형식: epoch X, step Y/Z, loss: 0.123, lr: 0.0001
    patterns = [
        r'epoch[:\s]+(\d+)',
        r'step[:\s]+(\d+)/?(\d*)',
        r'loss[:\s]+([\d.]+)',
        r'lr[:\s]+([\d.e-]+)',
    ]

    result = {}
    for pattern in patterns:
        match = re.search(pattern, line, re.IGNORECASE)
        if match:
            groups = match.groups()
            if 'epoch' in pattern:
                result['epoch'] = int(groups[0])
            elif 'step' in pattern:
                result['step'] = int(groups[0])
                if groups[1]:
                    result['total_steps'] = int(groups[1])
            elif 'loss' in pattern:
                result['loss'] = float(groups[0])
            elif 'lr' in pattern:
                result['lr'] = float(groups[0])

    return result if result else None

def get_gpu_status():
    """nvidia-smi로 GPU 상태 가져오기"""
    import subprocess
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=memory.used,utilization.gpu', '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if lines:
                # GPU 0 정보만 사용
                memory, util = lines[0].split(',')
                return {
                    'memory_used_mb': float(memory.strip()),
                    'utilization': float(util.strip())
                }
    except Exception as e:
        print(f"GPU status error: {e}")
    return {'memory_used_mb': 0, 'utilization': 0}

def monitor_training():
    """학습 로그 모니터링 및 JSON 변환"""
    print("DiffSynth-Studio 학습 모니터링 시작...")

    # 기존 데이터 로드
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, 'r') as f:
                metrics = json.load(f)
        except:
            metrics = []
    else:
        metrics = []

    last_position = 0
    last_update_time = time.time()

    while True:
        try:
            # 로그 파일이 존재하는지 확인
            if not LOG_FILE.exists():
                print(f"로그 파일을 기다리는 중: {LOG_FILE}")
                time.sleep(5)
                continue

            # 새로운 로그 라인 읽기
            with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                f.seek(last_position)
                new_lines = f.readlines()
                last_position = f.tell()

            # 로그 파싱
            for line in new_lines:
                data = parse_log_line(line)
                if data:
                    # 타임스탬프 추가
                    data['timestamp'] = datetime.now().isoformat()

                    # GPU 상태 추가
                    gpu_status = get_gpu_status()
                    data.update(gpu_status)

                    # Progress 계산
                    if 'step' in data and 'total_steps' in data and data['total_steps'] > 0:
                        data['progress'] = (data['step'] / data['total_steps']) * 100

                    metrics.append(data)
                    print(f"Step {data.get('step', '?')}: Loss={data.get('loss', '?'):.4f}")

            # 5초마다 또는 새로운 메트릭이 있을 때 저장
            current_time = time.time()
            if new_lines and (current_time - last_update_time) >= 5:
                # GPU가 활성화되어 있다면 현재 상태 저장
                gpu_status = get_gpu_status()
                if gpu_status['utilization'] > 0:
                    # 마지막 메트릭에 현재 GPU 상태 업데이트
                    if not metrics:
                        metrics.append({
                            'epoch': 0,
                            'step': 0,
                            'total_steps': 0,
                            'loss': 0,
                            'lr': 0,
                            'progress': 0,
                            'timestamp': datetime.now().isoformat(),
                            **gpu_status
                        })

                    # JSON 저장
                    with open(OUTPUT_FILE, 'w') as f:
                        json.dump(metrics, f, indent=2)

                    last_update_time = current_time
                    print(f"저장됨: {len(metrics)} 메트릭")

            # 2초 대기
            time.sleep(2)

        except KeyboardInterrupt:
            print("\n모니터링 종료")
            break
        except Exception as e:
            print(f"오류: {e}")
            time.sleep(5)

if __name__ == "__main__":
    monitor_training()
