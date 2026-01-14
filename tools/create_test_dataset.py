#!/usr/bin/env python3
"""
작은 테스트 데이터셋 생성
오버피팅 테스트용
"""

import pandas as pd
import argparse
from pathlib import Path


def create_test_dataset(
    input_csv: str,
    output_csv: str,
    num_samples: int = 100,
    media_type: str = None,
    balanced: bool = True,
):
    """테스트 데이터셋 생성"""

    print(f"입력 CSV 로드: {input_csv}")
    df = pd.read_csv(input_csv)

    print(f"전체 데이터: {len(df):,}개")

    # 미디어 타입 필터링
    if media_type:
        df = df[df['media_type'] == media_type]
        print(f"{media_type} 필터링 후: {len(df):,}개")

    # 균형잡힌 샘플링 (비디오:이미지 = 50:50)
    if balanced and media_type is None:
        video_df = df[df['media_type'] == 'video']
        image_df = df[df['media_type'] == 'image']

        num_per_type = num_samples // 2

        video_sample = video_df.sample(n=min(num_per_type, len(video_df)), random_state=42)
        image_sample = image_df.sample(n=min(num_per_type, len(image_df)), random_state=42)

        test_df = pd.concat([video_sample, image_sample])
    else:
        # 랜덤 샘플링
        test_df = df.sample(n=min(num_samples, len(df)), random_state=42)

    # 저장
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    test_df.to_csv(output_csv, index=False)

    print(f"\n생성된 테스트 데이터셋:")
    print(f"  - 총 샘플: {len(test_df):,}개")
    print(f"  - 비디오: {len(test_df[test_df['media_type'] == 'video']):,}개")
    print(f"  - 이미지: {len(test_df[test_df['media_type'] == 'image']):,}개")
    print(f"  - 저장 위치: {output_csv}")

    # 통계
    print(f"\n카테고리 분포:")
    category_counts = test_df['category'].value_counts()
    for cat, count in category_counts.head(5).items():
        print(f"  - {cat}: {count}개")


def main():
    parser = argparse.ArgumentParser(description='테스트 데이터셋 생성')
    parser.add_argument('--input_csv', type=str,
                        default='./preprocessed_data/all_train.csv',
                        help='입력 CSV 파일')
    parser.add_argument('--output_csv', type=str,
                        default='./preprocessed_data/test_100.csv',
                        help='출력 CSV 파일')
    parser.add_argument('--num_samples', type=int, default=100,
                        help='샘플 개수')
    parser.add_argument('--media_type', type=str, default=None,
                        choices=['image', 'video'],
                        help='미디어 타입 필터링')
    parser.add_argument('--balanced', action='store_true', default=True,
                        help='비디오:이미지 균형 샘플링')

    args = parser.parse_args()

    create_test_dataset(
        args.input_csv,
        args.output_csv,
        args.num_samples,
        args.media_type,
        args.balanced,
    )


if __name__ == "__main__":
    main()
