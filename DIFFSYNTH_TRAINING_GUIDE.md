# DiffSynth-Studio Training Guide for Wan2.2 TI2V-5B

## Overview

This guide documents the training setup using DiffSynth-Studio (official Wan2.2 fine-tuning framework) for LoRA fine-tuning on the MBC dataset.

## Multi-GPU Training Architecture

### Data Distributed Parallel (DDP) Configuration

**Current Setup:**
- Framework: PyTorch DDP via Accelerate
- GPUs: 2x Tesla V100S-PCIE-32GB (32GB each)
- Strategy: Data parallelism (not model parallelism)
- Communication: NCCL over PCIe (no NVLINK)

### How DDP Works

```
┌─────────────────────────────────────────────────────────┐
│              5,000 Training Samples                     │
└────────────────┬────────────────────────────────────────┘
                 │ Split by Accelerate
        ┌────────┴────────┐
        ↓                 ↓
┌───────────────┐   ┌───────────────┐
│   GPU 0       │   │   GPU 1       │
│  (Rank 0)     │   │  (Rank 1)     │
├───────────────┤   ├───────────────┤
│ Samples       │   │ Samples       │
│ 1-2,500       │   │ 2,501-5,000   │
│               │   │               │
│ Model Copy    │   │ Model Copy    │
│ (5B params)   │   │ (5B params)   │
│               │   │               │
│ Forward →     │   │ Forward →     │
│ Loss          │   │ Loss          │
│ Backward →    │   │ Backward →    │
│ Gradients     │   │ Gradients     │
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────── NCCL ──────┘
          AllReduce (average gradients)
                 │
        ┌────────┴────────┐
        ↓                 ↓
  Update Model 0    Update Model 1
  (identical)       (identical)
```

### Key Characteristics

**Data Distribution:**
- Total samples: N
- Samples per GPU: N ÷ num_GPUs
- Example: 5,000 samples ÷ 2 GPUs = 2,500 samples/GPU

**Model Replication:**
- Each GPU has a full copy of the model (5B parameters)
- Memory usage: ~22GB per GPU
- Both copies are kept synchronized via gradient averaging

**Training Steps:**
- Total steps per epoch = Total samples ÷ num_GPUs
- Example: 5,000 samples ÷ 2 GPUs = 2,500 steps/epoch
- NOT 5,000 steps (common misconception)

**Gradient Synchronization (每 Step):**
1. Each GPU computes gradients on its local batch
2. NCCL AllReduce operation averages gradients across GPUs
3. Averaged gradients update both model copies identically
4. Result: Both GPUs have exactly the same model weights

**Speed Benefits:**
- Training time ≈ Single GPU time ÷ num_GPUs
- Effective batch size = per_GPU_batch_size × num_GPUs
- 2 GPUs → ~2x faster per epoch

## Training Configuration

### Hardware
- 2x Tesla V100S-PCIE-32GB (32GB VRAM each)
- No NVLINK (using PCIe P2P communication)
- NCCL timeout: 1800 seconds (30 minutes)

### Model
- Base: Wan2.2-TI2V-5B (5B parameters)
- Fine-tuning: LoRA (Low-Rank Adaptation)
  - Rank: 32
  - Target modules: q,k,v,o,ffn.0,ffn.2
  - Training mode: DiT (Diffusion Transformer) layers only

### Dataset
- Source: MBC dataset (preprocessed)
- Resolution: 704×1280, 17 frames
- Training samples:
  - Full: 170,180 (80K videos + 90K images)
  - Test: 5,000 samples

### Training Parameters
```yaml
# accelerate_config.yaml
compute_environment: LOCAL_MACHINE
distributed_type: MULTI_GPU
num_processes: 2          # 2 GPUs
mixed_precision: bf16      # BFloat16 for memory efficiency
gpu_ids: all
```

```bash
# Training script parameters
--learning_rate 1e-4
--num_epochs 5 (full) / 1 (test)
--height 704
--width 1280
--num_frames 17
--dataset_repeat 1
--lora_rank 32
```

### NCCL Configuration
```bash
export NCCL_TIMEOUT=1800              # 30 minutes (important for PCIe)
export NCCL_BLOCKING_WAIT=1           # Block until completion
export NCCL_ASYNC_ERROR_HANDLING=1    # Handle errors asynchronously
export NCCL_IB_DISABLE=1              # Disable InfiniBand (not available)
export NCCL_P2P_DISABLE=0             # Enable PCIe P2P communication
export NCCL_DEBUG=INFO                # Verbose logging
```

**Why long timeout?**
- Without NVLINK, GPU-to-GPU communication is slower via PCIe
- First batch initialization takes longer with 5B model + high-res video data
- Default 10-minute timeout is insufficient → increased to 30 minutes

## Training Steps Calculation

### Formula
```
Steps per epoch = Total samples ÷ Number of GPUs ÷ Batch size per GPU
```

### Examples

**Test run (5K samples, 2 GPUs):**
```
5,000 samples ÷ 2 GPUs = 2,500 steps per epoch
```

**Full training (170K samples, 2 GPUs):**
```
170,180 samples ÷ 2 GPUs = 85,090 steps per epoch
170,180 samples ÷ 2 GPUs × 5 epochs = 425,450 total steps
```

**Important:** Monitor displays steps per GPU, not total samples processed!

## Monitoring Setup

### Enhanced Monitor Script
Location: `enhanced_monitor.py`

