"""
한국형 프롬프트로 LoRA 모델 추론 실행
"""
import os
import sys
from pathlib import Path

# DiffSynth import
sys.path.insert(0, '/home/maiordba/projects/vision/diffsynth-studio')

from diffsynth import save_video
from diffsynth.pipelines.wan_video_new import WanVideoPipeline, ModelConfig
import torch

# 한국형 프롬프트 목록
KOREAN_PROMPTS = [
    {
        "id": "01_gangnam",
        "prompt": "서울의 번화한 강남역 거리. 높은 빌딩들 사이로 수많은 사람들이 오가고, 네온사인이 반짝이는 밤 풍경. 차량들이 천천히 움직이며, 횡단보도를 건너는 사람들의 모습. 현대적인 도시의 활기찬 분위기가 느껴진다."
    },
    {
        "id": "02_gyeongbokgung",
        "prompt": "경복궁 앞 광장. 한복을 입은 관광객들이 전통 건축물을 배경으로 사진을 찍고 있다. 전통 기와지붕과 현대식 빌딩이 조화를 이루며, 맑은 하늘 아래 평화로운 오후 시간. 궁궐의 웅장함과 함께 역사적 가치가 드러난다."
    },
    {
        "id": "03_jeju_coast",
        "prompt": "제주도 해안가. 푸른 바다와 하늘이 맞닿은 수평선. 파도가 검은 현무암 바위에 부딪히며 하얀 물보라를 일으킨다. 초록빛 풀밭과 원시림이 어우러진 자연 그대로의 모습. 평화롭고 아름다운 자연환경."
    },
    {
        "id": "04_classroom",
        "prompt": "밝은 교실 안. 학생들이 책상에 앉아 선생님의 설명을 듣고 있다. 칠판에는 한글과 그림이 그려져 있고, 학생들이 열심히 필기하는 모습. 창문으로 들어오는 자연광이 교실을 밝게 비추며, 집중된 학습 분위기가 느껴진다."
    },
    {
        "id": "05_traditional_market",
        "prompt": "재래시장의 활기찬 모습. 노점상들이 신선한 과일과 채소를 진열하고 있고, 손님들이 물건을 구경하며 흥정하는 장면. 다양한 색깔의 식재료들과 사람들의 활기찬 대화 소리. 전통적인 한국 시장의 정겨운 풍경."
    },
    {
        "id": "06_autumn_mountain",
        "prompt": "가을 단풍이 물든 산. 빨강, 노랑, 주황색으로 물든 나뭇잎들이 바람에 흔들린다. 등산객들이 오솔길을 따라 천천히 걸어가는 모습. 맑은 가을 하늘과 형형색색의 단풍이 조화를 이루며 아름다운 계절감을 표현한다."
    },
    {
        "id": "07_research_lab",
        "prompt": "최첨단 연구실. 과학자들이 흰색 실험복을 입고 정밀 기기를 다루며 실험하는 모습. 컴퓨터 모니터에 데이터가 표시되고, 현미경으로 샘플을 관찰한다. 깨끗하고 체계적인 실험 환경에서 진행되는 과학 연구 활동."
    },
    {
        "id": "08_hanji_craft",
        "prompt": "한지 공예가가 전통 방식으로 한지를 만드는 과정. 섬세한 손놀림으로 닥나무 섬유를 다루고, 물에 푼 펄프를 고르게 펴는 장면. 전통 작업장의 차분한 분위기와 장인의 집중된 모습. 우리 문화유산의 가치가 담긴 작업."
    },
    {
        "id": "09_hangang_park",
        "prompt": "한강 공원의 여유로운 오후. 자전거를 타는 사람들, 돗자리를 펴고 피크닉을 즐기는 가족들. 강물이 햇빛에 반짝이고, 멀리 고층 빌딩들이 보인다. 도시 속에서 자연을 즐기는 시민들의 평화로운 일상."
    },
    {
        "id": "10_gwangan_bridge",
        "prompt": "부산 광안대교의 밤 풍경. 다리에 설치된 LED 조명이 다양한 색으로 변하며 바다를 비춘다. 주변 건물들의 불빛이 반사되어 물결치는 바다 위로 아름다운 야경을 만든다. 도시의 화려한 밤 풍경이 감동을 준다."
    }
]

def main():
    print("=" * 80)
    print("한국형 프롬프트 LoRA 추론 시작")
    print("=" * 80)

    # 출력 디렉토리 설정
    output_dir = Path("/home/maiordba/projects/vision/Wan2.2/lora_inference_korean")
    output_dir.mkdir(exist_ok=True, parents=True)

    # LoRA 체크포인트 경로
    lora_path = "/home/maiordba/projects/vision/Wan2.2/diffsynth_lora_output_480x832x9_1k_3epochs/epoch-2.safetensors"

    if not Path(lora_path).exists():
        print(f"❌ LoRA 체크포인트를 찾을 수 없습니다: {lora_path}")
        return

    print(f"\n✓ LoRA 체크포인트: {lora_path}")
    print(f"✓ 출력 디렉토리: {output_dir}")
    print(f"✓ 프롬프트 개수: {len(KOREAN_PROMPTS)}")

    # 모델 로딩
    print("\n" + "=" * 80)
    print("모델 로딩 중...")
    print("=" * 80)

    try:
        # 베이스 모델 로드 (Wan2.2-TI2V-5B)
        pipe = WanVideoPipeline.from_pretrained(
            torch_dtype=torch.bfloat16,
            device="cuda",
            model_configs=[
                ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="models_t5_umt5-xxl-enc-bf16.pth", offload_device="cpu"),
                ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="diffusion_pytorch_model*.safetensors", offload_device="cpu"),
                ModelConfig(model_id="Wan-AI/Wan2.2-TI2V-5B", origin_file_pattern="Wan2.2_VAE.pth", offload_device="cpu"),
            ],
        )
        pipe.enable_vram_management()
        print("✓ 베이스 모델 로딩 완료!")

        # LoRA 로드
        print(f"\n✓ LoRA 로딩: {lora_path}")
        pipe.load_lora(pipe.dit, lora_path, alpha=1.0)
        print("✓ LoRA 로딩 완료!\n")

    except Exception as e:
        print(f"❌ 모델 로딩 실패: {e}")
        import traceback
        traceback.print_exc()
        return

    # 각 프롬프트로 비디오 생성
    print("=" * 80)
    print("비디오 생성 시작")
    print("=" * 80)

    for i, item in enumerate(KOREAN_PROMPTS, 1):
        prompt_id = item["id"]
        prompt = item["prompt"]

        print(f"\n[{i}/{len(KOREAN_PROMPTS)}] {prompt_id}")
        print(f"프롬프트: {prompt[:60]}...")

        try:
            # 비디오 생성
            video = pipe(
                prompt=prompt,
                negative_prompt="흐릿한, 저품질, 왜곡된, 정적인",
                seed=42 + i,  # 각 프롬프트마다 다른 시드
                tiled=True,
                height=480,
                width=832,
                num_frames=9,
            )

            # 저장
            output_path = output_dir / f"{prompt_id}.mp4"
            save_video(video, str(output_path), fps=8, quality=5)

            print(f"✓ 저장 완료: {output_path}")

            # 메모리 정리
            torch.cuda.empty_cache()

        except Exception as e:
            print(f"❌ 생성 실패 ({prompt_id}): {e}")
            import traceback
            traceback.print_exc()
            continue

    print("\n" + "=" * 80)
    print("모든 추론 완료!")
    print(f"출력 디렉토리: {output_dir}")
    print("=" * 80)

if __name__ == "__main__":
    main()
