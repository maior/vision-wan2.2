#!/usr/bin/env python3
"""
고급 통계 분석: Caption 다양성, 상관관계, 클래스 불균형 분석
"""

import csv
import re
from pathlib import Path
from collections import Counter
import math


def calculate_ttr(text):
    """Type-Token Ratio (TTR) 계산 - 어휘 다양성 지표"""
    # 한글, 영문, 숫자만 추출
    words = re.findall(r'[가-힣a-zA-Z0-9]+', text)
    if not words:
        return 0

    total_words = len(words)  # Tokens
    unique_words = len(set(words))  # Types

    return unique_words / total_words if total_words > 0 else 0


def analyze_caption_diversity(csv_path: str):
    """Caption 다양성 분석"""
    print(f"\n{'='*80}")
    print(f"Caption 다양성 분석: {csv_path}")
    print(f"{'='*80}")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # 1. Type-Token Ratio (TTR) 분석
    ttrs = []
    all_words = []
    caption_word_counts = []

    for row in data:
        caption = row.get('caption', '')
        if caption:
            ttr = calculate_ttr(caption)
            ttrs.append(ttr)

            words = re.findall(r'[가-힣a-zA-Z0-9]+', caption)
            all_words.extend(words)
            caption_word_counts.append(len(words))

    if ttrs:
        avg_ttr = sum(ttrs) / len(ttrs)
        print(f"\n[어휘 다양성 지표 (Type-Token Ratio)]")
        print(f"  평균 TTR: {avg_ttr:.4f}")
        print(f"  최소 TTR: {min(ttrs):.4f}")
        print(f"  최대 TTR: {max(ttrs):.4f}")

    # 2. 전체 어휘 통계
    if all_words:
        total_tokens = len(all_words)
        unique_types = len(set(all_words))
        global_ttr = unique_types / total_tokens

        print(f"\n[전체 어휘 통계]")
        print(f"  총 토큰 수 (Tokens): {total_tokens:,}")
        print(f"  고유 어휘 수 (Types): {unique_types:,}")
        print(f"  전체 TTR: {global_ttr:.4f}")

    # 3. Caption 당 단어 수 통계
    if caption_word_counts:
        avg_words = sum(caption_word_counts) / len(caption_word_counts)
        print(f"\n[Caption 당 단어 수 통계]")
        print(f"  평균 단어 수: {avg_words:.1f}")
        print(f"  최소 단어 수: {min(caption_word_counts)}")
        print(f"  최대 단어 수: {max(caption_word_counts)}")

    # 4. 가장 빈번한 단어 (Top 20)
    word_counts = Counter(all_words)
    print(f"\n[가장 빈번한 단어 Top 20]")
    for word, count in word_counts.most_common(20):
        print(f"  {word}: {count:,}회")

    return {
        'avg_ttr': avg_ttr if ttrs else 0,
        'global_ttr': global_ttr if all_words else 0,
        'unique_vocabulary': unique_types if all_words else 0,
        'total_tokens': total_tokens if all_words else 0,
    }


def analyze_class_imbalance(csv_path: str):
    """클래스 불균형 분석"""
    print(f"\n{'='*80}")
    print(f"클래스 불균형 분석: {csv_path}")
    print(f"{'='*80}")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # 1. 미디어 타입 불균형
    media_types = Counter([row['media_type'] for row in data])
    total = len(data)

    print(f"\n[미디어 타입 불균형]")
    for media_type, count in media_types.items():
        ratio = count / total
        print(f"  {media_type}: {count:,} ({ratio*100:.2f}%)")

    # 불균형 비율 계산 (최대:최소)
    if len(media_types) > 1:
        counts = list(media_types.values())
        imbalance_ratio = max(counts) / min(counts)
        print(f"  불균형 비율 (max/min): {imbalance_ratio:.2f}:1")

    # 2. 카테고리 불균형
    categories = Counter([row['category'] for row in data if row['category']])

    print(f"\n[카테고리 불균형]")
    print(f"  총 카테고리 수: {len(categories)}")

    if categories:
        counts = list(categories.values())
        max_cat = max(counts)
        min_cat = min(counts)
        cat_imbalance_ratio = max_cat / min_cat

        print(f"  최대 카테고리 샘플 수: {max_cat:,}")
        print(f"  최소 카테고리 샘플 수: {min_cat:,}")
        print(f"  카테고리 불균형 비율: {cat_imbalance_ratio:.2f}:1")

        # Gini 계수 계산 (불균형 측정)
        sorted_counts = sorted(counts)
        n = len(sorted_counts)
        cumsum = 0
        for i, count in enumerate(sorted_counts):
            cumsum += (2 * (i + 1) - n - 1) * count
        gini = cumsum / (n * sum(sorted_counts))

        print(f"  Gini 계수: {gini:.4f} (0=완전균형, 1=완전불균형)")

    return {
        'media_type_imbalance': imbalance_ratio if len(media_types) > 1 else 1.0,
        'category_imbalance': cat_imbalance_ratio if categories else 0,
        'gini_coefficient': gini if categories else 0,
    }


