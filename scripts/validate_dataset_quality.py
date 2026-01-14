#!/usr/bin/env python3
"""
데이터셋 품질 검증 스크립트
RAPA 2025 기준 + COT 구조 검증
"""

import csv
import json
import os
from pathlib import Path
from collections import defaultdict

# 경로 설정
CSV_PATH = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'
OUTPUT_REPORT = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/quality_validation_report.json'

print("=" * 70)
print("데이터셋 품질 검증")
print("=" * 70)
print(f"입력 CSV: {CSV_PATH}")
print(f"출력 리포트: {OUTPUT_REPORT}")
print("=" * 70)

# 검증 기준
RAPA_MIN_TOKENS = 50
RAPA_MIN_APPLICATIONS = 5

# 통계
validation_stats = {
    'total_samples': 0,
    'media_type': {'video': 0, 'image': 0},

    # COT 구조
    'cot_structure': {
        'has_cot': 0,
        'no_cot': 0,
        'has_object_level': 0,
        'has_semantic_level': 0,
        'has_application_level': 0,
        'complete_cot': 0  # 3개 레벨 모두 있음
    },

    # 토큰 분포
    'token_distribution': {
        '0': 0,           # 토큰 없음
        '1-25': 0,        # 매우 부족
        '26-49': 0,       # 부족
        '50-99': 0,       # 기준 충족
        '100-199': 0,     # 우수
        '200+': 0         # 매우 우수
    },

    # RAPA 2025 기준
    'rapa_criteria': {
        'token_pass': 0,           # 50+ 토큰
        'token_fail': 0,
        'application_pass': 0,     # 5+ 활용분야
        'application_fail': 0,
        'both_pass': 0,            # 둘 다 통과
        'both_fail': 0
    },

    # 카테고리별 통계
    'by_category': defaultdict(lambda: {
        'count': 0,
        'avg_tokens': 0,
        'quality_pass': 0
    }),

    # 품질 이슈
    'issues': {
        'empty_caption': 0,
        'no_category': 0,
        'no_keyword': 0,
        'file_not_exist': 0
    },

    # 샘플 예시
    'samples': {
        'excellent': [],  # 200+ 토큰
        'good': [],       # 50-199 토큰
        'poor': [],       # < 50 토큰
        'no_cot': []      # COT 없음
    }
}

def classify_token_range(tokens):
    """토큰 수를 범위로 분류"""
    if tokens == 0:
        return '0'
    elif tokens <= 25:
        return '1-25'
    elif tokens <= 49:
        return '26-49'
    elif tokens <= 99:
        return '50-99'
    elif tokens <= 199:
        return '100-199'
    else:
        return '200+'

def validate_row(row):
    """각 row 검증"""
    issues = []

    # 필수 필드 체크
    if not row.get('caption_full', '').strip():
        issues.append('empty_caption')

    if not row.get('category', '').strip():
        issues.append('no_category')

    if not row.get('keyword', '').strip():
        issues.append('no_keyword')

    # 파일 존재 여부 체크
    file_path = row.get('file_path', '')
    if file_path and not os.path.exists(file_path):
        issues.append('file_not_exist')

    return issues

# CSV 읽기 및 검증
print("\n검증 시작...\n")

