#!/usr/bin/env python3
"""
균형잡힌 50K 데이터셋 생성 스크립트
- 전체 175K 데이터에서 카테고리별로 균등하게 샘플링
- 품질 점수 기준으로 우선순위 부여
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re
from collections import Counter

# 경로 설정
INPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata_50k.csv'
TARGET_SAMPLES = 50000

# 카테고리 키워드 정의
CATEGORY_KEYWORDS = {
    "urban": ["도시", "건물", "도로", "차량", "거리", "교통", "건축", "주차", "고속도로", "아파트", "빌딩", "버스", "자동차", "트럭"],
    "nature": ["자연", "산", "바다", "나무", "숲", "강", "호수", "해변", "하늘", "구름", "경치", "풍경", "계곡", "들판"],
    "people": ["사람", "남성", "여성", "학생", "군중", "인물", "얼굴", "손", "발", "사람들", "인원", "관객"],
    "indoor": ["실내", "교실", "회의실", "병원", "방", "사무실", "강당", "복도", "천장", "벽", "바닥", "침대"],
    "action": ["걷는", "달리", "뛰", "움직", "이동", "운동", "경기", "춤", "작업", "수행", "진행", "활동"],
    "object": ["컨테이너", "크레인", "기계", "장비", "도구", "제품", "물건", "용기", "상자"],
    "animal": ["동물", "새", "고양이", "개", "물고기", "곤충", "말", "소"],
    "food": ["음식", "요리", "식품", "먹", "밥", "국", "빵", "과일", "야채"]
}

def classify_category(prompt):
    """프롬프트를 카테고리로 분류"""
    categories = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in prompt:
                categories.append(category)
                break
    return categories if categories else ['other']

def calculate_quality_score(row):
    """샘플의 품질 점수 계산 (0-100)"""
    score = 50.0  # 기본 점수

    # Caption 길이 기준
    caption_len = len(str(row.get('caption', '')))
    if caption_len > 500:
        score += 30
    elif caption_len > 200:
        score += 20
    elif caption_len > 100:
        score += 10

    # 해상도 기준 (1280x720 선호)
    resolution = str(row.get('resolution', ''))
    if '1280' in resolution or '720' in resolution:
        score += 10

    # 미디어 타입 (비디오 선호)
    if row.get('media_type') == 'video':
        score += 10

    return min(100, score)

print("=" * 70)
print("50K 균형잡힌 데이터셋 생성")
print("=" * 70)

# 1. 데이터 로드
print(f"\n📂 데이터 로딩 중: {INPUT_CSV}")
df = pd.read_csv(INPUT_CSV)
print(f"✓ 총 {len(df):,}개 샘플 로드됨")

# 2. 카테고리 분류 및 품질 점수 계산
print(f"\n🏷️  카테고리 분류 중...")
df['categories'] = df['caption'].apply(lambda x: classify_category(str(x)))
df['primary_category'] = df['categories'].apply(lambda x: x[0] if x else 'other')
df['quality_score'] = df.apply(calculate_quality_score, axis=1)

# 3. 현재 분포 확인
print(f"\n📊 원본 데이터 카테고리 분포:")
category_counts = df['primary_category'].value_counts()
for cat, count in category_counts.items():
    pct = (count / len(df)) * 100
    print(f"  {cat:15} {count:6,}개 ({pct:5.1f}%)")

# 4. 균형잡힌 샘플링 전략
# 각 카테고리에서 동일한 비율로 샘플링 (목표: 10-15% per category)
num_categories = len(CATEGORY_KEYWORDS) + 1  # +1 for 'other'
samples_per_category = TARGET_SAMPLES // num_categories

print(f"\n🎯 균형잡힌 샘플링 목표:")
print(f"  총 샘플: {TARGET_SAMPLES:,}개")
print(f"  카테고리당: ~{samples_per_category:,}개 (~{100/num_categories:.1f}%)")

# 5. 각 카테고리에서 품질 점수 기준으로 샘플링
selected_samples = []
remaining_samples = TARGET_SAMPLES

print(f"\n🔍 카테고리별 샘플 선택 중...")
for category in sorted(category_counts.index):
    # 해당 카테고리의 모든 샘플
    category_df = df[df['primary_category'] == category].copy()

    # 품질 점수로 정렬
    category_df = category_df.sort_values('quality_score', ascending=False)

    # 샘플 수 결정 (남은 카테고리 수 고려)
    categories_left = num_categories - len(selected_samples) // samples_per_category
    samples_to_take = min(
        samples_per_category,
        len(category_df),
        remaining_samples // max(1, categories_left)
    )

    # 샘플 선택
    sampled = category_df.head(samples_to_take)
    selected_samples.append(sampled)
    remaining_samples -= len(sampled)

    print(f"  {category:15} {len(sampled):6,}개 선택 (평균 품질: {sampled['quality_score'].mean():.1f})")

# 6. 남은 샘플을 품질 점수 기준으로 채우기
if remaining_samples > 0:
    print(f"\n⚡ 남은 {remaining_samples:,}개 샘플을 품질 점수 기준으로 채우는 중...")
    selected_clip_ids = set()
    for samples in selected_samples:
        selected_clip_ids.update(samples['clip_id'].tolist())

    remaining_df = df[~df['clip_id'].isin(selected_clip_ids)].copy()
    remaining_df = remaining_df.sort_values('quality_score', ascending=False)
    additional_samples = remaining_df.head(remaining_samples)
    selected_samples.append(additional_samples)
    print(f"✓ {len(additional_samples):,}개 추가 샘플 선택")

# 7. 최종 데이터셋 생성
print(f"\n🔨 최종 데이터셋 생성 중...")
final_df = pd.concat(selected_samples, ignore_index=True)

# 랜덤 섞기
final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"✓ 총 {len(final_df):,}개 샘플 선택됨")

# 8. 최종 분포 확인
print(f"\n📊 최종 데이터 카테고리 분포:")
final_category_counts = final_df['primary_category'].value_counts()
for cat, count in final_category_counts.items():
    pct = (count / len(final_df)) * 100
    original_pct = (category_counts.get(cat, 0) / len(df)) * 100
    print(f"  {cat:15} {count:6,}개 ({pct:5.1f}%) [원본: {original_pct:5.1f}%]")

# 9. DiffSynth 형식으로 저장
# 필요한 컬럼: video, prompt
print(f"\n💾 DiffSynth 형식으로 저장 중...")

# video 경로 생성 (file_path를 사용)
output_df = pd.DataFrame({
    'video': final_df['file_path'],
    'prompt': final_df['caption']
})

# CSV 저장
output_dir = Path(OUTPUT_CSV).parent
output_dir.mkdir(parents=True, exist_ok=True)
output_df.to_csv(OUTPUT_CSV, index=False)

print(f"✓ 저장 완료: {OUTPUT_CSV}")
print(f"  - 총 샘플: {len(output_df):,}개")
print(f"  - 컬럼: {list(output_df.columns)}")

# 10. 통계 정보 출력
print(f"\n📈 데이터셋 통계:")
print(f"  평균 캡션 길이: {final_df['caption'].apply(len).mean():.0f}자")
print(f"  평균 품질 점수: {final_df['quality_score'].mean():.1f}/100")
print(f"  비디오: {(final_df['media_type']=='video').sum():,}개")
print(f"  이미지: {(final_df['media_type']=='image').sum():,}개")

# 11. 예상 학습 시간
print(f"\n⏱️  예상 학습 시간 (480x832x9, 3 epochs):")
time_per_1k = 4.5  # hours for 3 epochs
estimated_time = (len(final_df) / 1000) * time_per_1k
print(f"  Single GPU: {estimated_time:.1f}시간 ({estimated_time/24:.1f}일)")
print(f"  Dual GPU:   {estimated_time/2:.1f}시간 ({estimated_time/2/24:.1f}일)")

print(f"\n✅ 50K 데이터셋 생성 완료!")
print("=" * 70)
