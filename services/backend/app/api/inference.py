"""
LoRA 추론 결과 API
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pathlib import Path
from typing import List, Dict
import json

router = APIRouter()

# 여러 LoRA 버전 지원
INFERENCE_RESULTS_DIRS = {
    "base": Path("/home/maiordba/projects/vision/Wan2.2/lora_inference_results"),
    "epoch0": Path("/home/maiordba/projects/vision/Wan2.2/lora_inference_results_with_lora"),
    "epoch2": Path("/home/maiordba/projects/vision/Wan2.2/lora_inference_results_epoch2"),
    "korean": Path("/home/maiordba/projects/vision/Wan2.2/lora_inference_korean")
}

@router.get("/results")
def get_inference_results():
    """Get list of all LoRA inference results (all versions)"""

    all_versions = {}

    for version_name, results_dir in INFERENCE_RESULTS_DIRS.items():
        if not results_dir.exists():
            all_versions[version_name] = {
                "status": "not_started",
                "videos": [],
                "count": 0,
                "message": f"{version_name} inference not started yet"
            }
            continue

        videos = _get_videos_from_dir(results_dir, version_name)

        # Determine expected count based on version
        expected_count = 9 if version_name == "korean" else 3

        # Check if inference is in progress
        status = "completed" if len(videos) >= expected_count else "in_progress" if len(videos) > 0 else "waiting"

        all_versions[version_name] = {
            "status": status,
            "videos": videos,
            "count": len(videos),
            "expected_count": expected_count
        }

    return {
        "versions": all_versions,
        "model_info": {
            "base": {"model": "Wan2.2-TI2V-5B (no LoRA)", "epochs": 0},
            "epoch0": {"model": "LoRA epoch-0", "epochs": 1},
            "epoch2": {"model": "LoRA epoch-2", "epochs": 3},
            "korean": {"model": "LoRA epoch-2 (Korean prompts)", "epochs": 3, "description": "1K 3 epochs 모델로 한국형 프롬프트 추론"}
        }
    }


def _get_videos_from_dir(results_dir: Path, version_name: str):
    """Helper function to get videos from a directory"""

    if not results_dir.exists():
        return []

    # Load metrics results if available
    metrics_file = results_dir / f"metrics_results{'_with_lora' if version_name == 'epoch0' else '_epoch2' if version_name == 'epoch2' else ''}.json"
    metrics_data = {}
    if metrics_file.exists():
        try:
            with open(metrics_file, 'r', encoding='utf-8') as f:
                metrics_data = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load metrics file for {version_name}: {e}")

    videos = []

    # Find all MP4 files in the results directory
    for video_file in sorted(results_dir.glob("*.mp4")):
        file_stat = video_file.stat()

        # Parse test info from filename
        test_name = video_file.stem.replace("_lora", "").replace("_with_lora", "").replace("_epoch2", "")

        # Determine test type from filename
        test_info = {
            "test1_korean_city": {
                "prompt": "밤의 서울 도심, 네온 불빛이 빛나는 거리를 걷는 사람들",
                "description": "Seoul cityscape at night"
            },
            "test2_nature": {
                "prompt": "아름다운 벚꽃이 만개한 봄날의 공원, 바람에 날리는 꽃잎",
                "description": "Cherry blossoms in spring park"
            },
            "test3_action": {
                "prompt": "축구 경기장에서 골을 넣는 선수, 환호하는 관중",
                "description": "Soccer game goal celebration"
            },
            "01_gangnam": {
                "prompt": "서울의 번화한 강남역 거리. 높은 빌딩들 사이로 수많은 사람들이 오가고, 네온사인이 반짝이는 밤 풍경",
                "description": "Gangnam street scene at night"
            },
            "02_gyeongbokgung": {
                "prompt": "경복궁 앞 광장. 한복을 입은 관광객들이 전통 건축물을 배경으로 사진을 찍고 있다",
                "description": "Gyeongbokgung Palace with tourists"
            },
            "03_jeju_coast": {
                "prompt": "제주도 해안가. 푸른 바다와 하늘이 맞닿은 수평선. 파도가 검은 현무암 바위에 부딪히며 하얀 물보라를 일으킨다",
                "description": "Jeju island coastal scenery"
            },
            "04_classroom": {
                "prompt": "밝은 교실 안. 학생들이 책상에 앉아 선생님의 설명을 듣고 있다",
                "description": "Bright classroom with students"
            },
            "05_traditional_market": {
                "prompt": "재래시장의 활기찬 모습. 노점상들이 신선한 과일과 채소를 진열하고 있다",
                "description": "Bustling traditional market"
            },
            "06_autumn_mountain": {
                "prompt": "가을 단풍이 물든 산. 빨강, 노랑, 주황색으로 물든 나뭇잎들이 바람에 흔들린다",
                "description": "Autumn mountain with colored leaves"
            },
            "07_research_lab": {
                "prompt": "최첨단 연구실. 과학자들이 흰색 실험복을 입고 정밀 기기를 다루며 실험하는 모습",
                "description": "Modern research laboratory"
            },
            "08_hanji_craft": {
                "prompt": "한지 공예가가 전통 방식으로 한지를 만드는 과정. 섬세한 손놀림으로 닥나무 섬유를 다루고 있다",
                "description": "Traditional Korean paper craft"
            },
            "09_hangang_park": {
                "prompt": "한강 공원의 여유로운 오후. 자전거를 타는 사람들, 돗자리를 펴고 피크닉을 즐기는 가족들",
                "description": "Han River park leisure time"
            }
        }

        info = test_info.get(test_name, {"prompt": "Unknown", "description": "Unknown test"})

        # Get metrics for this video
        video_metrics = metrics_data.get(video_file.name, {})

        video_data = {
            "name": test_name,
            "filename": video_file.name,
            "size": file_stat.st_size,
            "size_mb": round(file_stat.st_size / (1024 * 1024), 2),
            "created": file_stat.st_mtime,
            "url": f"/api/inference/video/{version_name}/{video_file.name}",
            "prompt": info["prompt"],
            "description": info["description"],
            "version": version_name
        }

        # Add metrics if available
        if video_metrics:
            video_data["clip_score"] = video_metrics.get("clip_score")
            video_data["fvd_score"] = video_metrics.get("fvd")
            video_data["quality_metrics"] = video_metrics.get("quality_metrics")

        videos.append(video_data)

    return videos


@router.get("/video/{version_name}/{filename}")
def get_video(version_name: str, filename: str):
    """Serve video file"""

    # Get the appropriate results directory
    if version_name not in INFERENCE_RESULTS_DIRS:
        raise HTTPException(status_code=400, detail="Invalid version")

    results_dir = INFERENCE_RESULTS_DIRS[version_name]

    # Security: only allow files in the results directory
    video_path = results_dir / filename

    # Check if path is actually within results directory (prevent path traversal)
    try:
        video_path = video_path.resolve()
        if not str(video_path).startswith(str(results_dir.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except:
        raise HTTPException(status_code=400, detail="Invalid filename")

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    if not video_path.suffix == ".mp4":
        raise HTTPException(status_code=400, detail="Invalid file type")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=filename
    )


@router.get("/status")
def get_inference_status():
    """Get current inference test status for all versions"""

    all_status = {}

    for version_name, results_dir in INFERENCE_RESULTS_DIRS.items():
        if not results_dir.exists():
            all_status[version_name] = {
                "status": "not_started",
                "progress": 0,
                "message": f"{version_name} test directory not found"
            }
            continue

        # Count existing videos
        video_count = len(list(results_dir.glob("*.mp4")))
        expected_count = 9 if version_name == "korean" else 3

        progress = (video_count / expected_count * 100) if expected_count > 0 else 0

        # Determine status based on progress
        if video_count == 0:
            status_info = {"status": "waiting", "message": "Waiting for inference to start"}
        elif video_count >= expected_count:
            status_info = {"status": "completed", "message": "All inference tests completed"}
        else:
            status_info = {"status": "in_progress", "message": f"Generating videos ({video_count}/{expected_count})"}

        all_status[version_name] = {
            "status": status_info["status"],
            "progress": progress,
            "videos_generated": video_count,
            "videos_expected": expected_count,
            "message": status_info["message"]
        }

    return {"versions": all_status}
