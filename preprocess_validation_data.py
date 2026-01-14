#!/usr/bin/env python3
"""
검증 데이터 전처리 스크립트
- all_val.csv를 읽어서 원본 파일 찾기
- 1280×720 변환
- 품질 필터링
- 최종 clean validation dataset 생성
"""

import csv
import json
import os
import shutil
import subprocess
from pathlib import Path
from tqdm import tqdm
from collections import defaultdict, Counter
import cv2
import re
import argparse


class ValidationDataPreprocessor:
    """검증 데이터 전처리"""

    def __init__(self, val_csv_path, output_dir):
        self.val_csv_path = Path(val_csv_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 변환된 파일 저장 경로
        self.converted_video_dir = self.output_dir / 'converted_720p'
        self.converted_image_dir = self.output_dir / 'images_1280x720'
        self.converted_video_dir.mkdir(exist_ok=True)
        self.converted_image_dir.mkdir(exist_ok=True)

        # 통계
        self.stats = defaultdict(int)

        # 품질 기준 (학습 데이터와 동일)
        self.min_caption_length = 50
        self.max_caption_length = 1500
        self.min_video_length = 5.0
        self.max_video_length = 45.0

        # Wan2.2 지원 해상도
        self.target_resolution = (1280, 720)

    def parse_video_length(self, length_str):
        """00:00:21.15 형식을 초로 변환"""
        try:
            parts = length_str.split(':')
            if len(parts) == 3:
                h, m, s = parts
                return int(h) * 3600 + int(m) * 60 + float(s)
        except:
            pass
        return 0

    def convert_video_to_720p(self, input_path, output_path):
        """비디오를 1280×720으로 변환"""
        try:
            # ffmpeg 명령어
            cmd = [
                'ffmpeg',
                '-i', str(input_path),
                '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-y',
                str(output_path)
            ]

            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300
            )

            if result.returncode == 0 and output_path.exists():
                return True
            else:
                return False

        except Exception as e:
            print(f"비디오 변환 실패 {input_path}: {e}")
            return False

    def convert_image_to_720p(self, input_path, output_path):
        """이미지를 1280×720으로 변환"""
        try:
            img = cv2.imread(str(input_path))
            if img is None:
                return False

            # 1280×720으로 리사이즈 (aspect ratio 유지)
            h, w = img.shape[:2]
            target_w, target_h = self.target_resolution

            # 비율 계산
            scale = min(target_w / w, target_h / h)
            new_w = int(w * scale)
            new_h = int(h * scale)

            # 리사이즈
            resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

            # 패딩 (중앙 정렬)
            canvas = cv2.copyMakeBorder(
                resized,
                (target_h - new_h) // 2,
                (target_h - new_h + 1) // 2,
                (target_w - new_w) // 2,
                (target_w - new_w + 1) // 2,
                cv2.BORDER_CONSTANT,
                value=[0, 0, 0]
            )

            # 크기 확인
            canvas = cv2.resize(canvas, (target_w, target_h))

            cv2.imwrite(str(output_path), canvas)
            return output_path.exists()

        except Exception as e:
            print(f"이미지 변환 실패 {input_path}: {e}")
            return False

    def check_quality(self, row):
        """품질 검사 (결함 여부 반환)"""
        issues = []

        caption = row.get('caption', '')
        media_type = row.get('media_type', '')
        length = row.get('length', '')

        # 1. Caption 길이
        caption_len = len(caption)
        if caption_len < self.min_caption_length:
            issues.append(f'too_short_{caption_len}')
        elif caption_len > self.max_caption_length:
            issues.append(f'too_long_{caption_len}')

        # 2. 반복 패턴
        words = re.findall(r'[가-힣a-zA-Z0-9]+', caption)
        if words:
            word_counts = Counter(words)
            for word, count in word_counts.items():
                if count > 10 and len(word) > 2:
                    issues.append(f'repetition_{word}_{count}')
                    break

        # 3. 비디오 길이
        if media_type == 'video' and length:
            video_len = self.parse_video_length(length)
            if video_len == 0:
                issues.append('invalid_length')
            elif video_len < self.min_video_length:
                issues.append(f'too_short_video_{video_len:.1f}s')
            elif video_len > self.max_video_length:
                issues.append(f'too_long_video_{video_len:.1f}s')

        return issues

    def process_validation_data(self):
        """검증 데이터 처리"""
        print("검증 데이터 전처리 시작...")
        print(f"입력: {self.val_csv_path}")
        print(f"출력: {self.output_dir}")

        # CSV 읽기
        with open(self.val_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            val_data = list(reader)

        total = len(val_data)
        print(f"\n총 검증 샘플: {total:,}개")

        converted_data = []
        defective_data = []

        # 배치 디렉토리 생성 (100개씩)
        batch_size = 100

        for idx, row in enumerate(tqdm(val_data, desc="Converting")):
            clip_id = row['clip_id']
            media_type = row['media_type']
            original_path = Path(row['file_path'])

            # 원본 파일 존재 확인
            if not original_path.exists():
                self.stats['missing_original'] += 1
                defective_data.append({
                    'clip_id': clip_id,
                    'reason': 'missing_original_file',
                    **row
                })
                continue

            # 품질 검사
            quality_issues = self.check_quality(row)
            if quality_issues:
                self.stats['quality_failed'] += 1
                defective_data.append({
                    'clip_id': clip_id,
                    'reason': ', '.join(quality_issues),
                    **row
                })
                continue

            # 배치 번호 계산
            batch_num = idx // batch_size
            batch_name = f'batch_{batch_num:04d}'

            # 변환 경로 설정
            if media_type == 'video':
                batch_dir = self.converted_video_dir / batch_name
                batch_dir.mkdir(exist_ok=True)
                output_path = batch_dir / f'{clip_id}.mp4'

                # 비디오 변환
                success = self.convert_video_to_720p(original_path, output_path)

            else:  # image
                batch_dir = self.converted_image_dir / batch_name
                batch_dir.mkdir(exist_ok=True)
                output_path = batch_dir / f'{clip_id}.png'

                # 이미지 변환
                success = self.convert_image_to_720p(original_path, output_path)

            if success:
                self.stats['converted_success'] += 1

                # 변환된 데이터 추가
                converted_data.append({
                    'clip_id': clip_id,
                    'media_type': media_type,
                    'file_path': str(output_path),
                    'caption': row['caption'],
                    'resolution': '1280, 720',  # 변환 완료
                    'length': row.get('length', ''),
                    'category': row.get('category', ''),
                    'keyword': row.get('keyword', ''),
                })
            else:
                self.stats['conversion_failed'] += 1
                defective_data.append({
                    'clip_id': clip_id,
                    'reason': 'conversion_failed',
                    **row
                })

        return converted_data, defective_data

    def save_results(self, converted_data, defective_data):
        """결과 저장"""
        # 정상 데이터 저장 (clean validation dataset)
        clean_path = self.output_dir / 'all_val_clean.csv'
        with open(clean_path, 'w', encoding='utf-8', newline='') as f:
            if converted_data:
                fieldnames = converted_data[0].keys()
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(converted_data)

        print(f"\n✅ 정상 검증 데이터 저장: {clean_path}")
        print(f"   샘플 수: {len(converted_data):,}개")

        # 결함 데이터 저장
        if defective_data:
            defect_path = self.output_dir / 'val_defective_samples.csv'
            with open(defect_path, 'w', encoding='utf-8', newline='') as f:
                fieldnames = defective_data[0].keys()
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(defective_data)

            print(f"\n❌ 결함 검증 데이터 저장: {defect_path}")
            print(f"   샘플 수: {len(defective_data):,}개")

    def print_statistics(self, converted_count, defective_count, total):
        """통계 출력"""
        print(f"\n{'='*80}")
        print("검증 데이터 전처리 통계")
        print(f"{'='*80}")
        print(f"총 샘플:          {total:,}개")
        print(f"변환 성공:        {converted_count:,}개 ({converted_count/total*100:.2f}%)")
        print(f"결함/실패:        {defective_count:,}개 ({defective_count/total*100:.2f}%)")
        print(f"\n상세:")
        print(f"  - 원본 파일 없음:  {self.stats['missing_original']:,}개")
        print(f"  - 품질 미달:      {self.stats['quality_failed']:,}개")
        print(f"  - 변환 실패:      {self.stats['conversion_failed']:,}개")
        print(f"  - 변환 성공:      {self.stats['converted_success']:,}개")
        print(f"{'='*80}\n")


def main():
    parser = argparse.ArgumentParser(description='검증 데이터 전처리')
    parser.add_argument('--val_csv', type=str,
                       default='./preprocessed_data/all_val.csv',
                       help='검증 데이터 CSV 경로')
    parser.add_argument('--output_dir', type=str,
                       default='./preprocessed_data_val_clean',
                       help='출력 디렉토리')

    args = parser.parse_args()

    # ffmpeg 설치 확인
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError:
        print("❌ ffmpeg가 설치되어 있지 않습니다!")
        print("설치: sudo apt install ffmpeg")
        return

    processor = ValidationDataPreprocessor(args.val_csv, args.output_dir)

    # 처리
    print("⚠️  이 작업은 1-2시간 소요될 수 있습니다.")
    input("계속하려면 Enter를 누르세요...")

    converted_data, defective_data = processor.process_validation_data()

    # 통계
    total = len(converted_data) + len(defective_data)
    processor.print_statistics(len(converted_data), len(defective_data), total)

    # 저장
    processor.save_results(converted_data, defective_data)

    # 최종 요약
    print(f"\n{'='*80}")
    print("최종 요약")
    print(f"{'='*80}")
    print(f"✅ 사용 가능한 검증 데이터: {len(converted_data):,}개")
    print(f"   경로: {args.output_dir}/all_val_clean.csv")
    print(f"\n다음 단계:")
    print(f"  1. 학습 데이터: ./data_quality_analysis/clean_dataset.csv (167,906개)")
    print(f"  2. 검증 데이터: {args.output_dir}/all_val_clean.csv ({len(converted_data):,}개)")
    print(f"  3. 학습 스크립트 업데이트 후 학습 시작!")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
