#!/usr/bin/env python3
"""
50K LoRA 학습 모니터링 스크립트
- 실시간 진행률 추적
- GPU 사용량 모니터링
- 예상 완료 시간 계산
"""

import os
import time
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
import json

# 설정
OUTPUT_DIR = Path("/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_480x832x9_50k")
LOG_FILE = Path("/home/maiordba/projects/vision/Wan2.2/lora_train_50k.log")
TRAINING_LOG_DIR = Path("/home/maiordba/projects/vision/Wan2.2/training_logs")
TRAINING_LOG_DIR.mkdir(exist_ok=True)

# 학습 설정
TOTAL_SAMPLES = 50000
TOTAL_EPOCHS = 3
BATCH_SIZE = 1
NUM_GPUS = 2

def get_gpu_status():
    """GPU 사용량 확인"""
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu',
             '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=5
        )
        lines = result.stdout.strip().split('\n')
        gpus = []
        for line in lines[:NUM_GPUS]:  # Only first 2 GPUs
            parts = [x.strip() for x in line.split(',')]
            if len(parts) >= 5:
                gpus.append({
                    'index': int(parts[0]),
                    'utilization': int(parts[1]),
                    'memory_used': int(parts[2]),
                    'memory_total': int(parts[3]),
                    'temperature': int(parts[4])
                })
        return gpus
    except:
        return []

def check_checkpoints():
    """체크포인트 파일 확인"""
    if not OUTPUT_DIR.exists():
        return []

    checkpoints = []
    for epoch in range(TOTAL_EPOCHS):
        ckpt_path = OUTPUT_DIR / f"epoch-{epoch}.safetensors"
        if ckpt_path.exists():
            size_mb = ckpt_path.stat().st_size / (1024 * 1024)
            mtime = datetime.fromtimestamp(ckpt_path.stat().st_mtime)
            checkpoints.append({
                'epoch': epoch,
                'size_mb': size_mb,
                'timestamp': mtime.isoformat()
            })
    return checkpoints

def estimate_completion(checkpoints):
    """완료 시간 예상"""
    if len(checkpoints) < 2:
        # 1K 학습 기준으로 예상
        hours_per_epoch = 1.5 * (TOTAL_SAMPLES / 1000)
        total_hours = hours_per_epoch * TOTAL_EPOCHS / NUM_GPUS
        return datetime.now() + timedelta(hours=total_hours)

    # 실제 학습 속도 기준으로 계산
    first_ckpt = datetime.fromisoformat(checkpoints[0]['timestamp'])
    last_ckpt = datetime.fromisoformat(checkpoints[-1]['timestamp'])

    elapsed_time = (last_ckpt - first_ckpt).total_seconds()
    epochs_completed = len(checkpoints) - 1

    if epochs_completed > 0:
        time_per_epoch = elapsed_time / epochs_completed
        remaining_epochs = TOTAL_EPOCHS - len(checkpoints)
        remaining_seconds = time_per_epoch * remaining_epochs
        return datetime.now() + timedelta(seconds=remaining_seconds)

    return None

def save_status(data):
    """상태를 JSON으로 저장"""
    status_file = TRAINING_LOG_DIR / "training_status_50k.json"
    with open(status_file, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    print("=" * 80)
    print("50K LoRA 학습 모니터링 시작")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    iteration = 0
    start_time = datetime.now()

    while True:
        iteration += 1
        current_time = datetime.now()

        # GPU 상태 확인
        gpus = get_gpu_status()

        # 체크포인트 확인
        checkpoints = check_checkpoints()

        # 진행률 계산
        progress = (len(checkpoints) / TOTAL_EPOCHS) * 100 if TOTAL_EPOCHS > 0 else 0

        # 예상 완료 시간
        eta = estimate_completion(checkpoints)

        # 화면 출력
        print(f"\n{'='*80}")
        print(f"📊 모니터링 #{iteration} - {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*80}")

        print(f"\n🎯 학습 진행률:")
        print(f"  완료된 Epoch: {len(checkpoints)}/{TOTAL_EPOCHS} ({progress:.1f}%)")
        print(f"  총 샘플: {TOTAL_SAMPLES:,}개")
        print(f"  예상 완료: {eta.strftime('%Y-%m-%d %H:%M:%S') if eta else '계산 중...'}")

        if eta:
            remaining = eta - current_time
            days = remaining.days
            hours = remaining.seconds // 3600
            minutes = (remaining.seconds % 3600) // 60
            print(f"  남은 시간: {days}일 {hours}시간 {minutes}분")

        print(f"\n📁 체크포인트:")
        if checkpoints:
            for ckpt in checkpoints:
                print(f"  epoch-{ckpt['epoch']}: {ckpt['size_mb']:.1f}MB ({ckpt['timestamp']})")
        else:
            print("  아직 체크포인트가 생성되지 않았습니다...")

        print(f"\n🖥️  GPU 상태:")
        if gpus:
            for gpu in gpus:
                bar_length = 40
                util_bars = int(gpu['utilization'] / 100 * bar_length)
                mem_pct = (gpu['memory_used'] / gpu['memory_total']) * 100
                mem_bars = int(mem_pct / 100 * bar_length)

                print(f"  GPU {gpu['index']}:")
                print(f"    사용률: [{'='*util_bars}{' '*(bar_length-util_bars)}] {gpu['utilization']}%")
                print(f"    메모리: [{'='*mem_bars}{' '*(bar_length-mem_bars)}] {gpu['memory_used']}MB / {gpu['memory_total']}MB ({mem_pct:.1f}%)")
                print(f"    온도:   {gpu['temperature']}°C")
        else:
            print("  GPU 정보를 가져올 수 없습니다.")

        # 상태 저장
        status_data = {
            'timestamp': current_time.isoformat(),
            'total_samples': TOTAL_SAMPLES,
            'total_epochs': TOTAL_EPOCHS,
            'completed_epochs': len(checkpoints),
            'progress_percent': progress,
            'eta': eta.isoformat() if eta else None,
            'checkpoints': checkpoints,
            'gpus': gpus
        }
        save_status(status_data)

        # 학습 완료 확인
        if len(checkpoints) >= TOTAL_EPOCHS:
            print(f"\n{'='*80}")
            print("✅ 학습 완료!")
            print(f"총 소요 시간: {current_time - start_time}")
            print(f"{'='*80}")
            break

        # 5분 대기
        time.sleep(300)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n모니터링 종료")