samples_collected = {'excellent': 0, 'good': 0, 'poor': 0, 'no_cot': 0}
MAX_SAMPLES_PER_TYPE = 5

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        validation_stats['total_samples'] += 1

        # 미디어 타입
        media_type = row.get('media_type', 'unknown')
        validation_stats['media_type'][media_type] = validation_stats['media_type'].get(media_type, 0) + 1

        # COT 구조 분석
        has_cot = row.get('has_cot', 'False').lower() == 'true'
        tokens_object = int(row.get('tokens_object', 0))
        tokens_semantic = int(row.get('tokens_semantic', 0))
        tokens_application = int(row.get('tokens_application', 0))
        tokens_total = int(row.get('tokens_total', 0))
        num_applications = int(row.get('num_application_areas', 0))

        if has_cot:
            validation_stats['cot_structure']['has_cot'] += 1
        else:
            validation_stats['cot_structure']['no_cot'] += 1

        if tokens_object > 0:
            validation_stats['cot_structure']['has_object_level'] += 1
        if tokens_semantic > 0:
            validation_stats['cot_structure']['has_semantic_level'] += 1
        if tokens_application > 0:
            validation_stats['cot_structure']['has_application_level'] += 1

        if tokens_object > 0 and tokens_semantic > 0 and tokens_application > 0:
            validation_stats['cot_structure']['complete_cot'] += 1

        # 토큰 분포
        token_range = classify_token_range(tokens_total)
        validation_stats['token_distribution'][token_range] += 1

        # RAPA 기준 검증
        token_pass = tokens_total >= RAPA_MIN_TOKENS
        application_pass = num_applications >= RAPA_MIN_APPLICATIONS

        if token_pass:
            validation_stats['rapa_criteria']['token_pass'] += 1
        else:
            validation_stats['rapa_criteria']['token_fail'] += 1

        if application_pass:
            validation_stats['rapa_criteria']['application_pass'] += 1
        else:
            validation_stats['rapa_criteria']['application_fail'] += 1

        if token_pass and application_pass:
            validation_stats['rapa_criteria']['both_pass'] += 1
        else:
            validation_stats['rapa_criteria']['both_fail'] += 1

        # 카테고리별 통계
        category = row.get('category', '미분류')
        cat_stats = validation_stats['by_category'][category]
        cat_stats['count'] += 1
        cat_stats['avg_tokens'] += tokens_total
        if token_pass and application_pass:
            cat_stats['quality_pass'] += 1

        # 이슈 검증
        issues = validate_row(row)
        for issue in issues:
            validation_stats['issues'][issue] += 1

        # 샘플 수집 (각 타입당 최대 5개)
        sample_data = {
            'clip_id': row['clip_id'],
            'media_type': media_type,
            'tokens_total': tokens_total,
            'tokens_object': tokens_object,
            'tokens_semantic': tokens_semantic,
            'tokens_application': tokens_application,
            'num_applications': num_applications,
            'category': category,
            'caption_preview': row.get('caption_full', '')[:150] + '...'
        }

        if tokens_total >= 200 and samples_collected['excellent'] < MAX_SAMPLES_PER_TYPE:
            validation_stats['samples']['excellent'].append(sample_data)
            samples_collected['excellent'] += 1
        elif 50 <= tokens_total < 200 and samples_collected['good'] < MAX_SAMPLES_PER_TYPE:
            validation_stats['samples']['good'].append(sample_data)
            samples_collected['good'] += 1
        elif 0 < tokens_total < 50 and samples_collected['poor'] < MAX_SAMPLES_PER_TYPE:
            validation_stats['samples']['poor'].append(sample_data)
            samples_collected['poor'] += 1
        elif not has_cot and samples_collected['no_cot'] < MAX_SAMPLES_PER_TYPE:
            validation_stats['samples']['no_cot'].append(sample_data)
            samples_collected['no_cot'] += 1

        # 진행 상황
        if validation_stats['total_samples'] % 10000 == 0:
            print(f"[진행] {validation_stats['total_samples']:,} 검증 완료")

# 카테고리별 평균 계산
for category, stats in validation_stats['by_category'].items():
    if stats['count'] > 0:
        stats['avg_tokens'] = stats['avg_tokens'] / stats['count']

# 백분율 추가 계산
total = validation_stats['total_samples']
if total > 0:
    validation_stats['percentages'] = {
        'cot_coverage': validation_stats['cot_structure']['has_cot'] / total * 100,
        'complete_cot_rate': validation_stats['cot_structure']['complete_cot'] / total * 100,
        'rapa_pass_rate': validation_stats['rapa_criteria']['both_pass'] / total * 100,
        'token_pass_rate': validation_stats['rapa_criteria']['token_pass'] / total * 100,
        'application_pass_rate': validation_stats['rapa_criteria']['application_pass'] / total * 100
    }

# JSON으로 저장
with open(OUTPUT_REPORT, 'w', encoding='utf-8') as f:
    json.dump(validation_stats, f, ensure_ascii=False, indent=2)

# 콘솔 출력
print("\n" + "=" * 70)
print("검증 완료!")
print("=" * 70)
print(f"\n📊 전체 통계")
print(f"  총 샘플: {total:,}개")
print(f"  비디오: {validation_stats['media_type'].get('video', 0):,}개")
print(f"  이미지: {validation_stats['media_type'].get('image', 0):,}개")

print(f"\n📝 COT 구조")
print(f"  COT 있음: {validation_stats['cot_structure']['has_cot']:,}개 "
      f"({validation_stats['percentages']['cot_coverage']:.1f}%)")
print(f"  COT 없음: {validation_stats['cot_structure']['no_cot']:,}개")
print(f"  완전한 COT (3레벨): {validation_stats['cot_structure']['complete_cot']:,}개 "
      f"({validation_stats['percentages']['complete_cot_rate']:.1f}%)")

print(f"\n🎯 RAPA 2025 기준")
print(f"  토큰 50+ 통과: {validation_stats['rapa_criteria']['token_pass']:,}개 "
      f"({validation_stats['percentages']['token_pass_rate']:.1f}%)")
print(f"  활용분야 5+ 통과: {validation_stats['rapa_criteria']['application_pass']:,}개 "
      f"({validation_stats['percentages']['application_pass_rate']:.1f}%)")
print(f"  전체 통과: {validation_stats['rapa_criteria']['both_pass']:,}개 "
      f"({validation_stats['percentages']['rapa_pass_rate']:.1f}%)")
print(f"  전체 미통과: {validation_stats['rapa_criteria']['both_fail']:,}개")

print(f"\n📈 토큰 분포")
for range_name, count in sorted(validation_stats['token_distribution'].items()):
    pct = count / total * 100 if total > 0 else 0
    print(f"  {range_name:>8} 토큰: {count:>7,}개 ({pct:>5.1f}%)")

print(f"\n⚠️  품질 이슈")
for issue, count in validation_stats['issues'].items():
    pct = count / total * 100 if total > 0 else 0
    print(f"  {issue:20}: {count:>7,}개 ({pct:>5.1f}%)")

print(f"\n💾 상세 리포트: {OUTPUT_REPORT}")
print("=" * 70)
