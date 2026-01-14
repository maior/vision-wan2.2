#!/usr/bin/env python3
"""
전처리된 MBC 데이터셋 통계 분석 스크립트
"""

import csv
from pathlib import Path
from collections import Counter, defaultdict
import argparse


def analyze_dataset(csv_path: str):
    """데이터셋 통계 분석"""
    print(f"\n분석 중: {csv_path}")
    print("="*80)

    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    total = len(data)
    print(f"총 데이터 수: {total:,}")

    # 미디어 타입별 분포
    media_types = Counter([row['media_type'] for row in data])
    print("\n[미디어 타입별 분포]")
    for media_type, count in media_types.items():
        print(f"  {media_type}: {count:,} ({count/total*100:.2f}%)")

    # 해상도 분포
    resolutions = Counter([row['resolution'] for row in data if row['resolution']])
    print("\n[해상도 분포 (상위 10개)]")
    for resolution, count in resolutions.most_common(10):
        print(f"  {resolution}: {count:,} ({count/total*100:.2f}%)")

    # 비디오 길이 분포 (비디오만)
    video_data = [row for row in data if row['media_type'] == 'video' and row['length']]
    if video_data:
        print(f"\n[비디오 길이 통계] (총 {len(video_data):,}개)")

        # 길이를 초로 변환
        def parse_length(length_str):
            """00:00:21.15 형식을 초로 변환"""
            try:
                parts = length_str.split(':')
                if len(parts) == 3:
                    h, m, s = parts
                    return int(h) * 3600 + int(m) * 60 + float(s)
            except:
                pass
            return 0

        lengths = [parse_length(row['length']) for row in video_data]
        lengths = [l for l in lengths if l > 0]

        if lengths:
            avg_length = sum(lengths) / len(lengths)
            min_length = min(lengths)
            max_length = max(lengths)

            print(f"  평균 길이: {avg_length:.2f}초")
            print(f"  최소 길이: {min_length:.2f}초")
            print(f"  최대 길이: {max_length:.2f}초")

            # 길이 범위별 분포
            ranges = {
                '0-10초': 0,
                '10-20초': 0,
                '20-30초': 0,
                '30-60초': 0,
                '60초 이상': 0,
            }

            for length in lengths:
                if length < 10:
                    ranges['0-10초'] += 1
                elif length < 20:
                    ranges['10-20초'] += 1
                elif length < 30:
                    ranges['20-30초'] += 1
                elif length < 60:
                    ranges['30-60초'] += 1
                else:
                    ranges['60초 이상'] += 1

            print("\n  [길이 범위별 분포]")
            for range_name, count in ranges.items():
                print(f"    {range_name}: {count:,} ({count/len(lengths)*100:.2f}%)")

    # 카테고리 분포
    categories = Counter([row['category'] for row in data if row['category']])
    print(f"\n[카테고리 분포] (상위 15개)")
    for category, count in categories.most_common(15):
        print(f"  {category}: {count:,} ({count/total*100:.2f}%)")

    # Caption 길이 통계
    caption_lengths = [len(row['caption']) for row in data if row['caption']]
    if caption_lengths:
        avg_caption_len = sum(caption_lengths) / len(caption_lengths)
        min_caption_len = min(caption_lengths)
        max_caption_len = max(caption_lengths)

        print(f"\n[Caption 길이 통계]")
        print(f"  평균 길이: {avg_caption_len:.0f}자")
        print(f"  최소 길이: {min_caption_len}자")
        print(f"  최대 길이: {max_caption_len}자")

    # Wan2.2 지원 해상도 필터링 통계
    print(f"\n[Wan2.2 지원 해상도 필터링]")

    # 비디오용 해상도
    video_supported_resolutions = {
        '1280, 720': 0,
        '720, 1280': 0,
        '832, 480': 0,
        '480, 832': 0,
        '1280, 704': 0,
        '704, 1280': 0,
        '1024, 704': 0,
        '704, 1024': 0,
    }

    # 이미지용 해상도
    image_supported_resolutions = {
        '1280, 720': 0,
        '720, 1280': 0,
        '832, 480': 0,
        '480, 832': 0,
        '1280, 704': 0,
        '704, 1280': 0,
    }

    for row in data:
        resolution = row['resolution']
        if row['media_type'] == 'video' and resolution in video_supported_resolutions:
            video_supported_resolutions[resolution] += 1
        elif row['media_type'] == 'image' and resolution in image_supported_resolutions:
            image_supported_resolutions[resolution] += 1

    video_supported_total = sum(video_supported_resolutions.values())
    image_supported_total = sum(image_supported_resolutions.values())

    print(f"\n  비디오 - Wan2.2 지원 해상도: {video_supported_total:,}개")
    for res, count in video_supported_resolutions.items():
        if count > 0:
            print(f"    {res}: {count:,}")

    print(f"\n  이미지 - Wan2.2 지원 해상도: {image_supported_total:,}개")
    for res, count in image_supported_resolutions.items():
        if count > 0:
            print(f"    {res}: {count:,}")

    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(description='전처리된 MBC 데이터셋 통계 분석')
    parser.add_argument('--data_dir', type=str, default='./preprocessed_data',
                        help='전처리 데이터 디렉토리')

    args = parser.parse_args()

    data_dir = Path(args.data_dir)

    # 각 CSV 파일 분석
    csv_files = [
        'all_data.csv',
        'all_train.csv',
        'all_val.csv',
        'image_all.csv',
        'video_all.csv',
    ]

    for csv_file in csv_files:
        csv_path = data_dir / csv_file
        if csv_path.exists():
            analyze_dataset(str(csv_path))
        else:
            print(f"파일 없음: {csv_path}")


if __name__ == "__main__":
    main()
