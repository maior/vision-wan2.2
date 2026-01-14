#!/usr/bin/env python3
"""
COT 정보를 포함한 새 CSV 생성
JSON에서 계층적 caption 구조를 추출하여 저장
"""

import json
import csv
import os
from pathlib import Path
from collections import defaultdict

# 경로 설정
JSON_BASE = '/home/devfit2/mbc_json'
ORIGINAL_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'
VIDEO_DIR = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/converted_720p'
IMAGE_DIR = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_1280x720'

print("=" * 70)
print("COT 정보 포함 CSV 재생성")
print("=" * 70)
print(f"입력 CSV: {ORIGINAL_CSV}")
print(f"출력 CSV: {OUTPUT_CSV}")
print(f"JSON 베이스: {JSON_BASE}")
print("=" * 70)

# 통계
stats = {
    'total': 0,
    'with_cot': 0,
    'without_cot': 0,
    'json_not_found': 0,
    'video': 0,
    'image': 0,
    'tokens_total': 0,
    'quality_pass': 0,
    'quality_fail': 0
}

def extract_cot_from_json(json_path):
    """JSON에서 COT 정보 추출"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        caption_info = data.get('labeling_data_info', {}).get('caption_info', {})

        # 각 레벨 추출
        object_level = caption_info.get('object_level', [])
        semantic_level = caption_info.get('semantic_level', [])
        application_level = caption_info.get('application_level', [])

        # 텍스트와 토큰 합치기
        object_texts = [item['text'] for item in object_level if 'text' in item]
        object_tokens = sum(item.get('token', 0) for item in object_level)

        semantic_texts = [item['text'] for item in semantic_level if 'text' in item]
        semantic_tokens = sum(item.get('token', 0) for item in semantic_level)

        application_texts = [item['text'] for item in application_level if 'text' in item]
        application_tokens = sum(item.get('token', 0) for item in application_level)

        # 전체 caption
        all_texts = object_texts + semantic_texts + application_texts
        caption_full = ' '.join(all_texts)

        total_tokens = object_tokens + semantic_tokens + application_tokens

        # 추가 메타데이터
        category = data.get('source_data_info', {}).get('ai_generated_info', {}).get('mid_category', '')
        keyword = data.get('source_data_info', {}).get('ai_generated_info', {}).get('keyword', '')

        return {
            'caption_object': ' '.join(object_texts),
            'tokens_object': object_tokens,
            'caption_semantic': ' '.join(semantic_texts),
            'tokens_semantic': semantic_tokens,
            'caption_application': ' '.join(application_texts),
            'tokens_application': application_tokens,
            'caption_full': caption_full,
            'tokens_total': total_tokens,
            'has_cot': len(object_level) > 0 or len(semantic_level) > 0 or len(application_level) > 0,
            'num_application_areas': len(application_texts),
            'category': category,
            'keyword': keyword
        }

    except Exception as e:
        print(f"  [ERROR] JSON 파싱 실패: {json_path} - {e}")
        return None

def find_json_file(clip_id, media_type):
    """clip_id로 JSON 파일 찾기"""
    base_dir = os.path.join(JSON_BASE, media_type)

    # batch 디렉토리 순회
    for batch_dir in Path(base_dir).glob('batch_*'):
        json_path = batch_dir / f"{clip_id}.json"
        if json_path.exists():
            return str(json_path)

    return None

# CSV 읽기 및 COT 정보 추출
print("\nCSV 처리 시작...\n")

with open(ORIGINAL_CSV, 'r', encoding='utf-8') as fin, \
     open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as fout:

    reader = csv.DictReader(fin)

    # 새로운 필드 추가
    fieldnames = [
        'clip_id',
        'media_type',
        'file_path',
        'caption_object',
        'tokens_object',
        'caption_semantic',
        'tokens_semantic',
        'caption_application',
        'tokens_application',
        'caption_full',
        'tokens_total',
        'resolution',
        'length',
        'category',
        'keyword',
        'has_cot',
        'num_application_areas',
        'quality_pass'
    ]

    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        stats['total'] += 1

        clip_id = row['clip_id']
        media_type = row['media_type']
        file_path = row['file_path']

        # 통계
        if media_type == 'video':
            stats['video'] += 1
        else:
            stats['image'] += 1

        # JSON 파일 찾기
        json_path = find_json_file(clip_id, media_type)

        if not json_path:
            stats['json_not_found'] += 1
            # JSON이 없으면 기존 caption 사용
            new_row = {
                'clip_id': clip_id,
                'media_type': media_type,
                'file_path': file_path,
                'caption_object': '',
                'tokens_object': 0,
                'caption_semantic': '',
                'tokens_semantic': 0,
                'caption_application': '',
                'tokens_application': 0,
                'caption_full': row.get('caption', ''),
                'tokens_total': 0,
                'resolution': row.get('resolution', ''),
                'length': row.get('length', ''),
                'category': row.get('category', ''),
                'keyword': row.get('keyword', ''),
                'has_cot': False,
                'num_application_areas': 0,
                'quality_pass': False
            }
        else:
            # JSON에서 COT 추출
            cot_data = extract_cot_from_json(json_path)

            if cot_data:
                if cot_data['has_cot']:
                    stats['with_cot'] += 1
                else:
                    stats['without_cot'] += 1

                stats['tokens_total'] += cot_data['tokens_total']

                # RAPA 2025 기준 검증
                quality_pass = (
                    cot_data['tokens_total'] >= 50 and
                    cot_data['num_application_areas'] >= 5
                )

                if quality_pass:
                    stats['quality_pass'] += 1
                else:
                    stats['quality_fail'] += 1

                new_row = {
                    'clip_id': clip_id,
                    'media_type': media_type,
                    'file_path': file_path,
                    'caption_object': cot_data['caption_object'],
                    'tokens_object': cot_data['tokens_object'],
                    'caption_semantic': cot_data['caption_semantic'],
                    'tokens_semantic': cot_data['tokens_semantic'],
                    'caption_application': cot_data['caption_application'],
                    'tokens_application': cot_data['tokens_application'],
                    'caption_full': cot_data['caption_full'],
                    'tokens_total': cot_data['tokens_total'],
                    'resolution': row.get('resolution', ''),
                    'length': row.get('length', ''),
                    'category': cot_data['category'] or row.get('category', ''),
                    'keyword': cot_data['keyword'] or row.get('keyword', ''),
                    'has_cot': cot_data['has_cot'],
                    'num_application_areas': cot_data['num_application_areas'],
                    'quality_pass': quality_pass
                }
            else:
                # JSON 파싱 실패
                new_row = {
                    'clip_id': clip_id,
                    'media_type': media_type,
                    'file_path': file_path,
                    'caption_object': '',
                    'tokens_object': 0,
                    'caption_semantic': '',
                    'tokens_semantic': 0,
                    'caption_application': '',
                    'tokens_application': 0,
                    'caption_full': row.get('caption', ''),
                    'tokens_total': 0,
                    'resolution': row.get('resolution', ''),
                    'length': row.get('length', ''),
                    'category': row.get('category', ''),
                    'keyword': row.get('keyword', ''),
                    'has_cot': False,
                    'num_application_areas': 0,
                    'quality_pass': False
                }

        writer.writerow(new_row)

        # 진행 상황 출력
        if stats['total'] % 10000 == 0:
            print(f"[진행] {stats['total']:,} 처리 | "
                  f"COT 있음: {stats['with_cot']:,} | "
                  f"COT 없음: {stats['without_cot']:,} | "
                  f"품질 통과: {stats['quality_pass']:,}")

print("\n" + "=" * 70)
print("처리 완료!")
print("=" * 70)
print(f"총 처리: {stats['total']:,}개")
print(f"비디오: {stats['video']:,}개")
print(f"이미지: {stats['image']:,}개")
print(f"\nCOT 구조:")
print(f"  - COT 있음: {stats['with_cot']:,}개 ({stats['with_cot']/stats['total']*100:.1f}%)")
print(f"  - COT 없음: {stats['without_cot']:,}개 ({stats['without_cot']/stats['total']*100:.1f}%)")
print(f"  - JSON 미발견: {stats['json_not_found']:,}개")
print(f"\n토큰 통계:")
print(f"  - 평균 토큰 수: {stats['tokens_total']/max(stats['total'], 1):.1f}")
print(f"\nRAPA 2025 품질:")
print(f"  - 통과: {stats['quality_pass']:,}개 ({stats['quality_pass']/stats['total']*100:.1f}%)")
print(f"  - 미통과: {stats['quality_fail']:,}개 ({stats['quality_fail']/stats['total']*100:.1f}%)")
print(f"\n출력 파일: {OUTPUT_CSV}")
print("=" * 70)
