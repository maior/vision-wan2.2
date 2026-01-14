#!/usr/bin/env python3
"""
검증 데이터 해상도 병렬 변환 (멀티프로세싱)
15시간 → 3-4시간으로 단축
"""

import csv
import subprocess
from pathlib import Path
from tqdm import tqdm
import cv2
import argparse
from multiprocessing import Pool, cpu_count
import os


def convert_video_720p(args):
    """비디오를 1280×720으로 변환"""
    input_path, output_path = args
    try:
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264', '-preset', 'ultrafast',  # ultrafast로 속도 우선
            '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-y', '-loglevel', 'error',
            str(output_path)
        ]
        subprocess.run(cmd, check=True, timeout=300,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return (True, None)
    except Exception as e:
        return (False, str(e))


def convert_image_720p(args):
    """이미지를 1280×720으로 변환"""
    input_path, output_path = args
    try:
        img = cv2.imread(str(input_path))
        if img is None:
            return (False, "Failed to read image")

        h, w = img.shape[:2]
        target_w, target_h = 1280, 720

        # 리사이즈 (aspect ratio 유지)
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # 패딩 (중앙 정렬)
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
    parser = argparse.ArgumentParser(description='검증 데이터 병렬 해상도 변환')
    parser.add_argument('--val_csv', type=str,
                       default='./preprocessed_data/all_val.csv',
                       help='검증 데이터 CSV')
    parser.add_argument('--output_csv', type=str,
                       default='./preprocessed_data/all_val_720p.csv',
                       help='변환된 CSV 출력 경로')
    parser.add_argument('--workers', type=int,
                       default=min(8, cpu_count()),
                       help='병렬 처리 워커 수')
    parser.add_argument('--test_mode', action='store_true',
                       help='테스트 모드 (100개만 변환)')

    args = parser.parse_args()

    print("="*80)
    print("검증 데이터 병렬 해상도 변환")
    print("="*80)
    print(f"입력: {args.val_csv}")
    print(f"출력: {args.output_csv}")
    print(f"병렬 워커: {args.workers}개")

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

    # 변환 작업 준비
    video_tasks = []
    image_tasks = []
    task_metadata = []

    for idx, row in enumerate(val_data):
        clip_id = row['clip_id']
        media_type = row['media_type']
        original_path = Path(row['file_path'])

        # 원본 파일 확인
        if not original_path.exists():
            continue

        # 배치 디렉토리
        batch_num = idx // 100
        batch_name = f'batch_{batch_num:04d}'

        # 변환 작업 추가
        if media_type == 'video':
            batch_dir = video_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.mp4'
            video_tasks.append((original_path, output_path))
            task_metadata.append((idx, clip_id, media_type, output_path, row))
        else:  # image
            batch_dir = image_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.png'
            image_tasks.append((original_path, output_path))
            task_metadata.append((idx, clip_id, media_type, output_path, row))

    print(f"\n변환 대상:")
    print(f"  비디오: {len(video_tasks):,}개")
    print(f"  이미지: {len(image_tasks):,}개")
    print(f"\n예상 소요 시간: 약 3-4시간")
    print(f"(기존 15시간 대비 4-5배 빠름)")

    # 병렬 처리
    converted_data = []
    stats = {'success': 0, 'failed': 0, 'missing': 0}

    print(f"\n비디오 변환 중... ({args.workers} workers)")
    with Pool(processes=args.workers) as pool:
        results = list(tqdm(
            pool.imap(convert_video_720p, video_tasks),
            total=len(video_tasks),
            desc="Converting videos"
        ))

    # 비디오 결과 처리
    video_idx = 0
    for idx, clip_id, media_type, output_path, row in task_metadata:
        if media_type == 'video':
            success, error = results[video_idx]
            video_idx += 1
            if success:
                stats['success'] += 1
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
            else:
                stats['failed'] += 1

    print(f"\n이미지 변환 중... ({args.workers} workers)")
    with Pool(processes=args.workers) as pool:
        results = list(tqdm(
            pool.imap(convert_image_720p, image_tasks),
            total=len(image_tasks),
            desc="Converting images"
        ))

    # 이미지 결과 처리
    image_idx = 0
    for idx, clip_id, media_type, output_path, row in task_metadata:
        if media_type == 'image':
            success, error = results[image_idx]
            image_idx += 1
            if success:
                stats['success'] += 1
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
            else:
                stats['failed'] += 1

    # 결과 저장
    if converted_data:
        with open(args.output_csv, 'w', encoding='utf-8', newline='') as f:
            fieldnames = converted_data[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(converted_data)

    # 통계
    print(f"\n{'='*80}")
    print("변환 완료!")
    print(f"{'='*80}")
    print(f"성공: {stats['success']:,}개")
    print(f"실패: {stats['failed']:,}개")
    print(f"\n출력 CSV: {args.output_csv}")
    print(f"비디오: {video_dir}")
    print(f"이미지: {image_dir}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
