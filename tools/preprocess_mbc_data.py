#!/usr/bin/env python3
"""
MBC 데이터셋 전처리 스크립트
- 데이터 검증
- 메타데이터 추출
- 학습용 CSV 생성
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import csv
from collections import defaultdict
from tqdm import tqdm
import argparse


class MBCDataPreprocessor:
    def __init__(self, data_root: str, output_dir: str):
        self.data_root = Path(data_root)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.image_dir = self.data_root / "image"
        self.video_dir = self.data_root / "video"

        self.stats = {
            'image': defaultdict(int),
            'video': defaultdict(int),
        }

    def extract_captions_from_json(self, json_data: Dict, media_type: str) -> Dict:
        """JSON에서 caption과 메타데이터 추출"""
        captions = []

        # labeling_data_info에서 caption 추출
        if 'labeling_data_info' in json_data and 'caption_info' in json_data['labeling_data_info']:
            caption_info = json_data['labeling_data_info']['caption_info']

            # object_level captions
            if 'object_level' in caption_info:
                for cap in caption_info['object_level']:
                    captions.append({
                        'text': cap['text'],
                        'level': 'object',
                        'tc_in': cap.get('tc_in', ''),
                        'tc_out': cap.get('tc_out', ''),
                    })

            # semantic_level captions
            if 'semantic_level' in caption_info:
                for cap in caption_info['semantic_level']:
                    captions.append({
                        'text': cap['text'],
                        'level': 'semantic',
                        'tc_in': '',
                        'tc_out': '',
                    })

            # application_level captions
            if 'application_level' in caption_info:
                for cap in caption_info['application_level']:
                    captions.append({
                        'text': cap['text'],
                        'level': 'application',
                        'tc_in': '',
                        'tc_out': '',
                    })

        # ai_generated_info에서 추가 정보 추출
        ai_info = {}
        if 'source_data_info' in json_data and 'ai_generated_info' in json_data['source_data_info']:
            ai_gen = json_data['source_data_info']['ai_generated_info']
            ai_info = {
                'keyword': ai_gen.get('keyword', ''),
                'stt_script': ai_gen.get('stt_script', ''),
                'scene_descriptions': ai_gen.get('scene_description_auto', []),
                'mid_category': ai_gen.get('mid_category', ''),
            }

        # raw_data_info에서 메타데이터
        metadata = {}
        if 'raw_data_info' in json_data and 'source_media_info' in json_data['raw_data_info']:
            source_info = json_data['raw_data_info']['source_media_info']
            metadata = {
                'resolution': source_info.get('resolution', ''),
                'frame_rate': source_info['details'].get('frame_rate', 0) if 'details' in source_info else 0,
                'length': source_info['details'].get('length', '') if 'details' in source_info else '',
            }

        return {
            'clip_id': json_data.get('source_data_info', {}).get('clip_id', ''),
            'captions': captions,
            'ai_info': ai_info,
            'metadata': metadata,
        }

    def process_image_data(self) -> List[Dict]:
        """이미지 데이터 처리"""
        print("\n이미지 데이터 처리 중...")
        results = []

        # 모든 batch 폴더 찾기
        batch_dirs = sorted([d for d in self.image_dir.iterdir() if d.is_dir()])

        for batch_dir in tqdm(batch_dirs, desc="Image batches"):
            json_files = list(batch_dir.glob("*.json"))

            for json_file in json_files:
                clip_id = json_file.stem
                image_file = json_file.with_suffix('.png')

                # 파일 존재 확인
                if not image_file.exists():
                    self.stats['image']['missing_media'] += 1
                    continue

                # JSON 읽기
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        json_data = json.load(f)
                except Exception as e:
                    self.stats['image']['invalid_json'] += 1
                    print(f"Error reading {json_file}: {e}")
                    continue

                # 데이터 추출
                extracted = self.extract_captions_from_json(json_data, 'image')

                # 모든 caption을 하나의 텍스트로 결합
                all_captions = []
                for cap in extracted['captions']:
                    all_captions.append(cap['text'])

                caption_text = ' '.join(all_captions)

                if not caption_text.strip():
                    self.stats['image']['no_caption'] += 1
                    continue

                # 해상도 파싱
                resolution = extracted['metadata'].get('resolution', '')

                results.append({
                    'clip_id': clip_id,
                    'media_type': 'image',
                    'file_path': str(image_file),
                    'caption': caption_text,
                    'resolution': resolution,
                    'length': '',  # 이미지는 length 없음
                    'category': extracted['ai_info'].get('mid_category', ''),
                    'keyword': extracted['ai_info'].get('keyword', ''),
                })

                self.stats['image']['valid'] += 1

        return results

    def process_video_data(self) -> List[Dict]:
        """비디오 데이터 처리"""
        print("\n비디오 데이터 처리 중...")
        results = []

        # 모든 batch 폴더 찾기
        batch_dirs = sorted([d for d in self.video_dir.iterdir() if d.is_dir()])

        for batch_dir in tqdm(batch_dirs, desc="Video batches"):
            json_files = list(batch_dir.glob("*.json"))

            for json_file in json_files:
                clip_id = json_file.stem
                video_file = json_file.with_suffix('.mp4')

                # 파일 존재 확인
                if not video_file.exists():
                    self.stats['video']['missing_media'] += 1
                    continue

                # JSON 읽기
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        json_data = json.load(f)
                except Exception as e:
                    self.stats['video']['invalid_json'] += 1
                    print(f"Error reading {json_file}: {e}")
                    continue

                # 데이터 추출
                extracted = self.extract_captions_from_json(json_data, 'video')

                # Caption + STT script 결합
                all_text = []

                # Scene descriptions (시간순)
                for scene in extracted['ai_info'].get('scene_descriptions', []):
                    all_text.append(scene.get('description', ''))

                # Caption 추가
                for cap in extracted['captions']:
                    all_text.append(cap['text'])

                # STT script 추가
                stt = extracted['ai_info'].get('stt_script', '')
                if stt:
                    all_text.append(stt)

                caption_text = ' '.join(all_text)

                if not caption_text.strip():
                    self.stats['video']['no_caption'] += 1
                    continue

                # 메타데이터
                resolution = extracted['metadata'].get('resolution', '')
                length = extracted['metadata'].get('length', '')

                results.append({
                    'clip_id': clip_id,
                    'media_type': 'video',
                    'file_path': str(video_file),
                    'caption': caption_text,
                    'resolution': resolution,
                    'length': length,
                    'category': extracted['ai_info'].get('mid_category', ''),
                    'keyword': extracted['ai_info'].get('keyword', ''),
                })

                self.stats['video']['valid'] += 1

        return results

    def save_to_csv(self, data: List[Dict], filename: str):
        """CSV 파일로 저장"""
        output_path = self.output_dir / filename

        if not data:
            print(f"No data to save for {filename}")
            return

        keys = data[0].keys()

        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data)

        print(f"Saved {len(data)} entries to {output_path}")

    def split_train_val(self, data: List[Dict], val_ratio: float = 0.1) -> Tuple[List[Dict], List[Dict]]:
        """Train/Val split"""
        import random
        random.seed(42)

        data_copy = data.copy()
        random.shuffle(data_copy)

        split_idx = int(len(data_copy) * (1 - val_ratio))
        train_data = data_copy[:split_idx]
        val_data = data_copy[split_idx:]

        return train_data, val_data

    def print_statistics(self):
        """통계 출력"""
        print("\n" + "="*60)
        print("데이터 전처리 통계")
        print("="*60)

        print("\n[이미지 데이터]")
        for key, value in self.stats['image'].items():
            print(f"  {key}: {value:,}")

        print("\n[비디오 데이터]")
        for key, value in self.stats['video'].items():
            print(f"  {key}: {value:,}")

        print("\n" + "="*60)

    def run(self):
        """전체 전처리 실행"""
        print("MBC 데이터셋 전처리 시작...")
        print(f"데이터 경로: {self.data_root}")
        print(f"출력 경로: {self.output_dir}")

        # 이미지 데이터 처리
        image_data = self.process_image_data()

        # 비디오 데이터 처리
        video_data = self.process_video_data()

        # 통계 출력
        self.print_statistics()

        # Train/Val split
        print("\nTrain/Val split 수행 중...")

        if image_data:
            image_train, image_val = self.split_train_val(image_data)
            self.save_to_csv(image_train, 'image_train.csv')
            self.save_to_csv(image_val, 'image_val.csv')
            self.save_to_csv(image_data, 'image_all.csv')

        if video_data:
            video_train, video_val = self.split_train_val(video_data)
            self.save_to_csv(video_train, 'video_train.csv')
            self.save_to_csv(video_val, 'video_val.csv')
            self.save_to_csv(video_data, 'video_all.csv')

        # 전체 데이터 병합
        all_data = image_data + video_data
        if all_data:
            all_train, all_val = self.split_train_val(all_data)
            self.save_to_csv(all_train, 'all_train.csv')
            self.save_to_csv(all_val, 'all_val.csv')
            self.save_to_csv(all_data, 'all_data.csv')

        print("\n전처리 완료!")


def main():
    parser = argparse.ArgumentParser(description='MBC 데이터셋 전처리')
    parser.add_argument('--data_root', type=str, default='/home/devfit2/mbc_json',
                        help='MBC 데이터 루트 디렉토리')
    parser.add_argument('--output_dir', type=str, default='./preprocessed_data',
                        help='전처리된 데이터 출력 디렉토리')

    args = parser.parse_args()

    preprocessor = MBCDataPreprocessor(args.data_root, args.output_dir)
    preprocessor.run()


if __name__ == "__main__":
    main()
