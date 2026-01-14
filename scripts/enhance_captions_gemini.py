#!/usr/bin/env python3
"""
Caption 품질 개선 스크립트 (Gemini 1.5 Pro)
150만개 데이터 처리용
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

try:
    import google.generativeai as genai
except ImportError:
    print("ERROR: google-generativeai 패키지가 필요합니다.")
    print("설치: pip install google-generativeai")
    sys.exit(1)

# 기본 설정
INPUT_DIR = Path("/home/devfit2/mbc_json/video")
OUTPUT_DIR = Path("/home/devfit2/mbc_json_enhanced/video")
LOG_FILE = Path("enhancement_log.jsonl")
ERROR_FILE = Path("enhancement_errors.jsonl")

MAX_WORKERS = 50
RATE_LIMIT_DELAY = 0.6


def create_enhancement_prompt(clip_data):
    """개선용 프롬프트 생성"""

    caption_info = clip_data.get('labeling_data_info', {}).get('caption_info', {})
    object_texts = [obj.get('text', '') for obj in caption_info.get('object_level', [])]
    semantic_texts = [sem.get('text', '') for sem in caption_info.get('semantic_level', [])]
    application_texts = [app.get('text', '') for app in caption_info.get('application_level', [])]

    category = clip_data['source_data_info']['ai_generated_info'].get('mid_category', 'Unknown')
    keyword = clip_data['source_data_info']['ai_generated_info'].get('keyword', '')

    prompt = f"""You are a video caption quality improvement expert.

**Video Information:**
- Category: {category}
- Keyword: {keyword}

**Current Caption (Needs Improvement):**

Object Level (What - Keep as is):
{chr(10).join(f'- {obj}' for obj in object_texts)}

Semantic Level (Why - IMPROVE):
{chr(10).join(f'- {sem}' for sem in semantic_texts)}

Application Level (How - IMPROVE):
{chr(10).join(f'- {app}' for app in application_texts)}

**Improvement Requirements:**

1. **Semantic Level (Why) Enhancement:**
   - Current problem: Superficial expressions like "symbolizes", "shows"
   - Improvement goals:
     * Provide specific context and background (historical, social, economic)
     * Present clear causal relationships
     * Include quantitative information (when possible)
     * Multi-layered meaning interpretation
     * Length: 150-200 characters in Korean
   - Write 2 sentences (each ~100 characters)

2. **Application Level (How) Enhancement:**
   - Current problem: Repetitive pattern "can be used as material"
   - Improvement goals:
     * Diversify into 5 areas (education, industry, policy, content, other)
     * Specify 3+ concrete use cases per area
     * Include actual institution/program names
     * Professional and creative scenarios
     * Length: 250-350 characters in Korean
   - Write 1 sentence (numbered)

**Output Format (JSON only, no explanation):**
```json
{{
  "semantic_level_enhanced": [
    "First sentence in Korean (~100 chars, specific context & causality)",
    "Second sentence in Korean (~100 chars, multi-layered meaning & effects)"
  ],
  "application_level_enhanced": [
    "In Korean: 1) 교육 분야 - use case 1, use case 2, use case 3, 2) 산업 분야 - ..., 3) 정책 분야 - ..., 4) 콘텐츠 분야 - ..., 5) 기타 분야 - ..."
  ]
}}
```

