#!/usr/bin/env python3
"""
개선된 학습 모니터 - GPU 0, 1 및 예상 시간 표시
"""
import json
import subprocess
import time
from pathlib import Path
from datetime import datetime, timedelta

OUTPUT_DIR = Path("/home/maiordba/projects/vision/Wan2.2/training_logs")
OUTPUT_FILE_GPU0 = OUTPUT_DIR / "training_gpu0.json"
OUTPUT_FILE_GPU1 = OUTPUT_DIR / "training_gpu1.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 학습 설정 파일에서 자동으로 읽기
CONFIG_FILE = Path("/home/maiordba/projects/vision/Wan2.2/training_config.json")

def load_training_config():
    """학습 설정 파일에서 정보 읽기"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config
        except:
            pass
    # 기본값 (없으면)
    return {
        "total_samples": 5000,
        "num_gpus": 2,
        "num_epochs": 1,
        "steps_per_epoch": 2500
    }

# 시작 시간 기록
start_time = time.time()
# 설정 로드
training_config = load_training_config()
total_steps_estimate = training_config["steps_per_epoch"]
total_epochs = training_config["num_epochs"]

print(f"=== Training Configuration ===")
print(f"Total samples: {training_config['total_samples']}")
print(f"Number of GPUs: {training_config['num_gpus']}")
print(f"Epochs: {total_epochs}")
print(f"Steps per epoch: {total_steps_estimate}")
print(f"==============================\n")

def get_gpu_status():
    """GPU 0, 1 상태 가져오기"""
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=memory.used,utilization.gpu', '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            gpus = []
            for line in lines[:2]:  # GPU 0, 1
                memory, util = line.split(',')
                gpus.append({
                    'memory_used_mb': float(memory.strip()),
                    'utilization': float(util.strip())
                })
            return gpus
    except Exception as e:
        print(f"GPU status error: {e}")
    return [
        {'memory_used_mb': 0, 'utilization': 0},
        {'memory_used_mb': 0, 'utilization': 0}
    ]

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

def calculate_eta(current_step, total_steps, elapsed_time):
    """예상 완료 시간 계산"""
    if current_step == 0:
        return "계산 중..."

    steps_per_second = current_step / elapsed_time
    remaining_steps = total_steps - current_step
    remaining_seconds = remaining_steps / steps_per_second if steps_per_second > 0 else 0

    eta_time = datetime.now() + timedelta(seconds=remaining_seconds)

    # 남은 시간을 시:분:초로 표시
    hours = int(remaining_seconds // 3600)
    minutes = int((remaining_seconds % 3600) // 60)
    seconds = int(remaining_seconds % 60)

    return f"{hours}h {minutes}m {seconds}s (ETA: {eta_time.strftime('%H:%M:%S')})"

print("개선된 학습 모니터 시작...")

step = 0
while True:
    try:
        gpu_statuses = get_gpu_status()
        is_training = check_training_process()

        # 현재 경과 시간
        elapsed_time = time.time() - start_time

        # GPU 0, 1 모두 처리
        for gpu_id in [0, 1]:
            gpu_status = gpu_statuses[gpu_id]
            output_file = OUTPUT_FILE_GPU0 if gpu_id == 0 else OUTPUT_FILE_GPU1

            # GPU가 활성화되어 있고 학습 프로세스가 실행 중이면
            if gpu_status['utilization'] > 50 and is_training:
                if gpu_id == 0:
                    step += 1

                # ETA 계산
                eta = calculate_eta(step, total_steps_estimate, elapsed_time)

                current_epoch = (step // total_steps_estimate) + 1 if total_steps_estimate > 0 else 1
                epoch_step = step % total_steps_estimate if total_steps_estimate > 0 else step

                metric = {
                    'epoch': current_epoch,
                    'total_epochs': total_epochs,
                    'step': epoch_step if epoch_step > 0 else total_steps_estimate,
                    'total_steps': total_steps_estimate,
                    'global_step': step,
                    'loss': 0.5,  # 임시 값 - 실제 로그에서 파싱 가능
                    'lr': 0.0001,
                    'progress': min(100, (step / (total_steps_estimate * total_epochs)) * 100),
                    'timestamp': datetime.now().isoformat(),
                    'eta': eta,
                    'elapsed_time': f"{int(elapsed_time//3600)}h {int((elapsed_time%3600)//60)}m {int(elapsed_time%60)}s",
                    **gpu_status
                }

                # JSON 파일 로드 또는 생성
                if output_file.exists():
                    try:
                        with open(output_file, 'r') as f:
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
                with open(output_file, 'w') as f:
                    json.dump(metrics, f, indent=2)

                if gpu_id == 0:
                    print(f"Step {step}/{total_steps_estimate}: GPU0={gpu_statuses[0]['utilization']}%, GPU1={gpu_statuses[1]['utilization']}%, ETA={eta}")
            else:
                if gpu_id == 0:
                    print(f"대기 중... GPU0={gpu_statuses[0]['utilization']}%, GPU1={gpu_statuses[1]['utilization']}%, Training={is_training}")

        time.sleep(10)  # 10초마다 업데이트

    except KeyboardInterrupt:
        print("\n모니터링 종료")
        break
    except Exception as e:
        print(f"오류: {e}")
        import traceback
        traceback.print_exc()
        time.sleep(5)
