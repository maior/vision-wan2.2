#!/usr/bin/env python3
"""
LoRA 추론 비디오에 대한 CLIP 점수와 FVD 계산
"""

import torch
import numpy as np
from pathlib import Path
import json
import cv2
from PIL import Image
import argparse

# CLIP 모델 로드
try:
    import clip
    CLIP_AVAILABLE = True
except ImportError:
    print("Warning: CLIP not available. Install with: pip install git+https://github.com/openai/CLIP.git")
    CLIP_AVAILABLE = False


def load_video_frames(video_path, num_frames=8):
    """비디오에서 균등하게 프레임 추출"""
    cap = cv2.VideoCapture(str(video_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames == 0:
        print(f"Error: Could not read video {video_path}")
        return []

    # 균등하게 프레임 인덱스 선택
    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)

    frames = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            # BGR to RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(Image.fromarray(frame))

    cap.release()
    return frames


def calculate_clip_score(video_path, text_prompt, device='cuda', num_frames=8):
    """
    CLIP 점수 계산: 비디오 프레임과 텍스트 프롬프트 간의 유사도
    높을수록 좋음 (0~1 범위로 정규화)
    """
    if not CLIP_AVAILABLE:
        return None

    try:
        # CLIP 모델 로드
        model, preprocess = clip.load("ViT-B/32", device=device)

        # 비디오 프레임 로드
        frames = load_video_frames(video_path, num_frames)
        if not frames:
            return None

        # 프레임 전처리
        images = torch.stack([preprocess(frame) for frame in frames]).to(device)

        # 텍스트 인코딩
        text = clip.tokenize([text_prompt]).to(device)

        # 유사도 계산
        with torch.no_grad():
            image_features = model.encode_image(images)
            text_features = model.encode_text(text)

            # 정규화
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            # 코사인 유사도 계산 (각 프레임)
            similarity = (image_features @ text_features.T).squeeze()

            # 평균 점수 계산
            mean_score = similarity.mean().item()

            # 0~1 범위로 정규화 (코사인 유사도는 -1~1이지만, CLIP은 보통 0~1)
            normalized_score = (mean_score + 1) / 2

        return float(normalized_score)

    except Exception as e:
        print(f"Error calculating CLIP score for {video_path}: {e}")
        return None


def calculate_video_quality_metrics(video_path):
    """
    비디오 품질 메트릭 계산 (FVD 대안)
    - Temporal Consistency: 프레임 간 일관성
    - Sharpness: 선명도
    - Color Diversity: 색상 다양성
    """
    cap = cv2.VideoCapture(str(video_path))
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()

    if len(frames) < 2:
        return None

    # 1. Temporal Consistency (프레임 간 차이가 작을수록 일관성 높음)
    frame_diffs = []
    for i in range(len(frames) - 1):
        diff = np.mean(np.abs(frames[i].astype(float) - frames[i+1].astype(float)))
        frame_diffs.append(diff)

    temporal_consistency = 1.0 / (1.0 + np.mean(frame_diffs) / 255.0)  # 0~1, 높을수록 좋음

    # 2. Sharpness (Laplacian variance)
    sharpness_scores = []
    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness_scores.append(laplacian_var)

    mean_sharpness = np.mean(sharpness_scores)
    # 정규화 (일반적인 범위: 0-1000, 높을수록 선명함)
    normalized_sharpness = min(mean_sharpness / 500.0, 1.0)

    # 3. Color Diversity (색상 히스토그램의 엔트로피)
    color_diversities = []
    for frame in frames:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
        hist = hist / hist.sum()
        # 엔트로피 계산
        hist = hist[hist > 0]
        entropy = -np.sum(hist * np.log2(hist))
        color_diversities.append(entropy)

    mean_color_diversity = np.mean(color_diversities)
    # 정규화 (최대 엔트로피: log2(180) ≈ 7.49)
    normalized_color_diversity = mean_color_diversity / 7.49

    # 종합 품질 점수 (가중 평균)
    quality_score = (
        0.4 * temporal_consistency +
        0.3 * normalized_sharpness +
        0.3 * normalized_color_diversity
    )

    return {
        'temporal_consistency': float(temporal_consistency),
        'sharpness': float(normalized_sharpness),
        'color_diversity': float(normalized_color_diversity),
        'overall_quality': float(quality_score)
    }


def calculate_fvd_approximation(video_path):
    """
    FVD 근사치 계산
    실제 FVD는 대규모 데이터셋과 I3D 모델이 필요하므로,
    여기서는 비디오 품질 메트릭의 조합으로 근사

    FVD는 낮을수록 좋은 점수이므로, 품질 점수를 반전
    일반적인 FVD 범위: 0-1000
    """
    quality_metrics = calculate_video_quality_metrics(video_path)
    if quality_metrics is None:
        return None

    # 품질 점수를 FVD 스타일로 변환 (낮을수록 좋음)
    # 높은 품질(1.0) = 낮은 FVD(0)
    # 낮은 품질(0.0) = 높은 FVD(1000)
    fvd_score = (1.0 - quality_metrics['overall_quality']) * 1000

    return {
        'fvd_score': float(fvd_score),
        'quality_metrics': quality_metrics
    }


def process_all_videos(results_dir, output_file='metrics_results.json'):
    """모든 비디오에 대해 메트릭 계산"""
    results_dir = Path(results_dir)

    # 비디오 정보 (프롬프트 포함)
    video_info = {
        "test1_korean_city_lora.mp4": {
            "prompt": "밤의 서울 도심, 네온 불빛이 빛나는 거리를 걷는 사람들",
            "description": "Seoul cityscape at night"
        },
        "test2_nature_lora.mp4": {
            "prompt": "아름다운 벚꽃이 만개한 봄날의 공원, 바람에 날리는 꽃잎",
            "description": "Cherry blossoms in spring park"
        },
        "test3_action_lora.mp4": {
            "prompt": "축구 경기장에서 골을 넣는 선수, 환호하는 관중",
            "description": "Soccer game goal celebration"
        }
    }

    results = {}
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")

    for video_file in sorted(results_dir.glob("*.mp4")):
        print(f"\nProcessing: {video_file.name}")

        info = video_info.get(video_file.name, {"prompt": "Unknown", "description": "Unknown"})

        # CLIP 점수 계산
        print("  Calculating CLIP score...")
        clip_score = calculate_clip_score(video_file, info["prompt"], device=device)

        # FVD 근사치 계산
        print("  Calculating FVD approximation...")
        fvd_result = calculate_fvd_approximation(video_file)

        results[video_file.name] = {
            "filename": video_file.name,
            "prompt": info["prompt"],
            "description": info["description"],
            "clip_score": clip_score,
            "fvd": fvd_result['fvd_score'] if fvd_result else None,
            "quality_metrics": fvd_result['quality_metrics'] if fvd_result else None
        }

        print(f"  CLIP Score: {clip_score:.4f}" if clip_score else "  CLIP Score: N/A")
        if fvd_result:
            print(f"  FVD Score: {fvd_result['fvd_score']:.2f}")
            print(f"  Overall Quality: {fvd_result['quality_metrics']['overall_quality']:.4f}")

    # 결과 저장
    output_path = results_dir / output_file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Results saved to: {output_path}")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Calculate CLIP and FVD metrics for LoRA inference videos')
    parser.add_argument('--results_dir', type=str,
                        default='/home/maiordba/projects/vision/Wan2.2/lora_inference_results',
                        help='Directory containing inference result videos')
    parser.add_argument('--output', type=str, default='metrics_results.json',
                        help='Output JSON file name')

    args = parser.parse_args()

    print("="*60)
    print("LoRA Inference Video Metrics Calculator")
    print("="*60)

    if not CLIP_AVAILABLE:
        print("\n⚠️  CLIP library not available. Installing...")
        print("Run: pip install git+https://github.com/openai/CLIP.git")

    process_all_videos(args.results_dir, args.output)
