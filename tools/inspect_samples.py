#!/usr/bin/env python3
"""
샘플 수동 검사 도구
랜덤 샘플을 선택해서 비디오/이미지와 캡션을 함께 확인
"""

import json
import random
import argparse
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def wrap_text(text, max_width, font=None):
    """텍스트를 최대 너비에 맞게 줄바꿈"""
    lines = []
    words = text.split()
    current_line = []
    current_width = 0

    for word in words:
        word_width = len(word)
        if current_width + word_width <= max_width:
            current_line.append(word)
            current_width += word_width + 1
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            current_width = word_width

    if current_line:
        lines.append(' '.join(current_line))

    return '\n'.join(lines)


def create_caption_image(caption_data: dict, width=1280, height=400):
    """Caption을 이미지로 렌더링"""
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)

    # 폰트 (기본 폰트 사용)
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()

    y_offset = 10

    # Object level
    if 'object_level' in caption_data and caption_data['object_level']:
        draw.text((10, y_offset), "Object Level:", fill='blue', font=font_title)
        y_offset += 30
        for cap in caption_data['object_level']:
            text = wrap_text(cap['text'], 100)
            draw.text((10, y_offset), text, fill='black', font=font_text)
            y_offset += 20 * (text.count('\n') + 1)

    # Semantic level
    if 'semantic_level' in caption_data and caption_data['semantic_level']:
        y_offset += 10
        draw.text((10, y_offset), "Semantic Level:", fill='green', font=font_title)
        y_offset += 30
        for cap in caption_data['semantic_level']:
            text = wrap_text(cap['text'], 100)
            draw.text((10, y_offset), text, fill='black', font=font_text)
            y_offset += 20 * (text.count('\n') + 1)

    # Application level
    if 'application_level' in caption_data and caption_data['application_level']:
        y_offset += 10
        draw.text((10, y_offset), "Application Level:", fill='red', font=font_title)
        y_offset += 30
        for cap in caption_data['application_level']:
            text = wrap_text(cap['text'], 100)
            draw.text((10, y_offset), text, fill='black', font=font_text)
            y_offset += 20 * (text.count('\n') + 1)

    return np.array(img)


