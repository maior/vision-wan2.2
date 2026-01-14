#!/usr/bin/env python3
"""
검증 데이터 GPU 가속 변환 (간단 버전)
- 비디오: ffmpeg + NVIDIA GPU (h264_nvenc)
- 이미지: OpenCV + CPU (멀티프로세싱)

15시간 → 1-2시간으로 단축!
"""

import csv
import subprocess
from pathlib import Path
from multiprocessing import Pool
import cv2
import argparse
from tqdm import tqdm
import os


def convert_video_gpu(args):
    """GPU 가속 비디오 변환"""
    input_path, output_path, gpu_id = args

    try:
        # 먼저 GPU 가속으로 시도
        cmd = [
            'ffmpeg',
            '-hwaccel', 'cuda',
            '-hwaccel_device', str(gpu_id),
            '-i', str(input_path),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'h264_nvenc',
            '-preset', 'p4',
            '-b:v', '5M',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',
            '-loglevel', 'error',
            str(output_path)
        ]

        subprocess.run(cmd, check=True, timeout=300,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return (True, 'gpu')
    except:
        # GPU 실패 시 CPU로 fallback
        try:
            cmd = [
                'ffmpeg',
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
            return (True, 'cpu')
        except Exception as e:
            return (False, str(e))


def convert_image_cv2(args):
    """OpenCV 이미지 변환"""
    input_path, output_path = args

    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        img = cv2.imread(str(input_path))
        if img is None:
            return (False, "Failed to read")

        h, w = img.shape[:2]
        target_w, target_h = 1280, 720

        # 리사이즈
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # 패딩
        top = (target_h - new_h) // 2
        bottom = target_h - new_h - top
        left = (target_w - new_w) // 2
        right = target_w - new_w - left

        canvas = cv2.copyMakeBorder(
            resized, top, bottom, left, right,
            cv2.BORDER_CONSTANT, value=[0, 0, 0]
        )

        cv2.imwrite(str(output_path), canvas)
        return (True, None)
    except Exception as e:
        return (False, str(e))


def main():
    parser = argparse.ArgumentParser(description='검증 데이터 GPU 가속 변환')
    parser.add_argument('--val_csv', type=str,
                       default='./preprocessed_data/all_val.csv')
    parser.add_argument('--output_csv', type=str,
                       default='./preprocessed_data/all_val_720p.csv')
    parser.add_argument('--gpus', type=int, default=2,
                       help='GPU 수 (비디오 변환용)')
    parser.add_argument('--workers', type=int, default=16,
                       help='병렬 워커 수')
    parser.add_argument('--test_mode', action='store_true')

    args = parser.parse_args()

    print("="*80)
    print("검증 데이터 GPU 가속 변환")
    print("="*80)
    print(f"입력: {args.val_csv}")
    print(f"GPU: {args.gpus}개, 워커: {args.workers}개")

    # CSV 읽기
    with open(args.val_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        val_data = list(reader)

    if args.test_mode:
        val_data = val_data[:100]
        print(f"\n⚠️  테스트 모드: {len(val_data)}개")
    else:
        print(f"\n총 {len(val_data):,}개")

    # 출력 디렉토리
    output_dir = Path('./preprocessed_data')
    video_dir = output_dir / 'converted_720p_val'
    image_dir = output_dir / 'images_1280x720_val'
    video_dir.mkdir(exist_ok=True)
    image_dir.mkdir(exist_ok=True)

    # 작업 준비
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
            gpu_id = len(video_tasks) % args.gpus
            video_tasks.append((original_path, output_path, gpu_id))
            metadata[str(output_path.resolve())] = (clip_id, media_type, row)
        else:
            batch_dir = image_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.png'
            image_tasks.append((original_path, output_path))
            metadata[str(output_path.resolve())] = (clip_id, media_type, row)

    print(f"\n변환 대상:")
    print(f"  비디오: {len(video_tasks):,}개")
    print(f"  이미지: {len(image_tasks):,}개")
    print(f"\n예상 소요 시간: 1-2시간 (GPU 가속)")

    # 비디오 변환 (GPU)
    print(f"\n비디오 변환 중 (GPU)...")
    with Pool(processes=args.workers) as pool:
        video_results = list(tqdm(
            pool.imap(convert_video_gpu, video_tasks),
            total=len(video_tasks),
            desc="Videos"
        ))

    # 이미지 변환 (CPU 멀티프로세싱)
    print(f"\n이미지 변환 중 (CPU)...")
    with Pool(processes=args.workers) as pool:
        image_results = list(tqdm(
            pool.imap(convert_image_cv2, image_tasks),
            total=len(image_tasks),
            desc="Images"
        ))

    # 결과 저장
    converted_data = []
    for path_str, (clip_id, media_type, row) in metadata.items():
        if Path(path_str).exists():
            converted_data.append({
                'clip_id': clip_id,
                'media_type': media_type,
                'file_path': path_str,
                'caption': row['caption'],
                'resolution': '1280, 720',
                'length': row.get('length', ''),
                'category': row.get('category', ''),
                'keyword': row.get('keyword', ''),
            })

    if converted_data:
        with open(args.output_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=converted_data[0].keys())
            writer.writeheader()
            writer.writerows(converted_data)

    # 통계
    gpu_count = sum(1 for r in video_results if r[1] == 'gpu')
    cpu_count = sum(1 for r in video_results if r[1] == 'cpu')

    print(f"\n{'='*80}")
    print("변환 완료!")
    print(f"{'='*80}")
    print(f"성공: {len(converted_data):,}개")
    print(f"  비디오 (GPU): {gpu_count:,}개")
    print(f"  비디오 (CPU): {cpu_count:,}개")
    print(f"  이미지: {len([r for r in image_results if r[0]]):,}개")
    print(f"\n출력: {args.output_csv}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
