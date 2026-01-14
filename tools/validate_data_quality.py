#!/usr/bin/env python3
"""
데이터 품질 검증 스크립트
라벨링 품질, 메타데이터 정확성, 중복 등을 검사
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict, Counter
import pandas as pd
from tqdm import tqdm
import argparse
import cv2
import re


class DataQualityValidator:
    def __init__(self, data_root: str):
        self.data_root = Path(data_root)
        self.image_dir = self.data_root / "image"
        self.video_dir = self.data_root / "video"

        # 품질 이슈 추적
        self.issues = defaultdict(list)
        self.stats = defaultdict(int)

        # 검증 규칙
        self.min_caption_length = 20  # 최소 캡션 길이
        self.max_caption_length = 2000  # 최대 캡션 길이 (너무 길면 노이즈)
        self.min_video_length = 3.0  # 최소 비디오 길이 (초)
        self.max_video_length = 60.0  # 최대 비디오 길이 (초)

    def validate_json_structure(self, json_path: Path) -> List[str]:
        """JSON 구조 검증"""
        errors = []

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return [f"JSON 파싱 실패: {e}"]
        except Exception as e:
            return [f"파일 읽기 실패: {e}"]

        # 필수 필드 검사
        required_fields = [
            'source_data_info',
            'raw_data_info',
            'labeling_data_info',
        ]

        for field in required_fields:
            if field not in data:
                errors.append(f"필수 필드 누락: {field}")

        # Caption 검사
        if 'labeling_data_info' in data:
            caption_info = data['labeling_data_info'].get('caption_info', {})

            if not caption_info:
                errors.append("caption_info 누락")
            else:
                # 각 레벨 검사
                for level in ['object_level', 'semantic_level', 'application_level']:
                    if level not in caption_info:
                        errors.append(f"{level} 캡션 누락")
                    elif not caption_info[level]:
                        errors.append(f"{level} 캡션 비어있음")

        return errors

    def validate_caption_quality(self, json_data: Dict) -> List[str]:
        """Caption 품질 검증"""
        issues = []

        caption_info = json_data.get('labeling_data_info', {}).get('caption_info', {})

        if not caption_info:
            return ["caption_info 없음"]

        # 모든 캡션 수집
        all_captions = []

        for level in ['object_level', 'semantic_level', 'application_level']:
            captions = caption_info.get(level, [])
            for cap in captions:
                text = cap.get('text', '')
                if text:
                    all_captions.append(text)

        if not all_captions:
            issues.append("모든 캡션이 비어있음")
            return issues

        # 캡션 길이 검사
        combined_caption = ' '.join(all_captions)
        caption_len = len(combined_caption)

        if caption_len < self.min_caption_length:
            issues.append(f"캡션이 너무 짧음: {caption_len}자")
        elif caption_len > self.max_caption_length:
            issues.append(f"캡션이 너무 김: {caption_len}자 (노이즈 가능성)")

        # 반복 패턴 검사 (복붙 오류)
        for caption in all_captions:
            # 같은 문장이 3번 이상 반복되는지
            words = caption.split()
            if len(words) > 10:
                word_counts = Counter(words)
                for word, count in word_counts.items():
                    if count > 5 and len(word) > 2:
                        issues.append(f"단어 '{word}'가 {count}번 반복 (복붙 의심)")
                        break

        # 의미없는 텍스트 패턴
        meaningless_patterns = [
            r'^[ㄱ-ㅎㅏ-ㅣ]+$',  # 자음/모음만
            r'^[a-zA-Z\s]{100,}$',  # 영문만 100자 이상
            r'(\S)\1{10,}',  # 같은 문자 10번 이상 반복
        ]

        for pattern in meaningless_patterns:
            if re.search(pattern, combined_caption):
                issues.append(f"의심스러운 패턴 발견: {pattern}")

        # 빈 문장 검사
        empty_count = sum(1 for cap in all_captions if not cap.strip())
        if empty_count > 0:
            issues.append(f"빈 캡션 {empty_count}개 발견")

        return issues

    def validate_metadata(self, json_data: Dict, media_path: Path) -> List[str]:
        """메타데이터와 실제 파일 일치성 검증"""
        issues = []

        # 파일 존재 확인
        if not media_path.exists():
            issues.append(f"미디어 파일 없음: {media_path}")
            return issues

        # 해상도 검증
        try:
            if media_path.suffix.lower() in ['.mp4', '.avi', '.mov']:
                # 비디오
                cap = cv2.VideoCapture(str(media_path))
                if not cap.isOpened():
                    issues.append("비디오 파일 열기 실패")
                    return issues

                actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                actual_fps = cap.get(cv2.CAP_PROP_FPS)
                actual_frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

                if actual_frame_count > 0 and actual_fps > 0:
                    actual_duration = actual_frame_count / actual_fps
                else:
                    actual_duration = 0

                cap.release()

                # JSON의 메타데이터와 비교
                source_info = json_data.get('raw_data_info', {}).get('source_media_info', {})
                json_resolution = source_info.get('resolution', '')
                json_details = source_info.get('details', {})

                # 해상도 비교
                if json_resolution:
                    try:
                        parts = json_resolution.split(',')
                        json_width = int(parts[0].strip())
                        json_height = int(parts[1].strip())

                        if json_width != actual_width or json_height != actual_height:
                            issues.append(
                                f"해상도 불일치: JSON({json_width}×{json_height}) vs "
                                f"실제({actual_width}×{actual_height})"
                            )
                    except:
                        pass

                # 길이 검증
                if actual_duration < self.min_video_length:
                    issues.append(f"비디오가 너무 짧음: {actual_duration:.2f}초")
                elif actual_duration > self.max_video_length:
                    issues.append(f"비디오가 너무 김: {actual_duration:.2f}초")

            elif media_path.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                # 이미지
                img = cv2.imread(str(media_path))
                if img is None:
                    issues.append("이미지 파일 열기 실패")
                    return issues

                actual_height, actual_width = img.shape[:2]

                # JSON의 메타데이터와 비교
                source_info = json_data.get('raw_data_info', {}).get('source_media_info', {})
                json_resolution = source_info.get('resolution', '')

                if json_resolution:
                    try:
                        parts = json_resolution.split(',')
                        json_width = int(parts[0].strip())
                        json_height = int(parts[1].strip())

                        if json_width != actual_width or json_height != actual_height:
                            issues.append(
                                f"해상도 불일치: JSON({json_width}×{json_height}) vs "
                                f"실제({actual_width}×{actual_height})"
                            )
                    except:
                        pass

        except Exception as e:
            issues.append(f"메타데이터 검증 중 오류: {e}")

        return issues

    def validate_stt_quality(self, json_data: Dict) -> List[str]:
        """STT 스크립트 품질 검증 (비디오만)"""
        issues = []

        ai_info = json_data.get('source_data_info', {}).get('ai_generated_info', {})
        stt_script = ai_info.get('stt_script', '')

        if not stt_script:
            # STT 없는 것은 문제 아님 (무음 비디오일 수 있음)
            return issues

        # STT 길이 검사
        stt_len = len(stt_script)
        if stt_len < 10:
            issues.append(f"STT 스크립트가 너무 짧음: {stt_len}자")

        # STT 품질 패턴
        # 1. 인식 실패 패턴
        failure_patterns = [
            r'\[음성 인식 실패\]',
            r'\[불명확\]',
            r'\[INAUDIBLE\]',
        ]

        for pattern in failure_patterns:
            if re.search(pattern, stt_script, re.IGNORECASE):
                issues.append(f"STT 인식 실패 패턴 발견: {pattern}")

        # 2. 너무 많은 반복
        words = stt_script.split()
        if len(words) > 10:
            word_counts = Counter(words)
            for word, count in word_counts.items():
                if count > 10 and len(word) > 2:
                    issues.append(f"STT에서 단어 '{word}'가 {count}번 반복 (오류 의심)")
                    break

        return issues

    def check_duplicates(self, all_data: List[Dict]) -> Dict[str, List[str]]:
        """중복 데이터 검사"""
        duplicates = {
            'exact_caption': [],
            'similar_caption': [],
            'same_file': [],
        }

        # Caption 중복
        caption_to_ids = defaultdict(list)
        for item in all_data:
            clip_id = item['clip_id']
            caption = item.get('combined_caption', '')[:200]  # 앞 200자만
            caption_to_ids[caption].append(clip_id)

        for caption, ids in caption_to_ids.items():
            if len(ids) > 1:
                duplicates['exact_caption'].append({
                    'caption_preview': caption[:100],
                    'clip_ids': ids,
                    'count': len(ids),
                })

        return duplicates

    def validate_single_file(self, json_path: Path, media_path: Path) -> Dict:
        """단일 파일 검증"""
        result = {
            'clip_id': json_path.stem,
            'json_path': str(json_path),
            'media_path': str(media_path),
            'issues': [],
        }

        # JSON 구조 검증
        structure_errors = self.validate_json_structure(json_path)
        if structure_errors:
            result['issues'].extend([f"[구조] {e}" for e in structure_errors])
            return result  # 구조 오류면 더 이상 검증 불가

        # JSON 로드
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)

        # Caption 품질 검증
        caption_issues = self.validate_caption_quality(json_data)
        if caption_issues:
            result['issues'].extend([f"[캡션] {e}" for e in caption_issues])

        # 메타데이터 검증
        metadata_issues = self.validate_metadata(json_data, media_path)
        if metadata_issues:
            result['issues'].extend([f"[메타] {e}" for e in metadata_issues])

        # STT 검증 (비디오만)
        if media_path.suffix.lower() in ['.mp4', '.avi', '.mov']:
            stt_issues = self.validate_stt_quality(json_data)
            if stt_issues:
                result['issues'].extend([f"[STT] {e}" for e in stt_issues])

        return result

    def validate_batch(self, batch_dir: Path, media_type: str) -> List[Dict]:
        """배치 디렉토리 검증"""
        results = []

        json_files = list(batch_dir.glob("*.json"))

        for json_file in tqdm(json_files, desc=f"Validating {batch_dir.name}", leave=False):
            clip_id = json_file.stem

            # 미디어 파일 찾기
            if media_type == 'image':
                media_file = json_file.with_suffix('.png')
            else:  # video
                media_file = json_file.with_suffix('.mp4')

            result = self.validate_single_file(json_file, media_file)
            results.append(result)

            # 통계 업데이트
            self.stats['total_checked'] += 1
            if result['issues']:
                self.stats['files_with_issues'] += 1
                self.stats['total_issues'] += len(result['issues'])

        return results

    def run_validation(self, sample_size: int = None):
        """전체 검증 실행"""
        print("데이터 품질 검증 시작...")
        print(f"데이터 루트: {self.data_root}")

        all_results = []

        # 이미지 검증
        if self.image_dir.exists():
            print("\n이미지 데이터 검증 중...")
            image_batches = sorted([d for d in self.image_dir.iterdir() if d.is_dir()])

            if sample_size:
                image_batches = image_batches[:sample_size]

            for batch_dir in tqdm(image_batches, desc="Image batches"):
                results = self.validate_batch(batch_dir, 'image')
                all_results.extend(results)

        # 비디오 검증
        if self.video_dir.exists():
            print("\n비디오 데이터 검증 중...")
            video_batches = sorted([d for d in self.video_dir.iterdir() if d.is_dir()])

            if sample_size:
                video_batches = video_batches[:sample_size]

            for batch_dir in tqdm(video_batches, desc="Video batches"):
                results = self.validate_batch(batch_dir, 'video')
                all_results.extend(results)

        return all_results

    def generate_report(self, results: List[Dict], output_path: str):
        """품질 리포트 생성"""
        print("\n" + "="*80)
        print("데이터 품질 검증 리포트")
        print("="*80)

        print(f"\n총 검사 파일: {self.stats['total_checked']:,}개")
        print(f"이슈 발견 파일: {self.stats['files_with_issues']:,}개 "
              f"({self.stats['files_with_issues']/max(self.stats['total_checked'],1)*100:.2f}%)")
        print(f"총 이슈 수: {self.stats['total_issues']:,}개")

        # 이슈 있는 파일만 필터링
        problematic = [r for r in results if r['issues']]

        if problematic:
            print(f"\n문제 파일 상위 20개:")
            print("-"*80)

            for i, item in enumerate(problematic[:20], 1):
                print(f"\n{i}. Clip ID: {item['clip_id']}")
                print(f"   경로: {item['json_path']}")
                print(f"   이슈 수: {len(item['issues'])}")
                for issue in item['issues'][:5]:  # 최대 5개만
                    print(f"   - {issue}")
                if len(item['issues']) > 5:
                    print(f"   ... 외 {len(item['issues']) - 5}개")

        # 이슈 유형별 통계
        issue_types = defaultdict(int)
        for item in problematic:
            for issue in item['issues']:
                # 이슈 타입 추출 (예: [캡션], [메타])
                match = re.match(r'\[([^\]]+)\]', issue)
                if match:
                    issue_type = match.group(1)
                    issue_types[issue_type] += 1

        print("\n" + "="*80)
        print("이슈 유형별 통계")
        print("="*80)
        for issue_type, count in sorted(issue_types.items(), key=lambda x: x[1], reverse=True):
            print(f"{issue_type}: {count:,}개")

        # CSV로 저장
        df = pd.DataFrame(problematic)
        df.to_csv(output_path, index=False, encoding='utf-8')
        print(f"\n상세 리포트 저장: {output_path}")

        print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(description='데이터 품질 검증')
    parser.add_argument('--data_root', type=str, default='/home/devfit2/mbc_json',
                        help='데이터 루트 디렉토리')
    parser.add_argument('--output', type=str, default='./data_quality_report.csv',
                        help='리포트 출력 경로')
    parser.add_argument('--sample_size', type=int, default=None,
                        help='샘플 배치 수 (테스트용, 전체면 None)')

    args = parser.parse_args()

    validator = DataQualityValidator(args.data_root)
    results = validator.run_validation(sample_size=args.sample_size)
    validator.generate_report(results, args.output)


if __name__ == "__main__":
    main()
