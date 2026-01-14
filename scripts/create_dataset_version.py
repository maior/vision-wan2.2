#!/usr/bin/env python3
"""
데이터셋 버전 정보 생성
재현성 및 추적을 위한 메타데이터 저장
"""

import json
import hashlib
import os
import csv
from datetime import datetime
from pathlib import Path

# 경로 설정
CSV_PATH = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'
VALIDATION_REPORT = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/quality_validation_report.json'
VERSION_FILE = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/dataset_version.json'
PREPROCESSED_DIR = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data'

print("=" * 70)
print("데이터셋 버전 정보 생성")
print("=" * 70)

def compute_file_hash(file_path, chunk_size=8192):
    """파일의 MD5 해시 계산"""
    md5 = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                md5.update(chunk)
        return md5.hexdigest()
    except Exception as e:
        return f"ERROR: {e}"

def get_file_stats(file_path):
    """파일 통계 정보"""
    try:
        stat = os.stat(file_path)
        return {
            'size_bytes': stat.st_size,
            'size_mb': round(stat.st_size / (1024 * 1024), 2),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
        }
    except:
        return None

def count_csv_rows(csv_path):
    """CSV 행 수 카운트"""
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            return sum(1 for _ in f) - 1  # 헤더 제외
    except:
        return 0

def get_git_info():
    """Git 정보 가져오기"""
    import subprocess
    try:
        commit = subprocess.check_output(
            ['git', 'rev-parse', 'HEAD'],
            cwd='/home/maiordba/projects/vision/Wan2.2',
            stderr=subprocess.DEVNULL
        ).decode().strip()

        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd='/home/maiordba/projects/vision/Wan2.2',
            stderr=subprocess.DEVNULL
        ).decode().strip()

        return {
            'commit': commit,
            'branch': branch
        }
    except:
        return {'commit': 'N/A', 'branch': 'N/A'}

print("\n파일 해시 계산 중...")
csv_hash = compute_file_hash(CSV_PATH)
print(f"  CSV 해시: {csv_hash}")

print("\n파일 통계 수집 중...")
csv_stats = get_file_stats(CSV_PATH)

print("\n품질 리포트 로드 중...")
validation_data = None
if os.path.exists(VALIDATION_REPORT):
    with open(VALIDATION_REPORT, 'r', encoding='utf-8') as f:
        validation_data = json.load(f)

print("\nGit 정보 수집 중...")
git_info = get_git_info()

# 전처리된 파일 통계
print("\n전처리 파일 통계 수집 중...")
video_dir = Path(PREPROCESSED_DIR) / 'converted_720p'
image_dir = Path(PREPROCESSED_DIR) / 'images_1280x720'

video_files = list(video_dir.rglob('*.mp4')) if video_dir.exists() else []
image_files = list(image_dir.rglob('*.png')) if image_dir.exists() else []

preprocessed_stats = {
    'video': {
        'count': len(video_files),
        'total_size_gb': sum(f.stat().st_size for f in video_files) / (1024**3) if video_files else 0
    },
    'image': {
        'count': len(image_files),
        'total_size_gb': sum(f.stat().st_size for f in image_files) / (1024**3) if image_files else 0
    }
}

# 버전 정보 생성
version_info = {
    'version': 'v1.0.0',
    'created_at': datetime.now().isoformat(),
    'dataset_name': 'MBC_Wan2.2_LoRA_Training',

    # 데이터셋 파일
    'files': {
        'main_csv': {
            'path': CSV_PATH,
            'hash': csv_hash,
            'rows': count_csv_rows(CSV_PATH),
            'stats': csv_stats
        }
    },

    # 전처리 통계
    'preprocessing': {
        'video_dir': str(video_dir),
        'image_dir': str(image_dir),
        'video_files': preprocessed_stats['video']['count'],
        'image_files': preprocessed_stats['image']['count'],
        'total_size_gb': preprocessed_stats['video']['total_size_gb'] + preprocessed_stats['image']['total_size_gb'],
        'resolution': '1280x720',
        'completed_at': datetime.now().isoformat()
    },

    # 품질 지표
    'quality_metrics': {},

    # Git 정보
    'git': git_info,

    # 환경 정보
    'environment': {
        'python_version': '3.x',
        'server': 'maiordba@server',
        'gpu': 'V100 32GB x 2'
    },

    # 학습 준비 상태
    'training_ready': False,

    # 변경 이력
    'changelog': [
        {
            'version': 'v1.0.0',
            'date': datetime.now().isoformat(),
            'changes': [
                'COT 구조를 포함한 CSV 생성',
                '170,180개 샘플 (비디오 80,106 + 이미지 90,074)',
                '1280x720 해상도로 전처리 완료',
                'RAPA 2025 품질 기준 검증 추가'
            ]
        }
    ]
}

# 검증 데이터가 있으면 품질 지표 추가
if validation_data:
    version_info['quality_metrics'] = {
        'total_samples': validation_data.get('total_samples', 0),
        'cot_coverage': validation_data.get('percentages', {}).get('cot_coverage', 0),
        'complete_cot_rate': validation_data.get('percentages', {}).get('complete_cot_rate', 0),
        'rapa_pass_rate': validation_data.get('percentages', {}).get('rapa_pass_rate', 0),
        'token_pass_rate': validation_data.get('percentages', {}).get('token_pass_rate', 0),
        'application_pass_rate': validation_data.get('percentages', {}).get('application_pass_rate', 0),
        'avg_tokens': sum(
            validation_data.get('token_distribution', {}).values()
        ) / max(validation_data.get('total_samples', 1), 1)
    }

    # 학습 준비 상태 판단
    version_info['training_ready'] = (
        validation_data.get('total_samples', 0) > 100000 and
        preprocessed_stats['video']['count'] > 70000 and
        preprocessed_stats['image']['count'] > 80000
    )

# JSON 저장
with open(VERSION_FILE, 'w', encoding='utf-8') as f:
    json.dump(version_info, f, ensure_ascii=False, indent=2)

# 콘솔 출력
print("\n" + "=" * 70)
print("버전 정보 생성 완료!")
print("=" * 70)
print(f"\n📦 버전: {version_info['version']}")
print(f"📅 생성일시: {version_info['created_at']}")
print(f"\n📊 데이터셋 통계")
print(f"  전체 샘플: {version_info['quality_metrics'].get('total_samples', 0):,}개")
print(f"  비디오 파일: {preprocessed_stats['video']['count']:,}개")
print(f"  이미지 파일: {preprocessed_stats['image']['count']:,}개")
print(f"  총 용량: {version_info['preprocessing']['total_size_gb']:.2f} GB")

print(f"\n🎯 품질 지표")
print(f"  COT 커버리지: {version_info['quality_metrics'].get('cot_coverage', 0):.1f}%")
print(f"  완전한 COT: {version_info['quality_metrics'].get('complete_cot_rate', 0):.1f}%")
print(f"  RAPA 통과율: {version_info['quality_metrics'].get('rapa_pass_rate', 0):.1f}%")

print(f"\n🔧 Git 정보")
print(f"  브랜치: {git_info['branch']}")
print(f"  커밋: {git_info['commit'][:8]}")

print(f"\n✅ 학습 준비: {'완료' if version_info['training_ready'] else '진행중'}")

print(f"\n💾 버전 파일: {VERSION_FILE}")
print("=" * 70)
