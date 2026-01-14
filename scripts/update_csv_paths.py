#!/usr/bin/env python3
"""
CSV 파일 경로를 전처리된 경로로 업데이트
"""

import csv
import os
from pathlib import Path

# 경로 설정
ORIGINAL_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_converted.csv'

# 전처리된 디렉토리
VIDEO_DIR = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/converted_720p'
IMAGE_DIR = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_1280x720'

print("=" * 60)
print("CSV 경로 업데이트")
print("=" * 60)
print(f"입력: {ORIGINAL_CSV}")
print(f"출력: {OUTPUT_CSV}")
print(f"비디오 디렉토리: {VIDEO_DIR}")
print(f"이미지 디렉토리: {IMAGE_DIR}")
print("=" * 60)

# 통계
total = 0
video_updated = 0
image_updated = 0
video_missing = 0
image_missing = 0

with open(ORIGINAL_CSV, 'r', encoding='utf-8') as fin, \
     open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as fout:

    reader = csv.DictReader(fin)
    fieldnames = reader.fieldnames
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        total += 1
        media_type = row['media_type']
        old_path = row['file_path']

        if media_type == 'video':
            # 비디오 경로 변경
            # /home/devfit2/mbc_json/video/batch_0001/1234567.mp4
            # -> /home/maiordba/projects/vision/Wan2.2/preprocessed_data/converted_720p/batch_0001/1234567.mp4

            rel_path = os.path.relpath(old_path, '/home/devfit2/mbc_json/video')
            new_path = os.path.join(VIDEO_DIR, rel_path)

            if os.path.exists(new_path):
                row['file_path'] = new_path
                row['resolution'] = '1280, 720'  # 업데이트
                video_updated += 1
            else:
                # 파일이 없으면 건너뛰기
                video_missing += 1
                continue

        elif media_type == 'image':
            # 이미지 경로 변경
            # /home/devfit2/mbc_json/image/batch_0001/1234567.png
            # -> /home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_1280x720/batch_0001/1234567.png

            rel_path = os.path.relpath(old_path, '/home/devfit2/mbc_json/image')
            new_path = os.path.join(IMAGE_DIR, rel_path)

            if os.path.exists(new_path):
                row['file_path'] = new_path
                row['resolution'] = '1280, 720'  # 업데이트
                image_updated += 1
            else:
                # 파일이 없으면 건너뛰기
                image_missing += 1
                continue

        writer.writerow(row)

        # 진행률 출력
        if total % 10000 == 0:
            print(f"[진행] {total:,} 처리 | "
                  f"비디오: {video_updated:,} | "
                  f"이미지: {image_updated:,} | "
                  f"누락: {video_missing + image_missing:,}")

print("\n" + "=" * 60)
print("업데이트 완료!")
print("=" * 60)
print(f"총 처리: {total:,}개")
print(f"비디오 업데이트: {video_updated:,}개")
print(f"이미지 업데이트: {image_updated:,}개")
print(f"비디오 누락: {video_missing:,}개")
print(f"이미지 누락: {image_missing:,}개")
print(f"최종 데이터: {video_updated + image_updated:,}개")
print(f"\n출력 파일: {OUTPUT_CSV}")
print("=" * 60)

# 원본 파일 백업 후 교체
import shutil
backup_path = ORIGINAL_CSV + '.backup'
shutil.copy2(ORIGINAL_CSV, backup_path)
print(f"\n원본 백업: {backup_path}")

shutil.move(OUTPUT_CSV, ORIGINAL_CSV)
print(f"CSV 파일 업데이트 완료: {ORIGINAL_CSV}")
