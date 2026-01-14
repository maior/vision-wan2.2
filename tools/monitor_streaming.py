#!/usr/bin/env python3
"""
백엔드-프론트엔드 Streaming 모니터링 스크립트
실시간으로 JSON 로그 생성 및 API 응답 확인
"""
import time
import json
import requests
from pathlib import Path
from datetime import datetime

# 설정
JSON_DIR = Path("./training_logs")
API_BASE = "http://211.180.253.250:7020/api/training"
CHECK_INTERVAL = 5  # 5초마다 체크

def check_json_files():
    """JSON 파일 존재 및 최신 업데이트 확인"""
    results = {}

    for gpu_id in [0, 1]:
        json_file = JSON_DIR / f"training_gpu{gpu_id}.json"

        if json_file.exists():
            stat = json_file.stat()
            size = stat.st_size
            mtime = datetime.fromtimestamp(stat.st_mtime).strftime('%H:%M:%S')

            # JSON 내용 읽기
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    num_entries = len(data)
                    latest_step = data[-1]['step'] if data else 0
                    latest_loss = data[-1]['loss'] if data else 0

                results[f"gpu{gpu_id}"] = {
                    "exists": True,
                    "size": size,
                    "mtime": mtime,
                    "entries": num_entries,
                    "latest_step": latest_step,
                    "latest_loss": latest_loss
                }
            except Exception as e:
                results[f"gpu{gpu_id}"] = {
                    "exists": True,
                    "error": str(e)
                }
        else:
            results[f"gpu{gpu_id}"] = {"exists": False}

    return results

def check_api_status():
    """백엔드 API 상태 확인"""
    try:
        response = requests.get(f"{API_BASE}/status", timeout=2)
        return response.status_code, response.json()
    except Exception as e:
        return None, {"error": str(e)}

def check_api_metrics():
    """백엔드 API 메트릭 확인"""
    try:
        response = requests.get(f"{API_BASE}/metrics", timeout=2)
        if response.status_code == 200:
            data = response.json()
            return {
                "gpu0_entries": len(data.get("gpu0", [])),
                "gpu1_entries": len(data.get("gpu1", []))
            }
    except Exception as e:
        return {"error": str(e)}

def print_status(iteration):
    """현재 상태 출력"""
    print("\n" + "="*80)
    print(f"🔍 Streaming Monitor - Iteration {iteration} ({datetime.now().strftime('%H:%M:%S')})")
    print("="*80)

    # 1. JSON 파일 확인
    print("\n📄 JSON Files Status:")
    json_status = check_json_files()
    for gpu, status in json_status.items():
        if status.get("exists"):
            if "error" in status:
                print(f"  ❌ {gpu}: ERROR - {status['error']}")
            else:
                print(f"  ✅ {gpu}: {status['entries']} entries, "
                      f"Step {status['latest_step']}, "
                      f"Loss {status['latest_loss']:.4f}, "
                      f"Updated at {status['mtime']}")
        else:
            print(f"  ⏳ {gpu}: Not created yet")

    # 2. API Status 확인
    print("\n🌐 Backend API /status:")
    status_code, status_data = check_api_status()
    if status_code == 200:
        for gpu in ["gpu0", "gpu1"]:
            gpu_status = status_data.get(gpu, {})
            if gpu_status.get("active"):
                print(f"  ✅ {gpu}: Active - Step {gpu_status['current_step']}/{gpu_status['total_steps']}, "
                      f"Loss {gpu_status['loss']:.4f}, Progress {gpu_status['progress']:.1f}%")
            else:
                print(f"  ⏳ {gpu}: Inactive")
    else:
        print(f"  ❌ API Error: {status_data}")

    # 3. API Metrics 확인
    print("\n📊 Backend API /metrics:")
    metrics = check_api_metrics()
    if "error" not in metrics:
        print(f"  GPU 0: {metrics['gpu0_entries']} entries")
        print(f"  GPU 1: {metrics['gpu1_entries']} entries")
    else:
        print(f"  ❌ Error: {metrics['error']}")

def main():
    print("="*80)
    print("🚀 Starting Backend-Frontend Streaming Monitor")
    print("="*80)
    print(f"JSON Directory: {JSON_DIR.absolute()}")
    print(f"API Base URL: {API_BASE}")
    print(f"Check Interval: {CHECK_INTERVAL} seconds")
    print("\nPress Ctrl+C to stop monitoring...")

    iteration = 0
    try:
        while True:
            iteration += 1
            print_status(iteration)
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        print("\n\n✋ Monitoring stopped by user")
    except Exception as e:
        print(f"\n\n❌ Monitoring error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
