# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Wan2.2 is an advanced large-scale video generative model supporting multiple generation tasks:
- Text-to-Video (T2V-A14B, TI2V-5B)
- Image-to-Video (I2V-A14B, TI2V-5B)
- Speech-to-Video (S2V-14B)
- Character Animation and Replacement (Animate-14B)

The repository uses a Mixture-of-Experts (MoE) architecture with specialized models for different noise levels in the diffusion process.

## Installation

### Standard Installation
```bash
pip install -r requirements.txt
```

Note: If `flash_attn` installation fails, install other packages first, then install `flash_attn` separately.

### Additional Requirements
- For Speech-to-Video: `pip install -r requirements_s2v.txt`
- For Animate: `pip install -r requirements_animate.txt`

### Using Poetry (Alternative)
```bash
poetry install

# If flash-attn fails:
poetry run pip install --upgrade pip setuptools wheel
poetry run pip install flash-attn --no-build-isolation
poetry install
```

### Development Tools
```bash
pip install .[dev]  # Installs pytest, black, flake8, isort, mypy, huggingface-hub[cli]
```

## Running Inference

### Model Download
Download models from HuggingFace or ModelScope:
```bash
# HuggingFace
huggingface-cli download Wan-AI/Wan2.2-T2V-A14B --local-dir ./Wan2.2-T2V-A14B

# ModelScope
modelscope download Wan-AI/Wan2.2-T2V-A14B --local_dir ./Wan2.2-T2V-A14B
```

Available models: T2V-A14B, I2V-A14B, TI2V-5B, S2V-14B, Animate-14B

### Basic Commands

#### Text-to-Video (Single GPU, 80GB VRAM)
```bash
python generate.py --task t2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B \
  --offload_model True --convert_model_dtype \
  --prompt "Your prompt here"
```

#### Text-to-Video (Multi-GPU with FSDP + DeepSpeed Ulysses)
```bash
torchrun --nproc_per_node=8 generate.py --task t2v-A14B --size 1280*720 \
  --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 \
  --prompt "Your prompt here"
```

#### Image-to-Video (Single GPU)
```bash
python generate.py --task i2v-A14B --size 1280*720 --ckpt_dir ./Wan2.2-I2V-A14B \
  --offload_model True --convert_model_dtype \
  --image path/to/image.jpg --prompt "Your prompt here"
```

#### Text-Image-to-Video (TI2V-5B, can run on 24GB GPU like RTX 4090)
```bash
python generate.py --task ti2v-5B --size 1280*704 --ckpt_dir ./Wan2.2-TI2V-5B \
  --offload_model True --convert_model_dtype --t5_cpu \
  --prompt "Your prompt here"
```

#### Speech-to-Video
```bash
python generate.py --task s2v-14B --size 1024*704 --ckpt_dir ./Wan2.2-S2V-14B \
  --offload_model True --convert_model_dtype \
  --prompt "Your prompt" --image path/to/image.jpg --audio path/to/audio.wav
```

#### Wan-Animate (Requires Preprocessing)
Preprocessing:
```bash
# Animation mode
python ./wan/modules/animate/preprocess/preprocess_data.py \
  --ckpt_path ./Wan2.2-Animate-14B/process_checkpoint \
  --video_path ./examples/wan_animate/animate/video.mp4 \
  --refer_path ./examples/wan_animate/animate/image.jpeg \
  --save_path ./examples/wan_animate/animate/process_results \
  --resolution_area 1280 720 --retarget_flag --use_flux

# Replacement mode
python ./wan/modules/animate/preprocess/preprocess_data.py \
  --ckpt_path ./Wan2.2-Animate-14B/process_checkpoint \
  --video_path ./examples/wan_animate/replace/video.mp4 \
  --refer_path ./examples/wan_animate/replace/image.jpeg \
  --save_path ./examples/wan_animate/replace/process_results \
  --resolution_area 1280 720 --iterations 3 --k 7 --w_len 1 --h_len 1 --replace_flag
```

Generation:
```bash
# Animation mode
python generate.py --task animate-14B --ckpt_dir ./Wan2.2-Animate-14B/ \
  --src_root_path ./examples/wan_animate/animate/process_results/ --refert_num 1

# Replacement mode
python generate.py --task animate-14B --ckpt_dir ./Wan2.2-Animate-14B/ \
  --src_root_path ./examples/wan_animate/replace/process_results/ \
  --refert_num 1 --replace_flag --use_relighting_lora
```

### Prompt Extension

Prompt extension enriches video generation details. Two methods available:

1. **DashScope API** (recommended for quality):
```bash
DASH_API_KEY=your_key torchrun --nproc_per_node=8 generate.py --task t2v-A14B \
  --size 1280*720 --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 \
  --prompt "Your prompt" --use_prompt_extend --prompt_extend_method 'dashscope' \
  --prompt_extend_target_lang 'zh'
```

2. **Local Qwen model**:
```bash
torchrun --nproc_per_node=8 generate.py --task t2v-A14B --size 1280*720 \
  --ckpt_dir ./Wan2.2-T2V-A14B --dit_fsdp --t5_fsdp --ulysses_size 8 \
  --prompt "Your prompt" --use_prompt_extend --prompt_extend_method 'local_qwen' \
  --prompt_extend_model "Qwen/Qwen2.5-14B-Instruct" --prompt_extend_target_lang 'zh'
```

### Memory Optimization Flags

