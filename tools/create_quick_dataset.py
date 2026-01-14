#!/usr/bin/env python3
"""
24시간 테스트용 소규모 데이터셋 생성 (5,000 샘플)
"""
import pandas as pd
import sys

def create_quick_dataset(input_csv, output_csv, n_samples=5000):
    """전체 데이터에서 n_samples만 샘플링"""
    print(f"Loading {input_csv}...")
    df = pd.read_csv(input_csv)
    total = len(df)

    print(f"원본 샘플 수: {total:,}")

    # 랜덤 샘플링 (재현성을 위해 seed 고정)
    if total > n_samples:
        df_sampled = df.sample(n=n_samples, random_state=42).reset_index(drop=True)
    else:
        df_sampled = df

    df_sampled.to_csv(output_csv, index=False)
    print(f"✓ 샘플링 완료: {len(df_sampled):,} 샘플 -> {output_csv}")

    return len(df_sampled)

if __name__ == "__main__":
    # Train 데이터 (5,000 샘플)
    train_csv = "./data_quality_analysis/clean_dataset.csv"
    train_quick = "./data_quality_analysis/quick_train.csv"
    train_count = create_quick_dataset(train_csv, train_quick, n_samples=5000)

    # Val 데이터 (500 샘플)
    val_csv = "./data_quality_analysis_val/clean_dataset.csv"
    val_quick = "./data_quality_analysis_val/quick_val.csv"
    val_count = create_quick_dataset(val_csv, val_quick, n_samples=500)

    print(f"\n{'='*60}")
    print(f"24시간 테스트 데이터셋 생성 완료!")
    print(f"  Train: {train_count:,} 샘플")
    print(f"  Val: {val_count:,} 샘플")
    print(f"  Total: {train_count + val_count:,} 샘플")
    print(f"{'='*60}")

    # GPU별 분할
    print("\nGPU별 분할 중...")
    df_train = pd.read_csv(train_quick)
    df_val = pd.read_csv(val_quick)

    # Train 분할
    split_idx = len(df_train) // 2
    df_train_gpu0 = df_train.iloc[:split_idx]
    df_train_gpu1 = df_train.iloc[split_idx:]

    df_train_gpu0.to_csv("./data_quality_analysis/quick_train_gpu0.csv", index=False)
    df_train_gpu1.to_csv("./data_quality_analysis/quick_train_gpu1.csv", index=False)

    # Val 분할
    split_idx = len(df_val) // 2
    df_val_gpu0 = df_val.iloc[:split_idx]
    df_val_gpu1 = df_val.iloc[split_idx:]

    df_val_gpu0.to_csv("./data_quality_analysis_val/quick_val_gpu0.csv", index=False)
    df_val_gpu1.to_csv("./data_quality_analysis_val/quick_val_gpu1.csv", index=False)

    print(f"  GPU 0: {len(df_train_gpu0):,} train, {len(df_val_gpu0):,} val")
    print(f"  GPU 1: {len(df_train_gpu1):,} train, {len(df_val_gpu1):,} val")
    print("\n준비 완료!")