def display_video_sample(video_path: Path, json_path: Path, output_path: Path):
    """비디오 샘플과 캡션을 함께 보여주기"""
    # JSON 로드
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    # Caption 추출
    caption_info = json_data.get('labeling_data_info', {}).get('caption_info', {})
    stt_script = json_data.get('source_data_info', {}).get('ai_generated_info', {}).get('stt_script', '')

    # 비디오 로드
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"비디오 열기 실패: {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0

    # 프레임 샘플링 (6개)
    sample_indices = np.linspace(0, frame_count - 1, 6, dtype=int)
    frames = []

    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            # 리사이즈 (작게)
            frame = cv2.resize(frame, (320, 180))
            frames.append(frame)

    cap.release()

    if not frames:
        print(f"프레임 추출 실패: {video_path}")
        return

    # 프레임 그리드 생성 (2x3)
    row1 = np.hstack(frames[:3])
    row2 = np.hstack(frames[3:6])
    frame_grid = np.vstack([row1, row2])

    # Caption 이미지 생성
    caption_img = create_caption_image(caption_info, width=960, height=400)

    # 메타데이터 이미지
    meta_img = np.ones((200, 960, 3), dtype=np.uint8) * 255
    meta_text = [
        f"Clip ID: {json_data.get('source_data_info', {}).get('clip_id', 'N/A')}",
        f"Duration: {duration:.2f}s",
        f"Resolution: {json_data.get('raw_data_info', {}).get('source_media_info', {}).get('resolution', 'N/A')}",
        f"Category: {json_data.get('source_data_info', {}).get('ai_generated_info', {}).get('mid_category', 'N/A')}",
        f"",
        f"STT: {stt_script[:100]}..." if stt_script else "STT: (없음)",
    ]

    y_pos = 30
    for line in meta_text:
        cv2.putText(meta_img, line, (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        y_pos += 30

    # 전체 이미지 결합
    final_img = np.vstack([frame_grid, caption_img, meta_img])

    # 저장
    cv2.imwrite(str(output_path), final_img)
    print(f"저장: {output_path}")


def display_image_sample(image_path: Path, json_path: Path, output_path: Path):
    """이미지 샘플과 캡션을 함께 보여주기"""
    # JSON 로드
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    # Caption 추출
    caption_info = json_data.get('labeling_data_info', {}).get('caption_info', {})

    # 이미지 로드
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"이미지 열기 실패: {image_path}")
        return

    # 리사이즈
    img = cv2.resize(img, (960, 540))

    # Caption 이미지 생성
    caption_img = create_caption_image(caption_info, width=960, height=400)

    # 메타데이터 이미지
    meta_img = np.ones((150, 960, 3), dtype=np.uint8) * 255
    meta_text = [
        f"Clip ID: {json_data.get('source_data_info', {}).get('clip_id', 'N/A')}",
        f"Resolution: {json_data.get('raw_data_info', {}).get('source_media_info', {}).get('resolution', 'N/A')}",
        f"Category: {json_data.get('source_data_info', {}).get('ai_generated_info', {}).get('mid_category', 'N/A')}",
    ]

    y_pos = 30
    for line in meta_text:
        cv2.putText(meta_img, line, (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        y_pos += 35

    # 전체 이미지 결합
    final_img = np.vstack([img, caption_img, meta_img])

    # 저장
    cv2.imwrite(str(output_path), final_img)
    print(f"저장: {output_path}")


def sample_and_inspect(data_root: str, num_samples: int, output_dir: str, media_type: str = 'all'):
    """랜덤 샘플 선택 및 검사"""
    data_root = Path(data_root)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 모든 JSON 파일 수집
    all_files = []

    if media_type in ['all', 'image']:
        image_dir = data_root / 'image'
        if image_dir.exists():
            for batch_dir in image_dir.iterdir():
                if batch_dir.is_dir():
                    json_files = list(batch_dir.glob("*.json"))
                    for json_file in json_files:
                        image_file = json_file.with_suffix('.png')
                        if image_file.exists():
                            all_files.append(('image', json_file, image_file))

    if media_type in ['all', 'video']:
        video_dir = data_root / 'video'
        if video_dir.exists():
            for batch_dir in video_dir.iterdir():
                if batch_dir.is_dir():
                    json_files = list(batch_dir.glob("*.json"))
                    for json_file in json_files:
                        video_file = json_file.with_suffix('.mp4')
                        if video_file.exists():
                            all_files.append(('video', json_file, video_file))

    print(f"총 {len(all_files):,}개 파일 발견")

    # 랜덤 샘플링
    if len(all_files) > num_samples:
        samples = random.sample(all_files, num_samples)
    else:
        samples = all_files

    print(f"{len(samples)}개 샘플 검사 중...")

    # 샘플 처리
    for i, (mtype, json_path, media_path) in enumerate(samples, 1):
        print(f"\n[{i}/{len(samples)}] 처리 중: {json_path.stem}")

        output_path = output_dir / f"sample_{i:03d}_{mtype}_{json_path.stem}.jpg"

        try:
            if mtype == 'image':
                display_image_sample(media_path, json_path, output_path)
            else:  # video
                display_video_sample(media_path, json_path, output_path)
        except Exception as e:
            print(f"  오류: {e}")

    print(f"\n완료! 결과 디렉토리: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description='샘플 수동 검사')
    parser.add_argument('--data_root', type=str, default='/home/devfit2/mbc_json',
                        help='데이터 루트 디렉토리')
    parser.add_argument('--num_samples', type=int, default=20,
                        help='샘플 개수')
    parser.add_argument('--output_dir', type=str, default='./sample_inspection',
                        help='출력 디렉토리')
    parser.add_argument('--media_type', type=str, default='all', choices=['all', 'image', 'video'],
                        help='미디어 타입')

    args = parser.parse_args()

    sample_and_inspect(
        args.data_root,
        args.num_samples,
        args.output_dir,
        args.media_type
    )


if __name__ == "__main__":
    main()