**Features:**
- Tracks both GPU 0 and GPU 1
- Calculates ETA based on elapsed time and current progress
- Generates JSON logs for backend API consumption
- Updates every 10 seconds

**Correct total_steps calculation:**
```python
# DDP (Data Distributed Parallel): Samples ÷ Number of GPUs
total_steps_estimate = 5000 // 2  # = 2500 for test
total_steps_estimate = 170180 // 2  # = 85090 for full training
```

### Frontend Display
- URL: http://211.180.253.250:7020/training
- Backend API: http://localhost:7010/api/training/status
- Data source: `training_logs/training_gpu0.json`, `training_gpu1.json`

### Metrics Displayed
- Current step / Total steps
- Progress percentage (correctly calculated with DDP consideration)
- ETA (estimated time to completion)
- Elapsed time
- GPU utilization (both GPUs at 100% when training)
- GPU memory usage (~22GB each)
- Loss, learning rate

## Files and Directories

```
/home/maiordba/projects/vision/Wan2.2/
├── train_diffsynth_ti2v5b.sh           # Full training script (170K samples, 5 epochs)
├── train_diffsynth_ti2v5b_test.sh      # Test training script (5K samples, 1 epoch)
├── accelerate_config.yaml               # DDP configuration
├── enhanced_monitor.py                  # Dual-GPU monitoring script
├── diffsynth_data/
│   ├── train_metadata.csv               # Full dataset (175,650 lines)
│   └── train_metadata_5k.csv            # Test dataset (5,000 samples)
├── diffsynth_lora_output/               # Full training checkpoints
├── diffsynth_lora_output_test/          # Test training checkpoints
└── training_logs/
    ├── training_gpu0.json               # GPU 0 metrics
    └── training_gpu1.json               # GPU 1 metrics
```

## Common Issues and Solutions

### Issue 1: NCCL Timeout
**Symptom:** Training crashes with "NCCL timeout" after model loading

**Cause:** Default 10-minute timeout insufficient for PCIe communication

**Solution:** Increase NCCL_TIMEOUT to 1800 seconds (30 minutes)

### Issue 2: Wrong Step Count Display
**Symptom:** Frontend shows 5,000 steps but training completes at 2,500

**Cause:** Monitor not accounting for DDP data splitting

**Solution:** Divide total samples by number of GPUs in monitor script

### Issue 3: Incorrect ETA
**Symptom:** ETA shows 19 hours for 5K samples

**Cause:** Using wrong total_steps (5000 instead of 2500)

**Solution:** Use corrected total_steps = samples ÷ num_GPUs

## Performance Metrics

### Test Run (5K samples, 1 epoch, 2 GPUs)

**Configuration:**
- Samples: 5,000
- Steps: 2,500 (after DDP split)
- GPUs: 2x V100S (100% utilization)
- Memory: 22GB per GPU

**Expected Performance:**
- Steps per second: ~0.25-0.5 (depending on data loading)
- Time per epoch: ~1.5-2.5 hours
- Total test time: ~1.5-2.5 hours

### Full Training Estimate (170K samples, 5 epochs, 2 GPUs)

**Configuration:**
- Samples: 170,180
- Steps per epoch: 85,090
- Total steps: 425,450
- GPUs: 2x V100S (100% utilization)

**Estimated Performance:**
- Time per epoch: ~47-95 hours (assuming 0.25-0.5 steps/sec)
- Total training time: ~235-475 hours (~10-20 days)

**Recommendations:**
1. Run test with 5K samples first to verify speed
2. Consider reducing to 50K-100K high-quality samples
3. Reduce epochs from 5 to 2-3 if dataset is large
4. Monitor loss curves to avoid overfitting

## Starting Training

### Test Run (Recommended First)
```bash
# Start test training (5K samples, 1 epoch)
bash train_diffsynth_ti2v5b_test.sh

# Monitor progress
tail -f diffsynth_train_test.log

# Start monitoring script
python3 enhanced_monitor.py

# Check frontend
# Open: http://211.180.253.250:7020/training
```

### Full Training
```bash
# Update monitor script for full training
# Edit enhanced_monitor.py: total_steps_estimate = 85090

# Start full training (170K samples, 5 epochs)
bash train_diffsynth_ti2v5b.sh

# Monitor progress
tail -f diffsynth_train.log
```

## Verifying Training

### Check GPU Usage
```bash
nvidia-smi
# Both GPUs should show:
# - Memory: ~22GB / 32GB
# - GPU-Util: 100%
# - Processes: train.py on both GPU 0 and GPU 1
```

### Check Training Logs
```bash
# View NCCL initialization
tail -100 diffsynth_train_test.log | grep NCCL

# Expected output:
# rank 0 nranks 2 ... Init COMPLETE
# rank 1 nranks 2 ... Init COMPLETE
# P2P/CUMEM communication established
```

### Check Monitoring
```bash
# View latest metrics
cat training_logs/training_gpu0.json | python3 -m json.tool | tail -20

# Check backend API
curl http://localhost:7010/api/training/status | python3 -m json.tool
```

## References

- DiffSynth-Studio: https://github.com/modelscope/DiffSynth-Studio
- Wan2.2 Models: https://huggingface.co/Wan-AI
- PyTorch DDP: https://pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html
- NCCL: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/

## Changelog

- 2025-11-11: Initial documentation with DDP architecture explanation
- 2025-11-11: Fixed monitor script to correctly calculate steps with DDP (samples ÷ num_GPUs)
- 2025-11-11: Added NCCL timeout configuration for PCIe communication
