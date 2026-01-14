#!/usr/bin/env python3
"""
데이터셋을 2개로 분할하여 각 GPU에서 독립 학습
"""
import pandas as pd
import sys

def split_dataset(input_csv, output_prefix):
    """데이터를 2개로 균등 분할"""
    print(f"Loading {input_csv}...")
    df = pd.read_csv(input_csv)
    total = len(df)

    # 셔플 (재현성을 위해 seed 고정)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # 2개로 분할
    split_idx = total // 2
    df1 = df.iloc[:split_idx]
    df2 = df.iloc[split_idx:]

    # 저장
    output1 = f"{output_prefix}_gpu0.csv"
    output2 = f"{output_prefix}_gpu1.csv"

    df1.to_csv(output1, index=False)
    df2.to_csv(output2, index=False)

    print(f"✓ {input_csv} 분할 완료:")
    print(f"  - GPU 0: {len(df1):,} 샘플 -> {output1}")
    print(f"  - GPU 1: {len(df2):,} 샘플 -> {output2}")

    return output1, output2

if __name__ == "__main__":
    # Train 데이터 분할
    train_csv = "./data_quality_analysis/clean_dataset.csv"
    train_prefix = "./data_quality_analysis/clean_dataset"
    split_dataset(train_csv, train_prefix)

    # Val 데이터 분할
    val_csv = "./data_quality_analysis_val/clean_dataset.csv"
    val_prefix = "./data_quality_analysis_val/clean_dataset"
    split_dataset(val_csv, val_prefix)

    print("\n데이터 분할 완료!")
