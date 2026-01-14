#!/usr/bin/env python3
"""이미지 파일 통계 확인"""

import csv
from collections import Counter

# CSV 읽기
video_count = 0
image_count = 0
image_resolutions = []
image_samples = []

with open('/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['media_type'] == 'video':
            video_count += 1
        elif row['media_type'] == 'image':
            image_count += 1
            image_resolutions.append(row['resolution'])
            if len(image_samples) < 5:
                image_samples.append(row)

total = video_count + image_count

print(f"\n총 데이터: {total:,}개")
print(f"비디오: {video_count:,}개")
print(f"이미지: {image_count:,}개")

# 해상도 분포
print("\n=== 이미지 해상도 분포 ===")
resolution_counts = Counter(image_resolutions)
for res, count in resolution_counts.most_common(20):
    print(f"{res}: {count:,}개")

# 샘플 경로 확인
print("\n=== 샘플 이미지 경로 ===")
for row in image_samples:
    print(f"{row['file_path']}")
    print(f"  Resolution: {row['resolution']}")
