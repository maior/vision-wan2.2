#!/bin/bash
# DiffSynth-Studio LoRA Training - 704x1280x9, 1K samples, Single GPU
# RAPA resolution with reduced frames for V100 32GB

cd /home/maiordba/projects/vision/diffsynth-studio

# Activate virtual environment
source /home/maiordba/projects/vision/Wan2.2/.venv/bin/activate

# Save training configuration for monitor
cat > /home/maiordba/projects/vision/Wan2.2/training_config.json << 'EOF'
{
  "total_samples": 1000,
  "num_gpus": 1,
  "num_epochs": 1,
  "steps_per_epoch": 1000,
  "batch_size": 1,
  "description": "RAPA Resolution: 704x1280x9, 1K samples, Single GPU"
}
EOF

# Clear previous training logs to prevent data accumulation
echo "Clearing previous training logs..."
rm -f /home/maiordba/projects/vision/Wan2.2/training_logs/training_gpu*.json
mkdir -p /home/maiordba/projects/vision/Wan2.2/training_logs

# Training parameters - 704x1280x9 (single GPU)
accelerate launch --config_file /home/maiordba/projects/vision/Wan2.2/accelerate_config_single.yaml \
  examples/wanvideo/model_training/train.py \
  --dataset_base_path /home/maiordba/projects/vision/Wan2.2/preprocessed_data \
  --dataset_metadata_path /home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata_1k.csv \
  --height 704 \
  --width 1280 \
  --num_frames 9 \
  --dataset_repeat 1 \
  --model_id_with_origin_paths "Wan-AI/Wan2.2-TI2V-5B:diffusion_pytorch_model*.safetensors,Wan-AI/Wan2.2-TI2V-5B:models_t5_umt5-xxl-enc-bf16.pth,Wan-AI/Wan2.2-TI2V-5B:Wan2.2_VAE.pth" \
  --learning_rate 1e-4 \
  --num_epochs 1 \
  --remove_prefix_in_ckpt "pipe.dit." \
  --output_path "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_704x1280x9_1k_single" \
  --lora_base_model "dit" \
  --lora_target_modules "q,k,v,o,ffn.0,ffn.2" \
  --lora_rank 32 \
  --extra_inputs "input_image"
