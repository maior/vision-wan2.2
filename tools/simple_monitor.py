#!/usr/bin/env python3
"""
간단한 학습 모니터 - GPU 상태만이라도 표시
"""
import json
import subprocess
import time
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path("/home/maiordba/projects/vision/Wan2.2/training_logs")
OUTPUT_FILE = OUTPUT_DIR / "training_gpu0.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def get_gpu_status():
    """GPU 상태 가져오기"""
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=memory.used,utilization.gpu', '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if lines and len(lines) >= 1:
                memory, util = lines[0].split(',')
                return {
                    'memory_used_mb': float(memory.strip()),
                    'utilization': float(util.strip())
                }
    except Exception as e:
        print(f"GPU status error: {e}")
    return {'memory_used_mb': 0, 'utilization': 0}

def check_training_process():
    """train.py 프로세스가 실행 중인지 확인"""
    try:
        result = subprocess.run(
            ['ps', 'aux'],
            capture_output=True, text=True, timeout=5
        )
        return 'train.py' in result.stdout
    except:
        return False

print("간단한 학습 모니터 시작...")

step = 0
while True:
    try:
        gpu_status = get_gpu_status()
        is_training = check_training_process()

        # GPU가 활성화되어 있고 학습 프로세스가 실행 중이면
        if gpu_status['utilization'] > 50 and is_training:
            step += 1
            metric = {
                'epoch': 1,
                'step': step,
                'total_steps': 1000,  # 임시 값
                'loss': 0.5,  # 임시 값
                'lr': 0.0001,
                'progress': min(100, (step / 1000) * 100),
                'timestamp': datetime.now().isoformat(),
                **gpu_status
            }

            # JSON 파일 로드 또는 생성
            if OUTPUT_FILE.exists():
                try:
                    with open(OUTPUT_FILE, 'r') as f:
                        metrics = json.load(f)
                except:
                    metrics = []
            else:
                metrics = []

            metrics.append(metric)

            # 마지막 100개만 유지
            if len(metrics) > 100:
                metrics = metrics[-100:]

            # 저장
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(metrics, f, indent=2)

            print(f"Step {step}: GPU={gpu_status['utilization']}%, Memory={gpu_status['memory_used_mb']}MB")
        else:
            print(f"대기 중... GPU={gpu_status['utilization']}%, Training={is_training}")

        time.sleep(10)  # 10초마다 업데이트

    except KeyboardInterrupt:
        print("\n모니터링 종료")
        break
    except Exception as e:
        print(f"오류: {e}")
        time.sleep(5)
