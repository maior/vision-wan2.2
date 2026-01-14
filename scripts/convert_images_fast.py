#!/usr/bin/env python3
"""
이미지 고속 리사이징 (멀티프로세스)
1280x720 해상도로 변환
"""

import os
import csv
import argparse
from pathlib import Path
from multiprocessing import Pool, cpu_count
from PIL import Image
import time
from datetime import datetime

def resize_image(args):
    """단일 이미지 리사이징"""
    src_path, dst_path, target_width, target_height = args

    try:
        # 이미 변환된 파일 건너뛰기
        if os.path.exists(dst_path):
            return 'skip', src_path

        # 디렉토리 생성
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)

        # 이미지 로드
        img = Image.open(src_path)

        # 원본 크기
        orig_width, orig_height = img.size

        # 이미 목표 해상도인 경우 복사
        if orig_width == target_width and orig_height == target_height:
            img.save(dst_path, quality=95)
            return 'copy', src_path

        # 비율 유지 리사이징
        img_resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

        # 저장
        img_resized.save(dst_path, quality=95)

        return 'success', src_path

    except Exception as e:
        return 'error', f"{src_path}: {str(e)}"


def main():
    parser = argparse.ArgumentParser(description='이미지 고속 리사이징')
    parser.add_argument('--workers', type=int, default=cpu_count(),
                       help=f'워커 수 (기본: {cpu_count()})')
    parser.add_argument('--resume', action='store_true',
                       help='중단된 작업 재개 (이미 완료된 파일 건너뛰기)')
    parser.add_argument('--size', type=str, default='1280x720',
                       help='목표 해상도 (기본: 1280x720)')

    args = parser.parse_args()

    target_width, target_height = map(int, args.size.split('x'))

    print("=" * 60)
    print("고속 이미지 리사이징")
    print("=" * 60)
    print(f"워커 수: {args.workers}")
    print(f"목표 해상도: {target_width}x{target_height}")
    print("=" * 60)

    # CSV 읽기
    csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
    output_dir = f'/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_{args.size}'

    if args.resume:
        # 이미 완료된 파일 카운트
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

            # 출력 경로 생성 (원본 경로 구조 유지)
            rel_path = os.path.relpath(src_path, '/home/devfit2/mbc_json/image')
            dst_path = os.path.join(output_dir, rel_path)

            # 재개 모드에서 이미 존재하는 파일 건너뛰기
            if args.resume and os.path.exists(dst_path):
                continue

            tasks.append((src_path, dst_path, target_width, target_height))

    print(f"[INFO] 변환할 이미지: {len(tasks):,}개")
    print(f"\n[INFO] 변환 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[INFO] 출력 디렉토리: {output_dir}\n")

    os.makedirs(output_dir, exist_ok=True)

    # 멀티프로세스 처리
    start_time = time.time()
    success_count = 0
    skip_count = 0
    error_count = 0

    with Pool(args.workers) as pool:
        for i, (status, path) in enumerate(pool.imap_unordered(resize_image, tasks), 1):
            if status == 'success':
                success_count += 1
            elif status == 'copy':
                success_count += 1
            elif status == 'skip':
                skip_count += 1
            else:  # error
                error_count += 1
                print(f"[ERROR] {path}")

            # 진행률 출력
            if i % 100 == 0:
                elapsed = time.time() - start_time
                speed = i / elapsed if elapsed > 0 else 0
                remaining = (len(tasks) - i) / speed if speed > 0 else 0

                print(f"[진행률] {i:,}/{len(tasks):,} ({i/len(tasks)*100:.1f}%) | "
                      f"속도: {speed:.1f} 이미지/초 | "
                      f"남은시간: {remaining/60:.1f}분 | "
                      f"성공: {success_count:,} | 에러: {error_count:,}")

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
