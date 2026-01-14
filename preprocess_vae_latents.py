#!/usr/bin/env python3
"""
VAE 전처리 스크립트: 모든 비디오를 VAE로 인코딩하여 latent 저장
"""
import os
import sys
import csv
import torch
import argparse
from pathlib import Path
from tqdm import tqdm
import logging

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from wan import WanTI2V
from wan.configs import WAN_CONFIGS
from lora_finetuning.dataset import MBCVideoDataset

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="VAE 전처리 - 비디오/이미지를 latent로 인코딩")
    parser.add_argument("--input_csv", type=str, required=True, help="입력 CSV 파일")
    parser.add_argument("--output_csv", type=str, required=True, help="출력 CSV 파일 (latent 경로 포함)")
    parser.add_argument("--latent_dir", type=str, default="./preprocessed_latents", help="Latent 저장 디렉토리")
    parser.add_argument("--ckpt_dir", type=str, default="./Wan2.2-TI2V-5B", help="모델 체크포인트 디렉토리")
    parser.add_argument("--device", type=int, default=0, help="GPU device ID")
    parser.add_argument("--frame_num", type=int, default=17, help="비디오 프레임 수")
    parser.add_argument("--resolution", type=int, nargs=2, default=[1280, 704], help="해상도 (width height)")
    return parser.parse_args()


def load_vae_model(ckpt_dir, device_id):
    """VAE 모델 로드"""
    logger.info(f"VAE 모델 로딩: {ckpt_dir}")

    wan_config = WAN_CONFIGS['ti2v-5B']
    model = WanTI2V(
        config=wan_config,
        checkpoint_dir=ckpt_dir,
        device_id=device_id,
        rank=device_id,
        t5_fsdp=False,
        dit_fsdp=False,
        use_sp=False,
        t5_cpu=True,
        init_on_cpu=False,
        convert_model_dtype=True
    )

    logger.info("✓ VAE 모델 로드 완료")
    return model


def encode_media_to_latent(dataset, model, media_path, data_type, device):
    """비디오 또는 이미지를 VAE로 인코딩"""
    try:
        # 비디오/이미지 로드 (dataset의 load 메서드 사용)
        if data_type == 'video':
            video_tensor = dataset.load_video(media_path)
        else:  # image
            video_tensor = dataset.load_image(media_path)

        # VAE 인코딩 (no gradients)
        with torch.no_grad():
            video_tensor = video_tensor.to(device)
            latent = model.vae.encode([video_tensor])[0]  # Returns list, take first
            latent = latent.cpu()  # Move back to CPU for storage

        return latent

    except Exception as e:
        logger.error(f"{data_type} 인코딩 실패 ({media_path}): {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    args = parse_args()

    # 출력 디렉토리 생성
    latent_dir = Path(args.latent_dir)
    latent_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device(f"cuda:{args.device}")
    resolution = tuple(args.resolution)

    logger.info("="*60)
    logger.info("VAE 전처리 시작")
    logger.info("="*60)
    logger.info(f"입력 CSV: {args.input_csv}")
    logger.info(f"출력 CSV: {args.output_csv}")
    logger.info(f"Latent 디렉토리: {args.latent_dir}")
    logger.info(f"Frame 수: {args.frame_num}")
    logger.info(f"해상도: {resolution}")
    logger.info("="*60)

    # VAE 모델 로드
    model = load_vae_model(args.ckpt_dir, args.device)

    # Dataset 초기화 (비디오/이미지 로드 함수 사용을 위해)
    dummy_dataset = MBCVideoDataset(
        csv_path=args.input_csv,
        frame_num=args.frame_num,
        resolution=resolution,
        max_caption_length=512
    )

    # CSV 읽기
    logger.info(f"CSV 로딩: {args.input_csv}")
    with open(args.input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    logger.info(f"총 {len(rows)}개 샘플")

    # 전처리
    output_rows = []
    success_count = 0
    fail_count = 0

    for idx, row in enumerate(tqdm(rows, desc="VAE Encoding")):
        media_path = row['file_path']  # CSV의 'file_path' 컬럼
        caption = row['caption']
        data_type = row['media_type']  # CSV의 'media_type' 컬럼

        # Latent 파일명 생성
        media_name = Path(media_path).stem
        latent_filename = f"{media_name}_{args.frame_num}f.pt"
        latent_path = latent_dir / latent_filename

        # 이미 존재하면 건너뛰기
        if latent_path.exists():
            logger.info(f"[{idx+1}/{len(rows)}] 이미 존재 (건너뛰기): {latent_filename}")
            output_rows.append({
                'latent_path': str(latent_path),
                'caption': caption,
                'data_type': data_type
            })
            success_count += 1
            continue

        # VAE 인코딩
        latent = encode_media_to_latent(dummy_dataset, model, media_path, data_type, device)

        if latent is not None:
            # Latent 저장
            torch.save(latent, latent_path)
            output_rows.append({
                'latent_path': str(latent_path),
                'caption': caption,
                'data_type': data_type
            })
            success_count += 1
            logger.info(f"[{idx+1}/{len(rows)}] ✓ 인코딩 완료: {latent_filename} (shape: {latent.shape})")
        else:
            fail_count += 1
            logger.warning(f"[{idx+1}/{len(rows)}] ✗ 인코딩 실패: {media_path}")

    # 출력 CSV 저장
    logger.info(f"출력 CSV 저장: {args.output_csv}")
    with open(args.output_csv, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['latent_path', 'caption', 'data_type']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    logger.info("="*60)
    logger.info("VAE 전처리 완료")
    logger.info("="*60)
    logger.info(f"성공: {success_count}개")
    logger.info(f"실패: {fail_count}개")
    logger.info(f"출력 CSV: {args.output_csv}")
    logger.info("="*60)


if __name__ == "__main__":
    main()
