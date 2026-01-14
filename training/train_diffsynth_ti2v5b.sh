#!/bin/bash
# DiffSynth-Studio LoRA Training for Wan2.2 TI2V-5B
# Adapted for MBC dataset (170K samples, 1280x720 resolution)

cd /home/maiordba/projects/vision/diffsynth-studio

# Activate virtual environment
source /home/maiordba/projects/vision/Wan2.2/.venv/bin/activate

# NCCL 설정 - 타임아웃 30분, PCIe 통신 최적화
export NCCL_TIMEOUT=1800
export NCCL_BLOCKING_WAIT=1
export NCCL_ASYNC_ERROR_HANDLING=1
export NCCL_IB_DISABLE=1
export NCCL_P2P_DISABLE=0
export NCCL_DEBUG=INFO

# Training parameters adapted for our dataset
accelerate launch --config_file /home/maiordba/projects/vision/Wan2.2/accelerate_config.yaml \
  examples/wanvideo/model_training/train.py \
  --dataset_base_path /home/maiordba/projects/vision/Wan2.2/preprocessed_data \
  --dataset_metadata_path /home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata.csv \
  --height 704 \
  --width 1280 \
  --num_frames 17 \
  --dataset_repeat 1 \
  --model_id_with_origin_paths "Wan-AI/Wan2.2-TI2V-5B:diffusion_pytorch_model*.safetensors,Wan-AI/Wan2.2-TI2V-5B:models_t5_umt5-xxl-enc-bf16.pth,Wan-AI/Wan2.2-TI2V-5B:Wan2.2_VAE.pth" \
  --learning_rate 1e-4 \
  --num_epochs 5 \
  --remove_prefix_in_ckpt "pipe.dit." \
  --output_path "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output" \
  --lora_base_model "dit" \
  --lora_target_modules "q,k,v,o,ffn.0,ffn.2" \
  --lora_rank 32 \
  --extra_inputs "input_image"
