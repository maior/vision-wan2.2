#!/usr/bin/env python3
"""
CSV 데이터를 SQLite 데이터베이스로 import하는 스크립트
"""

import os
import sys
import pandas as pd
from pathlib import Path

# Backend 모듈 import를 위한 path 추가
sys.path.insert(0, str(Path(__file__).parent.parent / "services" / "backend"))

from app.database import engine, Base, SessionLocal
from app.database import DataSample, Statistics
from sqlalchemy import func

def parse_duration(duration_str):
    """
    시간 문자열을 초로 변환
    '00:00:21.15' -> 21.15
    '00:01:30.50' -> 90.50
    """
    if pd.isna(duration_str):
        return 0.0

    duration_str = str(duration_str).strip()

    # 이미 숫자인 경우
    try:
        return float(duration_str)
    except ValueError:
        pass

    # HH:MM:SS.ms 형식 파싱
    try:
        parts = duration_str.split(':')
        if len(parts) == 3:
            hours = float(parts[0])
            minutes = float(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds
        elif len(parts) == 2:
            minutes = float(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds
        else:
            return float(duration_str)
    except:
        return 0.0

def import_csv_to_db():
    """CSV 파일들을 데이터베이스로 import"""

    print("=" * 60)
    print("CSV → SQLite 데이터 Import 시작")
    print("=" * 60)

    # 데이터베이스 테이블 생성
    print("\n1. 데이터베이스 초기화...")
    Base.metadata.create_all(bind=engine)
    print("✓ 테이블 생성 완료")

    # CSV 파일 경로
    csv_files = {
        'train': './preprocessed_data/all_train.csv',
        'val': './preprocessed_data/all_val.csv',
        'test': './preprocessed_data/test_100.csv'
    }

    # 파일 존재 확인
    print("\n2. CSV 파일 확인...")
    for name, path in csv_files.items():
        if os.path.exists(path):
            size = os.path.getsize(path) / (1024 * 1024)  # MB
            print(f"  ✓ {name}: {path} ({size:.2f} MB)")
        else:
            print(f"  ✗ {name}: {path} (파일 없음)")

    # 세션 생성
    db = SessionLocal()

    try:
        # 기존 데이터 삭제
        print("\n3. 기존 데이터 정리...")
        db.query(DataSample).delete()
        db.query(Statistics).delete()
        db.commit()
        print("✓ 기존 데이터 삭제 완료")

        # CSV 데이터 import
        print("\n4. CSV 데이터 import 중...")
        total_imported = 0
        imported_clip_ids = set()  # 전체 CSV에서 이미 import된 clip_id 추적

        for name, path in csv_files.items():
            if not os.path.exists(path):
                print(f"  ⊗ {name} 건너뜀 (파일 없음)")
                continue

            print(f"\n  Processing {name}...")
            df = pd.read_csv(path)

            # 중복 clip_id 제거 (첫 번째 항목 유지)
            original_count = len(df)
            df = df.drop_duplicates(subset=['clip_id'], keep='first')
            duplicates_removed = original_count - len(df)
            if duplicates_removed > 0:
                print(f"    ⚠ 중복 제거: {duplicates_removed}개 (원본: {original_count}, 정리 후: {len(df)})")

            # 데이터 검증
            required_columns = ['clip_id', 'media_type', 'file_path', 'caption']
            if not all(col in df.columns for col in required_columns):
                print(f"    ✗ 필수 컬럼 누락: {required_columns}")
                continue

            # 배치 처리 (메모리 효율)
            batch_size = 1000
            for i in range(0, len(df), batch_size):
                batch = df.iloc[i:i+batch_size]

                for _, row in batch.iterrows():
                    clip_id = str(row['clip_id'])

                    # 이미 import된 clip_id는 건너뛰기
                    if clip_id in imported_clip_ids:
                        continue

                    try:
                        # 품질 점수 계산 (간단한 휴리스틱)
                        caption_len = len(str(row['caption']))
                        quality_score = min(100, max(0,
                            50 + (caption_len / 2) if caption_len > 0 else 0
                        ))

                        # 이슈 판단 (간단한 규칙)
                        has_issues = (
                            caption_len < 10 or
                            caption_len > 500 or
                            pd.isna(row.get('category', None))
                        )

                        sample = DataSample(
                            clip_id=clip_id,
                            media_type=str(row['media_type']),
                            file_path=str(row['file_path']),
                            caption=str(row['caption']),
                            resolution=row.get('resolution', 'unknown'),
                            length=parse_duration(row.get('length', 0)),
                            category=row.get('category', 'uncategorized'),
                            keyword=row.get('keyword', ''),
                            quality_score=quality_score,
                            has_issues=has_issues
                        )
                        db.add(sample)
                        imported_clip_ids.add(clip_id)  # 성공적으로 추가되면 set에 기록
                    except Exception as e:
                        # 중복이나 기타 오류 발생 시 계속
                        continue

                # 배치 커밋
                try:
                    db.commit()
                except:
                    db.rollback()
                imported = min(i + batch_size, len(df))
                print(f"    Progress: {imported}/{len(df)} ({imported/len(df)*100:.1f}%)", end='\r')

            print(f"\n  ✓ {name}: {len(df):,}개 import 완료")
            total_imported += len(df)

        print(f"\n5. 총 {total_imported:,}개 샘플 import 완료!")

        # 통계 생성
        print("\n6. 통계 생성 중...")

        # 전체 통계
        total_samples = db.query(func.count(DataSample.id)).scalar()
        video_count = db.query(func.count(DataSample.id)).filter(
            DataSample.media_type == 'video'
        ).scalar()
        image_count = db.query(func.count(DataSample.id)).filter(
            DataSample.media_type == 'image'
        ).scalar()
        avg_quality = db.query(func.avg(DataSample.quality_score)).scalar() or 0
        issues_count = db.query(func.count(DataSample.id)).filter(
            DataSample.has_issues == True
        ).scalar()

        # Statistics 테이블에 저장 (개별 통계 항목으로)
        stats_items = [
            Statistics(stat_type="dashboard", stat_key="total_samples", stat_value=float(total_samples)),
            Statistics(stat_type="dashboard", stat_key="video_count", stat_value=float(video_count)),
            Statistics(stat_type="dashboard", stat_key="image_count", stat_value=float(image_count)),
            Statistics(stat_type="dashboard", stat_key="avg_quality_score", stat_value=round(avg_quality, 2)),
            Statistics(stat_type="dashboard", stat_key="issues_count", stat_value=float(issues_count)),
            Statistics(stat_type="dashboard", stat_key="preprocessing_progress", stat_value=100.0),
        ]

        for stat in stats_items:
            db.add(stat)
        db.commit()

        print(f"""
✓ 통계 생성 완료:
  - 전체 샘플: {total_samples:,}
  - 비디오: {video_count:,}
  - 이미지: {image_count:,}
  - 평균 품질: {avg_quality:.2f}%
  - 이슈: {issues_count:,}
        """)

        print("\n" + "=" * 60)
        print("✓ 데이터 Import 완료!")
        print("=" * 60)
        print("\n대시보드를 새로고침하면 데이터가 표시됩니다.")
        print(f"데이터베이스 위치: services/backend/data_quality.db")

    except Exception as e:
        print(f"\n✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_csv_to_db()
