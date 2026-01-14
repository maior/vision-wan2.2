#!/usr/bin/env python3
"""
Caption 개선 테스트 스크립트 (3개 샘플)
"""

import json
import os
import sys
from pathlib import Path
import time

# API 키 설정
os.environ['GEMINI_API_KEY'] = "AIzaSyBftOqm5Ig6TXH6Edl1FTGX-zbrTGeO9FQ"

try:
    import google.generativeai as genai
except ImportError:
    print("ERROR: google-generativeai 패키지가 필요합니다.")
    print("설치: pip install google-generativeai")
    sys.exit(1)

# Gemini 초기화
genai.configure(api_key=os.environ['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-2.5-flash-lite')

INPUT_DIR = Path("/home/devfit2/mbc_json/video")

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
   - Write 1 sentence (numbered list)

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


def enhance_caption_with_gemini(clip_data, retry=3):
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
            print(f"  시도 {attempt + 1} 실패: {e}")
            if attempt < retry - 1:
                time.sleep(2)
                continue
            else:
                return None


def main():
    print("=" * 80)
    print("Caption 품질 개선 테스트 (3개 샘플)")
    print("=" * 80)

    # JSON 파일 목록 (첫 3개만)
    json_files = []
    for batch_dir in list(INPUT_DIR.glob("batch_*"))[:5]:
        json_files.extend(list(batch_dir.glob("*.json"))[:1])
        if len(json_files) >= 3:
            break

    json_files = json_files[:3]

    print(f"\n총 {len(json_files)}개 파일 처리 시작\n")

    results = []

    for idx, json_file in enumerate(json_files, 1):
        try:
            print(f"[{idx}/3] 처리 중: {json_file.name}")

            # 읽기
            with open(json_file, 'r', encoding='utf-8') as f:
                clip_data = json.load(f)

            clip_id = clip_data['source_data_info']['clip_id']
            category = clip_data['source_data_info']['ai_generated_info'].get('mid_category', 'Unknown')
            keyword = clip_data['source_data_info']['ai_generated_info'].get('keyword', '')

            caption_info = clip_data['labeling_data_info']['caption_info']

            # 개선 전 데이터
            before_semantic = [sem.get('text', '') for sem in caption_info.get('semantic_level', [])]
            before_application = [app.get('text', '') for app in caption_info.get('application_level', [])]
            before_semantic_tokens = sum([sem.get('token', 0) for sem in caption_info.get('semantic_level', [])])
            before_application_tokens = sum([app.get('token', 0) for app in caption_info.get('application_level', [])])

            print(f"  Clip ID: {clip_id}")
            print(f"  카테고리: {category}")
            print(f"  개선 전 토큰: Semantic({before_semantic_tokens}) + Application({before_application_tokens})")

            # Gemini API 호출
            enhanced = enhance_caption_with_gemini(clip_data)

            if enhanced is None:
                print(f"  ❌ 실패\n")
                continue

            # 개선 후 토큰 계산
            after_semantic_tokens = sum(len(text.split()) for text in enhanced['semantic_level_enhanced'])
            after_application_tokens = sum(len(text.split()) for text in enhanced['application_level_enhanced'])

            print(f"  개선 후 토큰: Semantic({after_semantic_tokens}) + Application({after_application_tokens})")
            print(f"  ✅ 성공\n")

            results.append({
                'clip_id': clip_id,
                'category': category,
                'keyword': keyword,
                'before': {
                    'semantic': before_semantic,
                    'application': before_application,
                    'semantic_tokens': before_semantic_tokens,
                    'application_tokens': before_application_tokens
                },
                'after': {
                    'semantic': enhanced['semantic_level_enhanced'],
                    'application': enhanced['application_level_enhanced'],
                    'semantic_tokens': after_semantic_tokens,
                    'application_tokens': after_application_tokens
                }
            })

            time.sleep(1)  # Rate limiting

        except Exception as e:
            print(f"  ❌ 오류: {e}\n")
            continue

    print("=" * 80)
    print(f"처리 완료: 성공 {len(results)}개 / 전체 3개")
    print("=" * 80)

    # 결과 저장
    output_file = Path("/home/maiordba/projects/vision/Wan2.2/enhanced_samples.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: {output_file}")

    # 결과 요약 출력
    if results:
        print("\n=== 개선 효과 요약 ===")
        for r in results:
            before_total = r['before']['semantic_tokens'] + r['before']['application_tokens']
            after_total = r['after']['semantic_tokens'] + r['after']['application_tokens']
            improvement = after_total - before_total
            print(f"Clip {r['clip_id']}: {before_total} → {after_total} tokens (+{improvement})")


if __name__ == "__main__":
    main()
