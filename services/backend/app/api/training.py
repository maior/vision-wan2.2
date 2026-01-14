"""
LoRA 학습 모니터링 API
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from typing import Dict, List, Any

router = APIRouter()

# 로그 디렉토리
LOG_DIR = Path(__file__).parent.parent.parent.parent.parent / "training_logs"

@router.get("/metrics")
async def get_training_metrics() -> Dict[str, List[Any]]:
    """학습 메트릭 조회"""
    metrics = {
        "gpu0": [],
        "gpu1": []
    }

    # GPU 0 로그
    gpu0_log = LOG_DIR / "training_gpu0.json"
    if gpu0_log.exists():
        try:
            with open(gpu0_log, 'r') as f:
                metrics["gpu0"] = json.load(f)
        except Exception as e:
            print(f"Error loading GPU 0 metrics: {e}")

    # GPU 1 로그
    gpu1_log = LOG_DIR / "training_gpu1.json"
    if gpu1_log.exists():
        try:
            with open(gpu1_log, 'r') as f:
                metrics["gpu1"] = json.load(f)
        except Exception as e:
            print(f"Error loading GPU 1 metrics: {e}")

    return metrics


@router.get("/status")
async def get_training_status() -> Dict[str, Any]:
    """현재 학습 상태 조회"""
    status = {
        "gpu0": {"active": False, "current_step": 0, "total_steps": 0},
        "gpu1": {"active": False, "current_step": 0, "total_steps": 0}
    }

    # GPU 0 상태
    gpu0_log = LOG_DIR / "training_gpu0.json"
    if gpu0_log.exists():
        try:
            with open(gpu0_log, 'r') as f:
                data = json.load(f)
                # Handle dictionary format with gpu0/gpu1 keys
                if isinstance(data, dict) and "gpu0" in data:
                    status["gpu0"] = data["gpu0"]
                # Handle legacy array format
                elif isinstance(data, list) and data:
                    latest = data[-1]
                    status["gpu0"] = {
                        "active": True,
                        "current_step": latest.get("step", 0),
                        "total_steps": latest.get("total_steps", 0),
                        "epoch": latest.get("epoch", 0),
                        "loss": latest.get("loss", 0),
                        "lr": latest.get("lr", 0),
                        "progress": latest.get("progress", 0),
                        "timestamp": latest.get("timestamp", 0)
                    }
        except Exception as e:
            print(f"Error loading GPU 0 status: {e}")

    # GPU 1 상태
    gpu1_log = LOG_DIR / "training_gpu1.json"
    if gpu1_log.exists():
        try:
            with open(gpu1_log, 'r') as f:
                data = json.load(f)
                # Handle dictionary format with gpu0/gpu1 keys
                if isinstance(data, dict) and "gpu1" in data:
                    status["gpu1"] = data["gpu1"]
                # Handle legacy array format
                elif isinstance(data, list) and data:
                    latest = data[-1]
                    status["gpu1"] = {
                        "active": True,
                        "current_step": latest.get("step", 0),
                        "total_steps": latest.get("total_steps", 0),
                        "epoch": latest.get("epoch", 0),
                        "loss": latest.get("loss", 0),
                        "lr": latest.get("lr", 0),
                        "progress": latest.get("progress", 0),
                        "timestamp": latest.get("timestamp", 0)
                    }
        except Exception as e:
            print(f"Error loading GPU 1 status: {e}")

    return status