**IMPORTANT:** Output JSON only. No other text."""

    return prompt


def enhance_caption_with_gemini(model, clip_data, retry=3):
    """Gemini API로 Caption 개선"""

    prompt = create_enhancement_prompt(clip_data)

    for attempt in range(retry):
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()

            # JSON 추출
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            enhanced = json.loads(result_text)

            # 검증
            if 'semantic_level_enhanced' not in enhanced or 'application_level_enhanced' not in enhanced:
                raise ValueError("Invalid response format")

            return enhanced

        except Exception as e:
            if attempt < retry - 1:
                time.sleep(1)
                continue
            else:
                return None


def update_json_with_enhanced_caption(clip_data, enhanced):
    """JSON에 개선된 Caption 적용"""

    caption_info = clip_data['labeling_data_info']['caption_info']

    # Semantic Level 교체
    caption_info['semantic_level'] = [
        {
            "text": text,
            "token": len(text.split()),
            "sentences": 1
        }
        for text in enhanced['semantic_level_enhanced']
    ]

    # Application Level 교체
    caption_info['application_level'] = [
        {
            "text": text,
            "token": len(text.split()),
            "sentences": 1
        }
        for text in enhanced['application_level_enhanced']
    ]

    return clip_data


def process_single_json(model, json_path):
    """단일 JSON 파일 처리"""

    try:
        # 읽기
        with open(json_path, 'r', encoding='utf-8') as f:
            clip_data = json.load(f)

        clip_id = clip_data['source_data_info']['clip_id']

        # 개선
        enhanced = enhance_caption_with_gemini(model, clip_data)
        if enhanced is None:
            return {"status": "error", "clip_id": clip_id, "path": str(json_path)}

        # 업데이트
        updated_data = update_json_with_enhanced_caption(clip_data, enhanced)

        # 저장
        output_path = OUTPUT_DIR / json_path.relative_to(INPUT_DIR)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, ensure_ascii=False, indent=2)

        # 로그
        log_entry = {
            "clip_id": clip_id,
            "status": "success",
            "input": str(json_path),
            "output": str(output_path)
        }

        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

        time.sleep(RATE_LIMIT_DELAY)

        return {"status": "success", "clip_id": clip_id}

    except Exception as e:
        clip_id = clip_id if 'clip_id' in locals() else 'unknown'
        error_entry = {
            "clip_id": clip_id,
            "error": str(e),
            "path": str(json_path)
        }

        with open(ERROR_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(error_entry, ensure_ascii=False) + '\n')

        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description='Caption 품질 개선 (Gemini 1.5 Pro)')
    parser.add_argument('--limit', type=int, help='처리할 파일 수 제한 (테스트용)')
    parser.add_argument('--batch', type=str, help='특정 배치만 처리 (예: batch_0001)')
    args = parser.parse_args()

    # API 키 확인
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY 환경변수를 설정하세요.")
        print("export GEMINI_API_KEY='your-api-key-here'")
        sys.exit(1)

    # Gemini 초기화
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro-latest')

    print("=" * 80)
    print("Caption 품질 개선 시작 (Gemini 1.5 Pro)")
    print("=" * 80)

    # JSON 파일 목록
    if args.batch:
        json_files = list(INPUT_DIR.glob(f"{args.batch}/*.json"))
    else:
        json_files = list(INPUT_DIR.glob("batch_*/*.json"))

    if args.limit:
        json_files = json_files[:args.limit]

    total_files = len(json_files)

    print(f"\n총 파일 수: {total_files:,}개")
    print(f"예상 비용: ${total_files * 0.00625:,.2f}")
    print(f"예상 시간: {total_files / 6000:.1f}시간")
    print(f"병렬 처리: {MAX_WORKERS} workers")

    # 확인
    if total_files > 1000:
        confirm = input("\n계속하시겠습니까? (yes/no): ")
        if confirm.lower() != 'yes':
            print("취소되었습니다.")
            return

    # 출력 디렉토리 생성
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 병렬 처리
    success_count = 0
    error_count = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_single_json, model, json_file): json_file
                   for json_file in json_files}

        with tqdm(total=total_files, desc="처리 중") as pbar:
            for future in as_completed(futures):
                result = future.result()

                if result['status'] == 'success':
                    success_count += 1
                else:
                    error_count += 1

                pbar.update(1)
                pbar.set_postfix({"성공": success_count, "실패": error_count})

    print("\n" + "=" * 80)
    print("처리 완료!")
    print("=" * 80)
    print(f"성공: {success_count:,}개")
    print(f"실패: {error_count:,}개")
    print(f"로그: {LOG_FILE}")
    print(f"에러: {ERROR_FILE}")


if __name__ == "__main__":
    main()
