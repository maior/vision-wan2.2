#!/usr/bin/env python3
"""
LoRA Epoch-2 추론 스크립트
480x832x9 해상도, epoch-2.safetensors 사용
"""

import torch
import os
import sys

# DiffSynth-Studio 경로 추가
sys.path.insert(0, '/home/maiordba/projects/vision/diffsynth-studio')

from diffsynth import save_video
from diffsynth.pipelines.wan_video_new import WanVideoPipeline, ModelConfig

# 출력 디렉토리 생성
output_dir = "/home/maiordba/projects/vision/Wan2.2/lora_inference_results_epoch2"
os.makedirs(output_dir, exist_ok=True)

print("=" * 80)
print("LoRA Epoch-2 Model Inference Test")
print("=" * 80)

# LoRA epoch-2 모델 경로
lora_path = "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_480x832x9_1k_3epochs/epoch-2.safetensors"
print(f"\nLoRA Model Path: {lora_path}")
print(f"Output Directory: {output_dir}\n")

# 파이프라인 초기화 (TI2V-5B 베이스 모델 사용)
print("Loading base model (Wan2.2-TI2V-5B)...")
pipe = WanVideoPipeline.from_pretrained(
    torch_dtype=torch.bfloat16,
    device="cuda",
    model_configs=[
        ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="models_t5_umt5-xxl-enc-bf16.pth", offload_device="cpu"),
        ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="diffusion_pytorch_model*.safetensors", offload_device="cpu"),
        ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="Wan2.2_VAE.pth", offload_device="cpu"),
    ],
)

# LoRA 로드 (올바른 방법)
print(f"\nLoading LoRA epoch-2 weights...")
try:
    pipe.load_lora(pipe.dit, lora_path, alpha=1.0)
    print("✅ LoRA epoch-2 weights loaded and applied successfully!")
except Exception as e:
    print(f"❌ Failed to load LoRA: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

pipe.enable_vram_management()
print("Base model loaded successfully!")

# 테스트 프롬프트들 (동일한 seed로 비교)
test_prompts = [
    {
        "name": "test1_korean_city",
        "prompt": "밤의 서울 도심, 네온 불빛이 빛나는 거리를 걷는 사람들",
        "negative_prompt": "흐릿한, 저품질, 왜곡된, 정적인",
        "seed": 42
    },
    {
        "name": "test2_nature",
        "prompt": "아름다운 벚꽃이 만개한 봄날의 공원, 바람에 날리는 꽃잎",
        "negative_prompt": "흐릿한, 저품질, 왜곡된, 정적인, 겨울",
        "seed": 123
    },
    {
        "name": "test3_action",
        "prompt": "축구 경기장에서 골을 넣는 선수, 환호하는 관중",
        "negative_prompt": "흐릿한, 저품질, 왜곡된, 정적인, 빈 경기장",
        "seed": 456
    }
]

# 각 프롬프트로 비디오 생성
for i, test in enumerate(test_prompts, 1):
    print(f"\n{'=' * 80}")
    print(f"Test {i}/{len(test_prompts)}: {test['name']}")
    print(f"Prompt: {test['prompt']}")
    print(f"{'=' * 80}")

    try:
        # 비디오 생성 (480x832x9 설정)
        video = pipe(
            prompt=test['prompt'],
            negative_prompt=test['negative_prompt'],
            seed=test['seed'],
            tiled=True,
            height=480,  # 학습한 해상도
            width=832,   # 학습한 해상도
            num_frames=9,  # 학습한 프레임 수
        )

        # 비디오 저장
        output_path = os.path.join(output_dir, f"{test['name']}_epoch2.mp4")
        save_video(video, output_path, fps=8, quality=5)  # 9 frames -> 8fps
        print(f"✓ Video saved: {output_path}")

    except Exception as e:
        print(f"✗ Error generating video: {e}")
        import traceback
        traceback.print_exc()

print(f"\n{'=' * 80}")
print("Inference test completed!")
print(f"Results saved in: {output_dir}")
print("=" * 80)
