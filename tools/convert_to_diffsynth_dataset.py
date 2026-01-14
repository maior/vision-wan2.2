#!/usr/bin/env python3
"""
Convert MBC dataset to DiffSynth-Studio format
"""
import pandas as pd
import os
from pathlib import Path

def convert_dataset(input_csv, output_csv, base_path):
    """
    Convert our CSV format to DiffSynth-Studio format

    Our format: clip_id,media_type,file_path,caption,resolution,length,category,keyword
    DiffSynth format: video,prompt
    """
    print(f"Reading {input_csv}...")
    df = pd.read_csv(input_csv)

    print(f"Found {len(df)} samples")

    # Extract only file_path and caption
    diffsynth_df = pd.DataFrame()

    # Convert absolute paths to relative paths (relative to base_path)
    base_path = Path(base_path).resolve()

    relative_paths = []
    for file_path in df['file_path']:
        abs_path = Path(file_path).resolve()
        try:
            rel_path = abs_path.relative_to(base_path)
            relative_paths.append(str(rel_path))
        except ValueError:
            # If path is not relative to base_path, use absolute
            relative_paths.append(str(abs_path))

    diffsynth_df['video'] = relative_paths
    diffsynth_df['prompt'] = df['caption']

    # Save to output CSV
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    diffsynth_df.to_csv(output_csv, index=False)

    print(f"Saved {len(diffsynth_df)} samples to {output_csv}")
    print(f"\nFirst 3 samples:")
    print(diffsynth_df.head(3))

    return len(diffsynth_df)

if __name__ == "__main__":
    base_path = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data"

    # Convert training set
    train_input = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv"
    train_output = "/home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata.csv"

    train_count = convert_dataset(train_input, train_output, base_path)

    # Convert validation set
    val_input = "/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_val_720p.csv"
    val_output = "/home/maiordba/projects/vision/Wan2.2/diffsynth_data/val_metadata.csv"

    val_count = convert_dataset(val_input, val_output, base_path)

    print(f"\n=== Conversion Complete ===")
    print(f"Training samples: {train_count}")
    print(f"Validation samples: {val_count}")
    print(f"\nDataset base path: {base_path}")
    print(f"Training metadata: {train_output}")
    print(f"Validation metadata: {val_output}")
