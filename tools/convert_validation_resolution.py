#!/usr/bin/env python3
"""
검증 데이터 해상도 즉시 변환
가장 큰 문제(93.81% 해상도 미지원) 해결
"""

import csv
import subprocess
from pathlib import Path
from tqdm import tqdm
import cv2
import argparse


def convert_video_720p(input_path, output_path):
    """비디오를 1280×720으로 변환"""
    try:
        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-y', '-loglevel', 'error',
            str(output_path)
        ]
        subprocess.run(cmd, check=True, timeout=300)
        return output_path.exists()
    except:
        return False


def convert_image_720p(input_path, output_path):
    """이미지를 1280×720으로 변환"""
    try:
        img = cv2.imread(str(input_path))
        if img is None:
            return False

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
        return output_path.exists()
    except:
        return False


def main():
    parser = argparse.ArgumentParser(description='검증 데이터 해상도 변환')
    parser.add_argument('--val_csv', type=str,
                       default='./preprocessed_data/all_val.csv',
                       help='검증 데이터 CSV')
    parser.add_argument('--output_csv', type=str,
                       default='./preprocessed_data/all_val_720p.csv',
                       help='변환된 CSV 출력 경로')
    parser.add_argument('--test_mode', action='store_true',
                       help='테스트 모드 (10개만 변환)')

    args = parser.parse_args()

    print("="*80)
    print("검증 데이터 해상도 변환 시작")
    print("="*80)
    print(f"입력: {args.val_csv}")
    print(f"출력: {args.output_csv}")

    # CSV 읽기
    with open(args.val_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        val_data = list(reader)

    total = len(val_data)
    if args.test_mode:
        val_data = val_data[:10]
        print(f"\n⚠️  테스트 모드: {len(val_data)}개만 변환")
    else:
        print(f"\n총 {total:,}개 샘플")

    # 출력 디렉토리
    output_dir = Path('./preprocessed_data')
    video_dir = output_dir / 'converted_720p_val'
    image_dir = output_dir / 'images_1280x720_val'
    video_dir.mkdir(exist_ok=True)
    image_dir.mkdir(exist_ok=True)

    converted_data = []
    stats = {'success': 0, 'failed': 0, 'missing': 0}

    for idx, row in enumerate(tqdm(val_data, desc="Converting")):
        clip_id = row['clip_id']
        media_type = row['media_type']
        original_path = Path(row['file_path'])

        # 원본 파일 확인
        if not original_path.exists():
            stats['missing'] += 1
            continue

        # 배치 디렉토리
        batch_num = idx // 100
        batch_name = f'batch_{batch_num:04d}'

        # 변환
        if media_type == 'video':
            batch_dir = video_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.mp4'
            success = convert_video_720p(original_path, output_path)
        else:  # image
            batch_dir = image_dir / batch_name
            batch_dir.mkdir(exist_ok=True)
            output_path = batch_dir / f'{clip_id}.png'
            success = convert_image_720p(original_path, output_path)

        if success:
            stats['success'] += 1
            converted_data.append({
                'clip_id': clip_id,
                'media_type': media_type,
                'file_path': str(output_path),
                'caption': row['caption'],
                'resolution': '1280, 720',  # ✅ 변환 완료!
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
    print(f"파일 없음: {stats['missing']:,}개")
    print(f"\n출력 CSV: {args.output_csv}")
    print(f"비디오: {video_dir}")
    print(f"이미지: {image_dir}")
    print(f"{'='*80}\n")

    if not args.test_mode:
        print("다음 단계:")
        print(f"  1. 품질 필터링:")
        print(f"     python3 analyze_defective_data.py --csv_path {args.output_csv}")
        print(f"  2. 학습 시작:")
        print(f"     train_csv = './data_quality_analysis/clean_dataset.csv'")
        print(f"     val_csv = '{args.output_csv}' (또는 필터링 후)")


if __name__ == "__main__":
    main()