- `--offload_model True`: Offload model weights to CPU when not in use
- `--convert_model_dtype`: Convert model dtype to config.param_dtype (bf16)
- `--t5_cpu`: Place T5 encoder on CPU (only without t5_fsdp)
- `--dit_fsdp`: Enable FSDP for DiT model (multi-GPU)
- `--t5_fsdp`: Enable FSDP for T5 encoder (multi-GPU)
- `--ulysses_size N`: Enable DeepSpeed Ulysses sequence parallelism with N GPUs

### Resolution Support

- **T2V-A14B/I2V-A14B**: 720*1280, 1280*720, 480*832, 832*480
- **TI2V-5B**: 704*1280, 1280*704 (note the different aspect ratio)
- **S2V-14B**: 720*1280, 1280*720, 480*832, 832*480, 1024*704, 704*1024, 704*1280, 1280*704
- **Animate-14B**: 720*1280, 1280*720

## Testing

Run integration tests:
```bash
bash tests/test.sh <model_dir> <gpu_count>
# Example: bash tests/test.sh /path/to/models 8
```

## Code Formatting

```bash
# Using Make
make format

# Manual
isort generate.py wan
yapf -i -r *.py generate.py wan

# Using dev tools
black .
isort .
```

## Architecture

### Core Components

#### 1. Model Entry Points
- `wan/text2video.py`: WanT2V class for text-to-video generation
- `wan/image2video.py`: WanI2V class for image-to-video generation
- `wan/textimage2video.py`: WanTI2V class for hybrid text+image-to-video
- `wan/speech2video.py`: WanS2V class for audio-driven video generation
- `wan/animate.py`: WanAnimate class for character animation/replacement

#### 2. Core Modules (`wan/modules/`)
- `model.py`: WanModel - main DiT (Diffusion Transformer) architecture with MoE support
- `vae2_1.py`: Wan2_1_VAE - video VAE with 4×8×8 compression
- `vae2_2.py`: Wan2_2_VAE - high-compression VAE with 4×16×16 compression (used in TI2V-5B)
- `t5.py`: T5EncoderModel - text encoder using UMT5-XXL
- `attention.py`: Flash attention implementations
- `tokenizers.py`: Text tokenization utilities
- `s2v/`: Speech-to-video specific modules (audio encoder, motioner, etc.)
- `animate/`: Animation/replacement specific modules

#### 3. Configuration System (`wan/configs/`)
- `shared_config.py`: Common configuration parameters across all models
- `wan_t2v_A14B.py`, `wan_i2v_A14B.py`, etc.: Task-specific configs
- Each config defines: model architecture (dim, num_layers, num_heads), checkpoint paths, sampling parameters (steps, shift, guidance scale), supported resolutions

#### 4. Distributed Training/Inference (`wan/distributed/`)
- `fsdp.py`: PyTorch FSDP (Fully Sharded Data Parallel) utilities
- `sequence_parallel.py`: Sequence parallelism for attention and DiT
- `ulysses.py`: DeepSpeed Ulysses implementation for long sequence parallelism
- `util.py`: Distributed utilities (world size, rank, initialization)

#### 5. Utilities (`wan/utils/`)
- `fm_solvers.py`: Flow matching solvers and schedulers (DPM-Solver++)
- `fm_solvers_unipc.py`: UniPC sampler implementation
- `prompt_extend.py`: DashScopePromptExpander and QwenPromptExpander for prompt enrichment
- `system_prompt.py`: System prompts for prompt extension
- `utils.py`: General utilities (video saving, audio merging, etc.)

### MoE Architecture

The A14B models use a two-expert MoE design:
- **High-noise expert**: Activated early in denoising (high timesteps), focuses on layout
- **Low-noise expert**: Activated later (low timesteps), refines details
- Transition point determined by signal-to-noise ratio (SNR) at threshold step t_moe
- Total 27B parameters, only 14B active per step

### VAE Compression

- **Wan2.1_VAE**: 4×8×8 compression (used in 14B models)
- **Wan2.2_VAE**: 4×16×16 compression with additional 2×2 patchification → total 4×32×32 compression (used in TI2V-5B)

### Inference Pipeline

1. Load T5 encoder, VAE, and DiT model(s) from checkpoints
2. Encode text prompt with T5 → text embeddings (512 tokens)
3. (Optional) Encode reference image with VAE
4. Initialize latent noise tensor
5. Denoise using flow matching with DPM-Solver++ or UniPC
   - Early steps: high-noise expert (if MoE)
   - Later steps: low-noise expert (if MoE)
6. Decode latents with VAE → video frames
7. Save video with ffmpeg

## Important Notes

### For Wan-Animate
- Do NOT use LoRA models trained on Wan2.2 base models with Wan-Animate
- Preprocessing is required before generation
- Animation mode: requires pose retargeting especially for different body proportions
- Replacement mode: mask extraction designed for single-person videos only

### Memory Requirements
- T2V-A14B/I2V-A14B: 80GB VRAM for single GPU, or multi-GPU with FSDP
- TI2V-5B: Can run on 24GB GPU (e.g., RTX 4090) with `--offload_model --convert_model_dtype --t5_cpu`
- S2V-14B: 80GB VRAM for single GPU

### Supported Sizes
Note that TI2V-5B uses different resolutions (704 instead of 720) due to VAE compression requirements.

### Prompt Extension
- T2V tasks: use text models like `Qwen2.5-14B-Instruct`
- I2V tasks: use vision-language models like `Qwen2.5-VL-7B-Instruct`
- Larger models give better results but require more memory
- DashScope API requires `DASH_API_KEY` environment variable

## License

Apache 2.0 License - models are free to use, but users are responsible for compliance with applicable laws and ethical usage.
