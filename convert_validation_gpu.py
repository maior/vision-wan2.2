#!/usr/bin/env python3
"""
검증 데이터 GPU 가속 변환
- 비디오: ffmpeg + NVIDIA GPU (h264_nvenc)
- 이미지: PyTorch + CUDA

15시간 → 30분~1시간으로 단축!
"""

import csv
import subprocess
import argparse
from pathlib import Path
from multiprocessing import Pool, Queue, Process
from queue import Empty
import time
import torch
import torchvision.transforms.functional as TF
from PIL import Image
import os
from tqdm import tqdm

# ffmpeg 경로
import shutil
FFMPEG_BIN = shutil.which('ffmpeg') or '/usr/bin/ffmpeg'


def convert_video_gpu(args):
    """GPU 가속 비디오 변환 (NVIDIA h264_nvenc)"""
    input_path, output_path, gpu_id = args

    try:
        cmd = [
            FFMPEG_BIN,
            '-hwaccel', 'cuda',                    # CUDA 가속
            '-hwaccel_device', str(gpu_id),        # GPU 선택
            '-i', str(input_path),
            '-vf', 'scale_cuda=1280:720:force_original_aspect_ratio=decrease,pad_cuda=1280:720:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'h264_nvenc',                  # NVIDIA GPU 인코더
            '-preset', 'p4',                       # 빠른 프리셋
            '-b:v', '5M',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',
            '-loglevel', 'error',
            str(output_path)
        ]

        subprocess.run(cmd, check=True, timeout=300,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return (True, None)
    except:
        # GPU 변환 실패 시 CPU로 fallback
        try:
            cmd = [
                FFMPEG_BIN,
                '-i', str(input_path),
                '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-y',
                '-loglevel', 'error',
                str(output_path)
            ]
            subprocess.run(cmd, check=True, timeout=300,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return (True, None)
        except Exception as e:
            return (False, str(e))


def gpu_image_worker(gpu_id, input_queue, result_queue, batch_size=32):
    """GPU 이미지 변환 워커"""
    device = torch.device(f'cuda:{gpu_id}')

    while True:
        batch = []

        # 배치 수집
        for _ in range(batch_size):
            try:
                item = input_queue.get(timeout=1)
                if item is None:
                    if batch:
                        # 남은 배치 처리
                        break
                    return
                batch.append(item)
            except Empty:
                if batch:
                    break
                time.sleep(0.1)
                continue

        if not batch:
            continue

        # 배치 처리
        for src_path, dst_path in batch:
            try:
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)

                # 이미지 로드
                img = Image.open(src_path).convert('RGB')

                # Tensor로 변환 (GPU로 전송)
                img_tensor = TF.to_tensor(img).unsqueeze(0).to(device)

                # GPU에서 리사이징
                resized = torch.nn.functional.interpolate(
                    img_tensor,
                    size=(720, 1280),
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


def main():
    parser = argparse.ArgumentParser(description='검증 데이터 GPU 가속 변환')
    parser.add_argument('--val_csv', type=str,
                       default='./preprocessed_data/all_val.csv',
                       help='검증 데이터 CSV')
    parser.add_argument('--output_csv', type=str,
                       default='./preprocessed_data/all_val_720p.csv',
                       help='변환된 CSV 출력 경로')
    parser.add_argument('--gpus', type=int,
                       default=2,
                       help='사용할 GPU 수 (기본: 2)')
    parser.add_argument('--workers_per_gpu', type=int,
                       default=4,
                       help='GPU당 비디오 워커 수')
    parser.add_argument('--test_mode', action='store_true',
                       help='테스트 모드 (100개만)')

    args = parser.parse_args()

    print("="*80)
    print("검증 데이터 GPU 가속 변환")
    print("="*80)
    print(f"입력: {args.val_csv}")
    print(f"출력: {args.output_csv}")
    print(f"사용 GPU: {args.gpus}개")

    # CUDA 확인
    if not torch.cuda.is_available():
        print("\n⚠️  CUDA를 사용할 수 없습니다. CPU 모드로 전환합니다.")
        args.gpus = 0
    else:
        print(f"사용 가능한 GPU: {torch.cuda.device_count()}개")
        for i in range(min(args.gpus, torch.cuda.device_count())):
            print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")

    # CSV 읽기
    with open(args.val_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        val_data = list(reader)

    total = len(val_data)
    if args.test_mode:
        val_data = val_data[:100]
        print(f"\n⚠️  테스트 모드: {len(val_data)}개만 변환")
    else:
        print(f"\n총 {total:,}개 샘플")

    # 출력 디렉토리
    output_dir = Path('./preprocessed_data')
    video_dir = output_dir / 'converted_720p_val'
    image_dir = output_dir / 'images_1280x720_val'
    video_dir.mkdir(exist_ok=True)
    image_dir.mkdir(exist_ok=True)

    # 작업 분류
    video_tasks = []
    image_tasks = []
    metadata = {}

    for idx, row in enumerate(val_data):
        clip_id = row['clip_id']
        media_type = row['media_type']
        original_path = Path(row['file_path'])

        if not original_path.exists():
            continue

        batch_num = idx // 100
        batch_name = f'batch_{batch_num:04d}'

        if media_type == 'video':
            batch_dir = video_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.mp4'
            gpu_id = len(video_tasks) % args.gpus if args.gpus > 0 else 0
            video_tasks.append((original_path, output_path, gpu_id))
            metadata[clip_id] = (media_type, output_path, row)
        else:
            batch_dir = image_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.png'
            image_tasks.append((original_path, output_path))
            metadata[clip_id] = (media_type, output_path, row)

    print(f"\n변환 대상:")
    print(f"  비디오: {len(video_tasks):,}개")
    print(f"  이미지: {len(image_tasks):,}개")

    if args.gpus > 0:
        print(f"\n예상 소요 시간: 약 30분~1시간 (GPU 가속)")
    else:
        print(f"\n예상 소요 시간: 약 3-4시간 (CPU)")

    start_time = time.time()

    # 비디오 변환 (GPU 병렬)
    print(f"\n비디오 변환 중...")
    with Pool(processes=args.gpus * args.workers_per_gpu if args.gpus > 0 else 8) as pool:
        video_results = list(tqdm(
            pool.imap(convert_video_gpu, video_tasks),
            total=len(video_tasks),
            desc="Converting videos"
        ))

    # 이미지 변환 (GPU)
    if args.gpus > 0:
        print(f"\n이미지 변환 중... (GPU)")
        input_queue = Queue(maxsize=1000)
        result_queue = Queue()

        # GPU 워커 시작
        workers = []
        for gpu_id in range(min(args.gpus, torch.cuda.device_count())):
            p = Process(
                target=gpu_image_worker,
                args=(gpu_id, input_queue, result_queue, 32)
            )
            p.start()
            workers.append(p)

        # 작업 투입
        for task in image_tasks:
            input_queue.put(task)

        # 종료 신호
        for _ in workers:
            input_queue.put(None)

        # 결과 수집
        image_success = 0
        for i in range(len(image_tasks)):
            status, path = result_queue.get()
            if status == 'success':
                image_success += 1
            if (i + 1) % 100 == 0:
                print(f"  진행: {i+1}/{len(image_tasks)} ({(i+1)/len(image_tasks)*100:.1f}%)")

        # 워커 종료
        for p in workers:
            p.join()

    # 결과 저장
    converted_data = []
    for clip_id, (media_type, output_path, row) in metadata.items():
        if output_path.exists():
            converted_data.append({
                'clip_id': clip_id,
                'media_type': media_type,
                'file_path': str(output_path),
                'caption': row['caption'],
                'resolution': '1280, 720',
                'length': row.get('length', ''),
                'category': row.get('category', ''),
                'keyword': row.get('keyword', ''),
            })

    if converted_data:
        with open(args.output_csv, 'w', encoding='utf-8', newline='') as f:
            fieldnames = converted_data[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(converted_data)

    elapsed = time.time() - start_time

    # 통계
    print(f"\n{'='*80}")
    print("변환 완료!")
    print(f"{'='*80}")
    print(f"성공: {len(converted_data):,}개")
    print(f"소요 시간: {elapsed/60:.1f}분")
    if args.gpus > 0:
        print(f"속도: {len(converted_data)/elapsed:.1f} 샘플/초 (GPU 가속)")
    print(f"\n출력 CSV: {args.output_csv}")
    print(f"비디오: {video_dir}")
    print(f"이미지: {image_dir}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
