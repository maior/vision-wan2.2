#!/usr/bin/env python3
"""
이미지 GPU 가속 리사이징
PyTorch + CUDA를 사용한 초고속 처리
"""

import os
import csv
import argparse
from pathlib import Path
import time
from datetime import datetime
import torch
import torchvision.transforms.functional as TF
from PIL import Image
from multiprocessing import Queue, Process
from queue import Empty

def gpu_worker(gpu_id, input_queue, result_queue, target_width, target_height, batch_size):
    """GPU 워커 프로세스"""
    device = torch.device(f'cuda:{gpu_id}')

    while True:
        batch = []
        paths = []

        # 배치 수집
        for _ in range(batch_size):
            try:
                item = input_queue.get(timeout=1)
                if item is None:  # 종료 신호
                    break
                batch.append(item)
            except Empty:
                break

        if not batch:
            break

        # 배치 처리
        for src_path, dst_path in batch:
            try:
                # 이미 변환된 파일 건너뛰기
                if os.path.exists(dst_path):
                    result_queue.put(('skip', src_path))
                    continue

                # 디렉토리 생성
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)

                # 이미지 로드
                img = Image.open(src_path).convert('RGB')

                # Tensor로 변환 (GPU로 전송)
                img_tensor = TF.to_tensor(img).unsqueeze(0).to(device)

                # GPU에서 리사이징
                resized = torch.nn.functional.interpolate(
                    img_tensor,
                    size=(target_height, target_width),
                    mode='bicubic',
                    align_corners=False
                )

                # CPU로 가져와서 저장
                resized_cpu = resized.squeeze(0).cpu()
                resized_pil = TF.to_pil_image(resized_cpu)
                resized_pil.save(dst_path, quality=95)

                result_queue.put(('success', src_path))

            except Exception as e:
                result_queue.put(('error', f"{src_path}: {str(e)}"))


def result_collector(result_queue, total_tasks, start_time):
    """결과 수집 프로세스"""
    success_count = 0
    skip_count = 0
    error_count = 0

    for i in range(total_tasks):
        status, path = result_queue.get()

        if status == 'success':
            success_count += 1
        elif status == 'skip':
            skip_count += 1
        else:  # error
            error_count += 1
            print(f"[ERROR] {path}")

        # 진행률 출력
        if (i + 1) % 100 == 0:
            elapsed = time.time() - start_time
            speed = (i + 1) / elapsed if elapsed > 0 else 0
            remaining = (total_tasks - i - 1) / speed if speed > 0 else 0

            print(f"[진행률] {i+1:,}/{total_tasks:,} ({(i+1)/total_tasks*100:.1f}%) | "
                  f"속도: {speed:.1f} 이미지/초 | "
                  f"남은시간: {remaining/60:.1f}분 | "
                  f"성공: {success_count:,} | 에러: {error_count:,}")

    return success_count, skip_count, error_count


def main():
    parser = argparse.ArgumentParser(description='이미지 GPU 가속 리사이징')
    parser.add_argument('--batch-size', type=int, default=32,
                       help='GPU 배치 크기 (기본: 32)')
    parser.add_argument('--gpus', type=int, default=2,
                       help='사용할 GPU 수 (기본: 2)')
    parser.add_argument('--resume', action='store_true',
                       help='중단된 작업 재개')
    parser.add_argument('--size', type=str, default='1280x720',
                       help='목표 해상도')

    args = parser.parse_args()

    target_width, target_height = map(int, args.size.split('x'))

    print("=" * 60)
    print("GPU 가속 이미지 리사이징")
    print("=" * 60)
    print(f"GPU 수: {args.gpus}")
    print(f"배치 크기: {args.batch_size}")
    print(f"목표 해상도: {target_width}x{target_height}")
    print("=" * 60)

    # CUDA 확인
    if not torch.cuda.is_available():
        print("[ERROR] CUDA를 사용할 수 없습니다!")
        return

    print(f"[INFO] 사용 가능한 GPU: {torch.cuda.device_count()}개")
    for i in range(min(args.gpus, torch.cuda.device_count())):
        print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")

    # CSV 읽기
    csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
    output_dir = f'/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_{args.size}_gpu'

    if args.resume:
        existing_count = sum(1 for _ in Path(output_dir).rglob('*.png')) if os.path.exists(output_dir) else 0
        print(f"\n[INFO] 재개 모드: 이미 완료된 {existing_count:,}개 건너뜀\n")

    print(f"[INFO] CSV 파일 읽는 중: {csv_path}")

    tasks = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['media_type'] != 'image':
                continue

            src_path = row['file_path']
            rel_path = os.path.relpath(src_path, '/home/devfit2/mbc_json/image')
            dst_path = os.path.join(output_dir, rel_path)

            if args.resume and os.path.exists(dst_path):
                continue

            tasks.append((src_path, dst_path))

    print(f"[INFO] 변환할 이미지: {len(tasks):,}개")
    print(f"\n[INFO] 변환 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[INFO] 출력 디렉토리: {output_dir}\n")

    os.makedirs(output_dir, exist_ok=True)

    # 큐 생성
    input_queue = Queue(maxsize=1000)
    result_queue = Queue()

    # GPU 워커 시작
    workers = []
    for gpu_id in range(min(args.gpus, torch.cuda.device_count())):
        p = Process(
            target=gpu_worker,
            args=(gpu_id, input_queue, result_queue, target_width, target_height, args.batch_size)
        )
        p.start()
        workers.append(p)

    start_time = time.time()

    # 작업 투입
    for task in tasks:
        input_queue.put(task)

    # 종료 신호
    for _ in workers:
        input_queue.put(None)

    # 결과 수집
    success_count, skip_count, error_count = result_collector(result_queue, len(tasks), start_time)

    # 워커 종료 대기
    for p in workers:
        p.join()

    elapsed_time = time.time() - start_time

    print("\n" + "=" * 60)
    print("변환 완료!")
    print("=" * 60)
    print(f"총 처리: {len(tasks):,}개")
    print(f"성공: {success_count:,}개")
    print(f"건너뜀: {skip_count:,}개")
    print(f"실패: {error_count:,}개")
    print(f"소요 시간: {elapsed_time/60:.1f}분")
    print(f"평균 속도: {len(tasks)/elapsed_time:.1f} 이미지/초")
    print(f"출력 디렉토리: {output_dir}")
    print("=" * 60)


if __name__ == '__main__':
    main()
