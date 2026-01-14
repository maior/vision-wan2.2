#!/usr/bin/env python3
"""
간단한 forward pass 테스트
"""
import os
import sys
import torch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 60)
print("Forward Pass 테스트")
print("=" * 60)

# 가상환경 확인
print(f"Python: {sys.executable}")
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'}")
print("=" * 60)

# WanTI2V 로드
print("모델 로드 중...")
from wan.configs import WAN_CONFIGS
from wan import WanTI2V

wan_config = WAN_CONFIGS['ti2v-5B']
model = WanTI2V(
    config=wan_config,
    checkpoint_dir="./Wan2.2-TI2V-5B",
    device_id=0,
    rank=0,
    t5_fsdp=False,
    dit_fsdp=False,
    use_sp=False,
    t5_cpu=True,
    init_on_cpu=False,
    convert_model_dtype=True
)

print("✓ 모델 로드 완료")
print("=" * 60)

# 테스트 데이터
print("테스트 데이터 생성...")
B = 1
C, T, H, W = 3, 17, 704, 1280

# 더미 비디오 (실제 크기)
video = torch.randn(B, C, T, H, W, dtype=torch.float32).cuda()
caption = ["A test video"]

print(f"Video shape: {video.shape}")
print(f"Caption: {caption}")
print("=" * 60)

# Forward pass 테스트
print("Forward pass 시작...")
try:
    # 1. VAE encoding
    print("1. VAE encoding...")
    with torch.no_grad():
        video_list = [video[i] for i in range(B)]
        latents_list = model.vae.encode(video_list)
        latents = torch.stack([l.cuda() for l in latents_list])
    print(f"   ✓ Latents shape: {latents.shape}")

    # 2. Text encoding
    print("2. Text encoding...")
    with torch.no_grad():
        text_embeddings = model.text_encoder(caption, device='cpu')
        text_embeddings = [emb.cuda() for emb in text_embeddings]
    print(f"   ✓ Text embeddings: {len(text_embeddings)} tensors")

    # 3. Noise & timesteps
    print("3. Noise & timesteps...")
    timesteps = torch.randint(0, 1000, (B,), device='cuda', dtype=torch.long)
    noise = torch.randn_like(latents)
    print(f"   ✓ Timesteps: {timesteps}")
    print(f"   ✓ Noise shape: {noise.shape}")

    # 4. DiT forward
    print("4. DiT forward...")
    noisy_latents_list = [latents[i] for i in range(B)]
    _, _, F, H_lat, W_lat = latents.shape
    seq_len = F * H_lat * W_lat

    with torch.no_grad():
        model_output = model.model(
            x=noisy_latents_list,
            t=timesteps,
            context=text_embeddings,
            seq_len=seq_len,
            y=None
        )
    print(f"   ✓ Model output: {type(model_output)}")

    # 5. Loss
    print("5. Loss 계산...")
    if isinstance(model_output, list):
        model_output = torch.stack(model_output)
    loss = torch.nn.functional.mse_loss(model_output, noise)
    print(f"   ✓ Loss: {loss.item():.4f}")

    print("=" * 60)
    print("✅ Forward pass 성공!")
    print("=" * 60)

except Exception as e:
    print("=" * 60)
    print(f"❌ Forward pass 실패: {e}")
    import traceback
    traceback.print_exc()
    print("=" * 60)
    sys.exit(1)
