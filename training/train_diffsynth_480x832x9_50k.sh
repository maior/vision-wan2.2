#!/bin/bash
# DiffSynth-Studio LoRA Training - 50K samples, 3 epochs
# 480x832x9, Single GPU (for stability)
# Estimated time: 9-10 days

cd /home/maiordba/projects/vision/diffsynth-studio

# Activate virtual environment
source /home/maiordba/projects/vision/Wan2.2/.venv/bin/activate

# Save training configuration for monitor
cat > /home/maiordba/projects/vision/Wan2.2/training/training_config.json << 'EOF'
{
  "total_samples": 50000,
  "num_gpus": 1,
  "num_epochs": 3,
  "steps_per_epoch": 50000,
  "batch_size": 1,
  "description": "50K samples, 3 epochs, Single GPU (480x832x9)"
}
EOF

# Clear previous training logs to prevent data accumulation
echo "Clearing previous training logs..."
rm -f /home/maiordba/projects/vision/Wan2.2/training_logs/training_gpu*.json
mkdir -p /home/maiordba/projects/vision/Wan2.2/training_logs

echo "============================================================"
echo "LoRA Training: 50K samples, 3 epochs"
echo "============================================================"
echo "Output directory: diffsynth_lora_output_480x832x9_50k"
echo "Estimated time: 9-10 days (single GPU)"
echo "Start time: $(date)"
echo "============================================================"

# Training parameters - 3 epochs with 50K samples (Single GPU)
accelerate launch --config_file /home/maiordba/projects/vision/Wan2.2/accelerate_config_single.yaml \
  examples/wanvideo/model_training/train.py \
  --dataset_base_path /home/maiordba/projects/vision/Wan2.2/preprocessed_data \
  --dataset_metadata_path /home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata_50k.csv \
  --height 480 \
  --width 832 \
  --num_frames 9 \
  --dataset_repeat 1 \
  --model_id_with_origin_paths "Wan-AI/Wan2.2-TI2V-5B:diffusion_pytorch_model*.safetensors,Wan-AI/Wan2.2-TI2V-5B:models_t5_umt5-xxl-enc-bf16.pth,Wan-AI/Wan2.2-TI2V-5B:Wan2.2_VAE.pth" \
  --learning_rate 1e-4 \
  --num_epochs 3 \
  --remove_prefix_in_ckpt "pipe.dit." \
  --output_path "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_480x832x9_50k" \
  --lora_base_model "dit" \
  --lora_target_modules "q,k,v,o,ffn.0,ffn.2" \
  --lora_rank 32 \
  --extra_inputs "input_image"

echo "============================================================"
echo "Training completed!"
echo "End time: $(date)"
echo "Checkpoints saved in: diffsynth_lora_output_480x832x9_50k/"
echo "- epoch-0.safetensors"
echo "- epoch-1.safetensors"
echo "- epoch-2.safetensors"
echo "============================================================"
