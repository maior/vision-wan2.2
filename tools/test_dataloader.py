#!/usr/bin/env python3
"""
DataLoader 테스트
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 60)
print("DataLoader 테스트")
print("=" * 60)

from lora_finetuning.dataset import MBCVideoDataset, MBCDataCollator
from torch.utils.data import DataLoader

# 데이터셋 로드
dataset = MBCVideoDataset(
    csv_path="./data_quality_analysis/quick_train_gpu0.csv",
    frame_num=81,
    resolution=(1280, 704),
    max_caption_length=512,
)

print(f"데이터셋 크기: {len(dataset)}")
print("=" * 60)

# DataLoader 생성
dataloader = DataLoader(
    dataset,
    batch_size=2,
    shuffle=False,
    num_workers=2,
    collate_fn=MBCDataCollator(),
    pin_memory=True,
)

print("첫 번째 batch 로딩 중...")
try:
    for i, batch in enumerate(dataloader):
        print(f"\n✓ Batch {i+1} 로딩 성공!")
        print(f"  Video shape: {batch['video'].shape}")
        print(f"  Captions: {len(batch['caption'])}")
        print(f"  Caption[0]: {batch['caption'][0][:100]}...")

        if i >= 2:  # 처음 3개 batch만 테스트
            break

    print("=" * 60)
    print("✅ DataLoader 테스트 성공!")
    print("=" * 60)

except Exception as e:
    print("=" * 60)
    print(f"❌ DataLoader 테스트 실패: {e}")
    import traceback
    traceback.print_exc()
    print("=" * 60)
    sys.exit(1)
