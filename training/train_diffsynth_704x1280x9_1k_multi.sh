#!/bin/bash
# DiffSynth-Studio LoRA Training - 704x1280x9, 1K samples, MULTI GPU (2x V100)
# Reduced frames for PCIe compatibility (no NVLink)

cd /home/maiordba/projects/vision/diffsynth-studio

# Activate virtual environment
source /home/maiordba/projects/vision/Wan2.2/.venv/bin/activate

# Save training configuration for monitor
cat > /home/maiordba/projects/vision/Wan2.2/training/training_config.json << 'EOF'
{
  "total_samples": 1000,
  "num_gpus": 2,
  "num_epochs": 1,
  "steps_per_epoch": 500,
  "batch_size": 1,
  "description": "RAPA Resolution: 704x1280x9, 1K samples, Multi GPU (PCIe)"
}
EOF

# Clear previous training logs to prevent data accumulation
echo "Clearing previous training logs..."
rm -f /home/maiordba/projects/vision/Wan2.2/training_logs/training_gpu*.json
mkdir -p /home/maiordba/projects/vision/Wan2.2/training_logs

# Increase NCCL timeout for PCIe communication
export NCCL_TIMEOUT=1800
export NCCL_IB_DISABLE=1
export NCCL_P2P_DISABLE=0

# Training parameters - 704x1280x9 (reduced frames)
accelerate launch --config_file /home/maiordba/projects/vision/Wan2.2/accelerate_config.yaml \
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
  --output_path "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_704x1280x9_1k" \
  --lora_base_model "dit" \
  --lora_target_modules "q,k,v,o,ffn.0,ffn.2" \
  --lora_rank 32 \
  --extra_inputs "input_image"