def analyze_correlations(csv_path: str):
    """상관관계 분석"""
    print(f"\n{'='*80}")
    print(f"상관관계 분석: {csv_path}")
    print(f"{'='*80}")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # 비디오 데이터만 추출
    video_data = [row for row in data if row['media_type'] == 'video' and row.get('length')]

    if not video_data:
        print("비디오 데이터 없음")
        return

    # 비디오 길이와 Caption 길이 상관관계
    def parse_length(length_str):
        try:
            parts = length_str.split(':')
            if len(parts) == 3:
                h, m, s = parts
                return int(h) * 3600 + int(m) * 60 + float(s)
        except:
            pass
        return 0

    video_lengths = []
    caption_lengths = []

    for row in video_data:
        video_len = parse_length(row['length'])
        caption_len = len(row.get('caption', ''))

        if video_len > 0 and caption_len > 0:
            video_lengths.append(video_len)
            caption_lengths.append(caption_len)

    if len(video_lengths) > 1:
        # Pearson 상관계수 계산
        n = len(video_lengths)

        mean_video = sum(video_lengths) / n
        mean_caption = sum(caption_lengths) / n

        numerator = sum((v - mean_video) * (c - mean_caption)
                       for v, c in zip(video_lengths, caption_lengths))

        denominator_v = math.sqrt(sum((v - mean_video) ** 2 for v in video_lengths))
        denominator_c = math.sqrt(sum((c - mean_caption) ** 2 for c in caption_lengths))

        correlation = numerator / (denominator_v * denominator_c) if denominator_v * denominator_c > 0 else 0

        print(f"\n[비디오 길이 vs Caption 길이 상관관계]")
        print(f"  샘플 수: {n:,}")
        print(f"  Pearson 상관계수: {correlation:.4f}")

        if abs(correlation) < 0.3:
            strength = "약한"
        elif abs(correlation) < 0.7:
            strength = "중간"
        else:
            strength = "강한"

        direction = "양의" if correlation > 0 else "음의"
        print(f"  해석: {strength} {direction} 상관관계")

        return {'correlation': correlation}

    return {}


def main():
    data_dir = Path('./preprocessed_data')

    csv_files = [
        'all_train.csv',
        'all_val.csv',
    ]

    results = {}

    for csv_file in csv_files:
        csv_path = data_dir / csv_file
        if csv_path.exists():
            print(f"\n\n{'#'*80}")
            print(f"분석 대상: {csv_file}")
            print(f"{'#'*80}")

            diversity = analyze_caption_diversity(str(csv_path))
            imbalance = analyze_class_imbalance(str(csv_path))
            correlation = analyze_correlations(str(csv_path))

            results[csv_file] = {
                'diversity': diversity,
                'imbalance': imbalance,
                'correlation': correlation,
            }
        else:
            print(f"파일 없음: {csv_path}")

    # 요약
    print(f"\n\n{'='*80}")
    print("전체 분석 요약")
    print(f"{'='*80}")

    for csv_file, result in results.items():
        print(f"\n[{csv_file}]")
        diversity = result['diversity']
        imbalance = result['imbalance']
        correlation = result['correlation']

        print(f"  어휘 다양성 (TTR): {diversity.get('avg_ttr', 0):.4f}")
        print(f"  고유 어휘 수: {diversity.get('unique_vocabulary', 0):,}")
        print(f"  미디어 타입 불균형: {imbalance.get('media_type_imbalance', 0):.2f}:1")
        print(f"  카테고리 Gini 계수: {imbalance.get('gini_coefficient', 0):.4f}")
        if correlation:
            print(f"  비디오-Caption 상관계수: {correlation.get('correlation', 0):.4f}")


if __name__ == "__main__":
    main()
