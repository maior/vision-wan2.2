#!/usr/bin/env python3
"""
Wan2.2-T2V-A14B 모델 다운로드
"""

from huggingface_hub import snapshot_download
import os

model_id = "Wan-AI/Wan2.2-T2V-A14B"
local_dir = "/home/maiordba/projects/vision/Wan2.2/Wan2.2-T2V-A14B"

print("=" * 60)
print("Wan2.2-T2V-A14B 모델 다운로드")
print("=" * 60)
print(f"모델 ID: {model_id}")
print(f"저장 경로: {local_dir}")
print("=" * 60)
print("\n다운로드 시작...")
print("(약 14GB, 시간이 걸릴 수 있습니다)\n")

try:
    snapshot_download(
        repo_id=model_id,
        local_dir=local_dir,
        local_dir_use_symlinks=False,
        resume_download=True
    )

    print("\n" + "=" * 60)
    print("다운로드 완료!")
    print("=" * 60)
    print(f"모델 위치: {local_dir}")

except Exception as e:
    print(f"\n[ERROR] 다운로드 실패: {e}")
    print("\n수동 다운로드 방법:")
    print("  git lfs install")
    print(f"  git clone https://huggingface.co/{model_id} {local_dir}")
