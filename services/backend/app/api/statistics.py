"""
통계 관련 API
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter
import csv
import os
from pathlib import Path
import pandas as pd
import json

from app.database import get_db, DataSample as DBDataSample, Statistics as DBStats
from app.models import DashboardStats

router = APIRouter()

# Kiwi 초기화 (명사 추출용)
try:
    from kiwipiepy import Kiwi
    kiwi = Kiwi()
    KIWI_AVAILABLE = True
except ImportError:
    KIWI_AVAILABLE = False
    print("Warning: kiwipiepy not available, falling back to regex-based keyword extraction")


def extract_nouns(text, min_length=2):
    """Kiwi를 사용하여 명사만 추출"""
    if not KIWI_AVAILABLE:
        # Kiwi가 없으면 기존 regex 방식 사용
        import re
        return re.findall(r'[가-힣]{2,}', text)

    if pd.isna(text) or not text:
        return []

    try:
        result = kiwi.analyze(str(text))
        if not result:
            return []

        # 명사(NNG, NNP) 추출
        nouns = []
        for token, pos, _, _ in result[0][0]:
            if pos in ('NNG', 'NNP') and len(token) >= min_length:
                if not token.isdigit():
                    nouns.append(token)
        return nouns
    except:
        return []


def get_stats_from_csv():
    """CSV 파일에서 직접 통계 계산"""
    # CSV 파일 경로 (우선순위: COT CSV > 일반 CSV)
    csv_paths = [
        '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv',
        '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv',
        '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_data.csv'
    ]

    csv_path = None
    for path in csv_paths:
        if os.path.exists(path):
            csv_path = path
            break

    if not csv_path:
        return {
            'total_samples': 0,
            'total_images': 0,
            'total_videos': 0,
            'samples_with_issues': 0,
            'avg_quality_score': 0.0,
            'preprocessing_progress': 0
        }

    total_samples = 0
    total_images = 0
    total_videos = 0
    samples_with_issues = 0
    quality_scores = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                total_samples += 1

                media_type = row.get('media_type', '')
                if media_type == 'image':
                    total_images += 1
                elif media_type == 'video':
                    total_videos += 1

                # COT CSV인 경우 토큰 기반으로 품질 점수 계산
                if 'tokens_total' in row:
                    try:
                        tokens = int(row.get('tokens_total', 0))
                        has_cot = row.get('has_cot', 'False').lower() == 'true'

                        # 품질 점수 계산
                        if tokens >= 100:
                            # 100+ 토큰: 우수 (100점)
                            quality_scores.append(100.0)
                        elif tokens >= 50:
                            # 50-99 토큰: 양호 (75-99점)
                            quality_scores.append(75.0 + (tokens - 50) / 50.0 * 25.0)
                        elif tokens > 0:
                            # 1-49 토큰: 미흡 (1-74점)
                            quality_scores.append(tokens / 50.0 * 75.0)
                            samples_with_issues += 1
                        else:
                            # 0 토큰: 실패 (0점)
                            quality_scores.append(0.0)
                            samples_with_issues += 1

                        # COT 없으면 이슈로 카운트
                        if not has_cot and tokens > 0:
                            samples_with_issues += 1

                    except:
                        quality_scores.append(0.0)
                        samples_with_issues += 1

                # 일반 CSV는 기본 점수
                else:
                    quality_scores.append(50.0)

    except Exception as e:
        print(f"CSV 읽기 오류: {e}")

    avg_quality_score = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0

    # 전처리 진행률 계산
    video_dir = Path('/home/maiordba/projects/vision/Wan2.2/preprocessed_data/converted_720p')
    image_dir = Path('/home/maiordba/projects/vision/Wan2.2/preprocessed_data/images_1280x720')

    video_processed = len(list(video_dir.rglob('*.mp4'))) if video_dir.exists() else 0
    image_processed = len(list(image_dir.rglob('*.png'))) if image_dir.exists() else 0

    preprocessing_progress = 0
    if total_videos + total_images > 0:
        preprocessing_progress = ((video_processed + image_processed) / (total_videos + total_images)) * 100

    return {
        'total_samples': total_samples,
        'total_images': total_images,
        'total_videos': total_videos,
        'samples_with_issues': samples_with_issues,
        'avg_quality_score': avg_quality_score,
        'preprocessing_progress': preprocessing_progress
    }


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """대시보드용 전체 통계"""

    # CSV에서 통계 가져오기
    stats = get_stats_from_csv()

    issue_rate = 0.0
    if stats['total_samples'] > 0:
        issue_rate = (stats['samples_with_issues'] / stats['total_samples']) * 100

    # 학습 상태 판단
    training_status = 'pending'
    if stats['preprocessing_progress'] >= 100:
        training_status = 'ready'
    elif stats['preprocessing_progress'] > 0:
        training_status = 'preprocessing'

    return DashboardStats(
        total_samples=stats['total_samples'],
        total_images=stats['total_images'],
        total_videos=stats['total_videos'],
        samples_with_issues=stats['samples_with_issues'],
        issue_rate=issue_rate,
        avg_quality_score=stats['avg_quality_score'],
        preprocessing_progress=round(stats['preprocessing_progress'], 1),
        training_status=training_status
    )


@router.get("/resolution")
def get_resolution_stats(db: Session = Depends(get_db)):
    """해상도별 통계"""

    results = db.query(
        DBDataSample.resolution,
        func.count(DBDataSample.id).label('count')
    ).group_by(DBDataSample.resolution).all()

    return {
        "total": sum(r.count for r in results),
        "distribution": [{"resolution": r.resolution, "count": r.count} for r in results]
    }


@router.get("/category")
def get_category_stats(db: Session = Depends(get_db)):
    """카테고리별 통계"""

    results = db.query(
        DBDataSample.category,
        func.count(DBDataSample.id).label('count')
    ).group_by(DBDataSample.category).all()

    return {
        "total": sum(r.count for r in results),
        "distribution": [{"category": r.category, "count": r.count} for r in results]
    }


@router.get("/caption-length")
def get_caption_length_stats(db: Session = Depends(get_db)):
    """Caption 길이 분포"""

    samples = db.query(DBDataSample.caption).all()

    lengths = [len(s.caption) for s in samples if s.caption]

    if not lengths:
        return {
            "count": 0,
            "min": 0,
            "max": 0,
            "avg": 0,
            "distribution": []
        }

    # 범위별 분포
    ranges = {
        "0-50": 0,
        "50-100": 0,
        "100-200": 0,
        "200-500": 0,
        "500+": 0,
    }

    for length in lengths:
        if length < 50:
            ranges["0-50"] += 1
        elif length < 100:
            ranges["50-100"] += 1
        elif length < 200:
            ranges["100-200"] += 1
        elif length < 500:
            ranges["200-500"] += 1
        else:
            ranges["500+"] += 1

    return {
        "count": len(lengths),
        "min": min(lengths),
        "max": max(lengths),
        "avg": sum(lengths) / len(lengths),
        "distribution": [{"range": k, "count": v} for k, v in ranges.items()]
    }


@router.get("/media-type")
def get_media_type_stats(db: Session = Depends(get_db)):
    """미디어 타입별 통계"""

    results = db.query(
        DBDataSample.media_type,
        func.count(DBDataSample.id).label('count')
    ).group_by(DBDataSample.media_type).all()

    return {
        "total": sum(r.count for r in results),
        "distribution": [{"media_type": r.media_type, "count": r.count} for r in results]
    }


@router.get("/issues/detailed")
def get_detailed_issues():
    """상세 이슈 분석 - 이유와 해결방안 포함"""

    # COT CSV 파일 경로
    csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'

    if not os.path.exists(csv_path):
        return {
            "total_samples": 0,
            "samples_with_issues": 0,
            "issue_types": {},
            "issues": []
        }

    try:
        # CSV 읽기 (처음 10000개만 분석 - 성능 고려)
        df = pd.read_csv(csv_path, nrows=10000)

        total_samples = len(df)
        issues = []
        issue_type_counts = {
            "low_tokens": 0,
            "no_cot": 0,
            "quality_fail": 0
        }

        for _, row in df.iterrows():
            clip_issues = []

            # 토큰 수 체크
            tokens = int(row.get('tokens_total', 0))
            if tokens < 50:
                issue_type_counts["low_tokens"] += 1
                clip_issues.append({
                    "type": "low_tokens",
                    "severity": "high" if tokens < 20 else "medium",
                    "level": "semantic_level",
                    "problem": {
                        "description": f"텍스트 표현 부족: 현재 {tokens}개 토큰, 필요 50개 이상",
                        "impact": "의미 전달 불충분으로 비디오 생성 품질 저하",
                        "root_cause": "Caption이 너무 간략하여 장면의 세부 정보, 동작, 맥락을 충분히 설명하지 못함"
                    },
                    "solution": {
                        "method": "LLM 기반 Caption 확장 (Gemini/GPT-4V)",
                        "steps": [
                            "1. 원본 비디오/이미지를 Vision LLM으로 분석",
                            "2. 객체, 동작, 배경, 분위기 등 세부 요소 추출",
                            "3. 50+ 토큰 상세 캡션 생성 (한국어)",
                            "4. 시간적 흐름과 인과관계 명시적 기술"
                        ],
                        "expected_result": f"{50 - tokens}개 토큰 추가 → 최소 50토큰 달성",
                        "priority": "높음" if tokens < 20 else "중간"
                    },
                    "details": {
                        "current_tokens": tokens,
                        "required_tokens": 50,
                        "missing": 50 - tokens,
                        "level_category": "의미론적 표현력"
                    }
                })

            # COT 체크
            has_cot = str(row.get('has_cot', 'False')).lower() == 'true'
            if not has_cot and tokens > 0:
                issue_type_counts["no_cot"] += 1
                clip_issues.append({
                    "type": "no_cot",
                    "severity": "medium",
                    "level": "application_level",
                    "problem": {
                        "description": "추론 과정(Chain-of-Thought) 누락",
                        "impact": "모델이 복잡한 장면 이해 및 생성 시 논리적 추론 능력 부족",
                        "root_cause": "단순 설명만 있고, '왜', '어떻게', '무엇을 위해' 등 응용 맥락 정보 부재"
                    },
                    "solution": {
                        "method": "COT 프롬프트 엔지니어링으로 추론 체인 생성",
                        "steps": [
                            "1. 원본 Caption 분석 후 주요 이벤트 추출",
                            "2. '이 장면이 왜 중요한가?', '다음에 무슨 일이 일어날까?' 질문 생성",
                            "3. LLM으로 단계별 추론 과정 생성 (3-5 단계)",
                            "4. 응용 분야(교육, 엔터테인먼트 등) 메타데이터 추가"
                        ],
                        "expected_result": "추론 체인 추가 → 응용 맥락 이해도 향상",
                        "priority": "중간"
                    },
                    "details": {
                        "has_cot": has_cot,
                        "application_areas": int(row.get('num_application_areas', 0)),
                        "level_category": "응용 및 맥락 이해"
                    }
                })

            # 품질 체크
            quality_pass = str(row.get('quality_pass', 'False')).lower() == 'true'
            if not quality_pass:
                issue_type_counts["quality_fail"] += 1
                clip_issues.append({
                    "type": "quality_fail",
                    "severity": "high",
                    "level": "object_level",
                    "problem": {
                        "description": "객체 및 장면 묘사 품질 미달",
                        "impact": "객체 식별 불가, 공간 관계 왜곡, 동작 표현 부정확",
                        "root_cause": "객체 속성(색상, 크기, 위치), 동작 세부사항, 객체 간 관계 정보 부족"
                    },
                    "solution": {
                        "method": "멀티모달 분석으로 객체 수준 정보 강화",
                        "steps": [
                            "1. Object Detection (YOLO/DINO) → 객체 위치, 크기 추출",
                            "2. Pose Estimation → 사람/동물 동작 세부 기술",
                            "3. Depth Estimation → 공간 관계 ('앞', '뒤', '옆') 명시",
                            "4. Action Recognition → 동작 동사 구체화 ('걷는다' → '빠르게 걸어간다')",
                            "5. 위 정보를 Caption에 통합"
                        ],
                        "expected_result": "객체 수준 품질 기준 통과 → 정확한 비디오 생성",
                        "priority": "높음"
                    },
                    "details": {
                        "quality_pass": quality_pass,
                        "tokens": tokens,
                        "level_category": "객체 인식 및 묘사"
                    }
                })

            # 이슈가 있는 경우에만 추가
            if clip_issues:
                issues.append({
                    "clip_id": str(row.get('clip_id', '')),
                    "media_type": str(row.get('media_type', '')),
                    "issues": clip_issues,
                    "issue_count": len(clip_issues)
                })

        return {
            "total_samples": total_samples,
            "samples_with_issues": len(issues),
            "issue_rate": (len(issues) / total_samples * 100) if total_samples > 0 else 0,
            "issue_types": issue_type_counts,
            "top_issues": sorted(issues, key=lambda x: x['issue_count'], reverse=True)[:100],
            "summary": {
                "low_tokens": {
                    "count": issue_type_counts["low_tokens"],
                    "description": "토큰 수가 50개 미만인 샘플",
                    "solution": "Caption 재생성"
                },
                "no_cot": {
                    "count": issue_type_counts["no_cot"],
                    "description": "Chain-of-Thought 데이터가 없는 샘플",
                    "solution": "COT 생성 스크립트 실행"
                },
                "quality_fail": {
                    "count": issue_type_counts["quality_fail"],
                    "description": "품질 기준을 통과하지 못한 샘플",
                    "solution": "품질 개선 또는 제외"
                }
            }
        }

    except Exception as e:
        print(f"Error analyzing issues: {e}")
        return {
            "error": str(e),
            "total_samples": 0,
            "samples_with_issues": 0
        }


@router.get("/sample/{clip_id}")
def get_sample_data(clip_id: str):
    """특정 샘플의 전체 데이터 조회 (COT 버전 + 원본)"""

    # COT CSV 파일 경로
    cot_csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'
    original_csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_data.csv'

    if not os.path.exists(cot_csv_path):
        raise HTTPException(status_code=404, detail="COT CSV file not found")

    try:
        # COT 데이터 로드
        df_cot = pd.read_csv(cot_csv_path)

        # clip_id로 샘플 찾기 (문자열을 정수로 변환)
        try:
            clip_id_int = int(clip_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid clip_id format: '{clip_id}'")

        sample_cot = df_cot[df_cot['clip_id'] == clip_id_int]

        if sample_cot.empty:
            raise HTTPException(status_code=404, detail=f"Sample with clip_id '{clip_id}' not found")

        # COT DataFrame row를 dict로 변환
        cot_dict = sample_cot.iloc[0].to_dict()

        # NaN 값을 None으로 변환
        for key, value in cot_dict.items():
            if pd.isna(value):
                cot_dict[key] = None

        # 원본 JSON 파일 로드 (all_data.csv에서 file_path를 가져와서 확장자를 .json으로 변경)
        original_dict = None
        if os.path.exists(original_csv_path):
            try:
                df_original = pd.read_csv(original_csv_path)
                sample_original = df_original[df_original['clip_id'] == clip_id_int]

                if not sample_original.empty:
                    # file_path 컬럼에서 원본 파일 경로 가져오기
                    file_path = sample_original.iloc[0].get('file_path')

                    if file_path and isinstance(file_path, str):
                        # 확장자를 .json으로 변경
                        json_path = os.path.splitext(file_path)[0] + '.json'

                        # JSON 파일 읽기
                        if os.path.exists(json_path):
                            try:
                                import json
                                with open(json_path, 'r', encoding='utf-8') as f:
                                    original_dict = json.load(f)
                                print(f"Successfully loaded original JSON from: {json_path}")
                            except Exception as json_error:
                                print(f"Error reading JSON file {json_path}: {json_error}")
                        else:
                            print(f"Original JSON file not found: {json_path}")
            except Exception as e:
                print(f"Error loading original data: {e}")

        return {
            "clip_id": clip_id,
            "cot_data": cot_dict,
            "original_data": original_dict
        }

    except Exception as e:
        print(f"Error fetching sample data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/media/{clip_id}")
def get_media_file(clip_id: str):
    """샘플의 미디어 파일 제공 (이미지 또는 비디오)"""

    # 먼저 샘플 정보 가져오기
    csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train_cot.csv'

    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found")

    try:
        df = pd.read_csv(csv_path)

        # clip_id를 정수로 변환
        try:
            clip_id_int = int(clip_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid clip_id format: '{clip_id}'")

        sample = df[df['clip_id'] == clip_id_int]

        if sample.empty:
            raise HTTPException(status_code=404, detail=f"Sample with clip_id '{clip_id}' not found")

        # 미디어 경로 가져오기
        media_path = sample.iloc[0].get('file_path') or sample.iloc[0].get('path')
        media_type = sample.iloc[0].get('media_type', 'unknown')

        if not media_path:
            raise HTTPException(status_code=404, detail="Media path not found in sample data")

        # 절대 경로로 변환
        if not os.path.isabs(media_path):
            # preprocessed_data 디렉토리 기준으로 경로 구성
            base_dir = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data'
            media_path = os.path.join(base_dir, media_path)

        if not os.path.exists(media_path):
            raise HTTPException(status_code=404, detail=f"Media file not found: {media_path}")

        # 미디어 타입에 따라 MIME 타입 결정
        if media_type == 'video' or media_path.endswith(('.mp4', '.avi', '.mov', '.webm')):
            media_type_mime = 'video/mp4'
        elif media_type == 'image' or media_path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            media_type_mime = 'image/png'
        else:
            media_type_mime = 'application/octet-stream'

        return FileResponse(
            media_path,
            media_type=media_type_mime,
            filename=os.path.basename(media_path)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving media file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/media/original/{clip_id}")
def get_original_media_file(clip_id: str):
    """원본 미디어 파일 제공 (이미지 또는 비디오)"""
    
    # 원본 데이터 CSV에서 경로 가져오기
    original_csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_data.csv'
    
    if not os.path.exists(original_csv_path):
        raise HTTPException(status_code=404, detail="Original CSV file not found")
    
    try:
        df = pd.read_csv(original_csv_path)
        
        # clip_id를 정수로 변환
        try:
            clip_id_int = int(clip_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid clip_id format: '{clip_id}'")
        
        sample = df[df['clip_id'] == clip_id_int]
        
        if sample.empty:
            raise HTTPException(status_code=404, detail=f"Original sample with clip_id '{clip_id}' not found")
        
        # 원본 미디어 경로 가져오기
        media_path = sample.iloc[0].get('file_path') or sample.iloc[0].get('path')
        media_type = sample.iloc[0].get('media_type', 'unknown')
        
        if not media_path:
            raise HTTPException(status_code=404, detail="Original media path not found in sample data")
        
        # 원본 파일 경로는 이미 절대 경로 (예: /home/devfit2/mbc_json/image/...)
        # 만약 절대 경로가 아니면 기본 경로 추가
        if not os.path.isabs(media_path):
            # 원본 경로는 /home/devfit2/mbc_json에 있음
            base_dir = '/home/devfit2/mbc_json'
            media_path = os.path.join(base_dir, media_path)
        
        if not os.path.exists(media_path):
            raise HTTPException(status_code=404, detail=f"Original media file not found: {media_path}")
        
        # 미디어 타입에 따라 MIME 타입 결정
        if media_type == 'video' or media_path.endswith(('.mp4', '.avi', '.mov', '.webm')):
            media_type_mime = 'video/mp4'
        elif media_type == 'image' or media_path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            media_type_mime = 'image/png'
        else:
            media_type_mime = 'application/octet-stream'
        
        return FileResponse(
            media_path,
            media_type=media_type_mime,
            filename=os.path.basename(media_path)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving original media file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validation-report")
def get_validation_report():
    """데이터 품질 검증 보고서 마크다운 파일 제공"""
    report_path = '/home/maiordba/projects/vision/Wan2.2/DATA_QUALITY_VALIDATION_REPORT.md'

    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Validation report not found")

    try:
        with open(report_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return {
            "content": content,
            "filename": "DATA_QUALITY_VALIDATION_REPORT.md"
        }

    except Exception as e:
        print(f"Error reading validation report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data-distribution")
def get_data_distribution():
    """학습 데이터 분포 분석 - 키워드, 카테고리, 불균형 분석"""

    # 학습 데이터 CSV 경로
    csv_path = '/home/maiordba/projects/vision/Wan2.2/diffsynth_data/train_metadata_1k.csv'

    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Training metadata not found")

    try:
        # CSV 읽기
        df = pd.read_csv(csv_path)
        total_samples = len(df)

        # 한국어 형태소 분석기 초기화 (KoNLPy 없어도 작동하도록 간단한 키워드 추출)
        all_keywords = []
        category_counts = {
            "urban": 0,      # 도시, 건물, 도로, 차량
            "nature": 0,     # 자연, 산, 바다, 나무, 숲
            "people": 0,     # 사람, 인물, 군중
            "indoor": 0,     # 실내, 교실, 회의실, 병원
            "action": 0,     # 움직임, 운동, 액션
            "object": 0,     # 물체, 제품, 도구
            "animal": 0,     # 동물, 새, 곤충
            "food": 0,       # 음식, 요리
            "other": 0       # 기타
        }

        # 카테고리 키워드 정의
        category_keywords = {
            "urban": ["도시", "건물", "도로", "차량", "거리", "교통", "건축", "주차", "고속도로", "아파트", "빌딩", "버스", "자동차", "트럭"],
            "nature": ["자연", "산", "바다", "나무", "숲", "강", "호수", "해변", "하늘", "구름", "경치", "풍경", "계곡", "들판"],
            "people": ["사람", "남성", "여성", "학생", "군중", "인물", "얼굴", "손", "발", "사람들", "인원", "관객"],
            "indoor": ["실내", "교실", "회의실", "병원", "방", "사무실", "강당", "복도", "천장", "벽", "바닥", "침대"],
            "action": ["걷는", "달리", "뛰", "움직", "이동", "운동", "경기", "춤", "작업", "수행", "진행", "활동"],
            "object": ["컨테이너", "크레인", "기계", "장비", "도구", "제품", "물건", "용기", "상자"],
            "animal": ["동물", "새", "고양이", "개", "물고기", "곤충", "말", "소"],
            "food": ["음식", "요리", "식품", "먹", "밥", "국", "빵", "과일", "야채"]
        }

        # 프롬프트별 분석
        prompt_lengths = []
        category_assignments = []

        for idx, row in df.iterrows():
            prompt = str(row.get('prompt', ''))
            prompt_lengths.append(len(prompt))

            # 명사 기반 키워드 추출 (Kiwi 형태소 분석)
            nouns = extract_nouns(prompt, min_length=2)
            all_keywords.extend(nouns)

            # 카테고리 분류 (프롬프트에 키워드가 포함되어 있는지 확인)
            assigned_categories = []
            for category, keywords in category_keywords.items():
                for keyword in keywords:
                    if keyword in prompt:
                        category_counts[category] += 1
                        assigned_categories.append(category)
                        break  # 하나라도 매칭되면 해당 카테고리 카운트

            # 카테고리가 없으면 other
            if not assigned_categories:
                category_counts["other"] += 1
                assigned_categories.append("other")

            category_assignments.append(assigned_categories)

        # 키워드 빈도 계산
        keyword_counter = Counter(all_keywords)
        top_keywords = keyword_counter.most_common(50)

        # 카테고리 분포 계산 (백분율)
        total_category_assignments = sum(category_counts.values())
        category_distribution = []
        for category, count in category_counts.items():
            percentage = (count / total_samples * 100) if total_samples > 0 else 0
            category_distribution.append({
                "category": category,
                "count": count,
                "percentage": round(percentage, 2)
            })

        # 불균형 지수 계산 (표준편차 기반)
        import statistics
        category_percentages = [item['percentage'] for item in category_distribution]
        expected_percentage = 100 / len(category_counts)  # 균등 분포시 예상 비율

        # 각 카테고리의 편차 계산
        imbalance_scores = []
        for item in category_distribution:
            deviation = abs(item['percentage'] - expected_percentage)
            imbalance_scores.append({
                "category": item['category'],
                "deviation": round(deviation, 2),
                "status": "과다" if item['percentage'] > expected_percentage * 1.5 else
                         "과소" if item['percentage'] < expected_percentage * 0.5 else "적정"
            })

        # 불균형 지수 (0-100, 100에 가까울수록 불균형)
        std_dev = statistics.stdev(category_percentages) if len(category_percentages) > 1 else 0
        imbalance_index = min(100, std_dev * 5)  # 스케일링

        # 프롬프트 길이 통계
        avg_prompt_length = sum(prompt_lengths) / len(prompt_lengths) if prompt_lengths else 0
        min_prompt_length = min(prompt_lengths) if prompt_lengths else 0
        max_prompt_length = max(prompt_lengths) if prompt_lengths else 0

        # 권장사항 생성
        recommendations = []
        sorted_categories = sorted(category_distribution, key=lambda x: x['percentage'], reverse=True)

        if sorted_categories[0]['percentage'] > 30:
            recommendations.append({
                "type": "warning",
                "message": f"{sorted_categories[0]['category']} 카테고리가 {sorted_categories[0]['percentage']}%로 과다 대표됨",
                "action": f"{sorted_categories[0]['category']} 샘플 일부 제거 또는 다른 카테고리 샘플 추가 필요"
            })

        under_represented = [cat for cat in sorted_categories if cat['percentage'] < 5 and cat['count'] > 0]
        if under_represented:
            cat_names = ", ".join([cat['category'] for cat in under_represented])
            recommendations.append({
                "type": "info",
                "message": f"{cat_names} 카테고리가 5% 미만으로 과소 대표됨",
                "action": "해당 카테고리의 샘플 추가 수집 권장"
            })

        if imbalance_index > 50:
            recommendations.append({
                "type": "warning",
                "message": f"데이터 불균형 지수가 {imbalance_index:.1f}로 높음",
                "action": "균형잡힌 데이터셋 재구성 권장 (각 카테고리 10-15% 목표)"
            })
        else:
            recommendations.append({
                "type": "success",
                "message": f"데이터 분포가 비교적 균형잡힘 (불균형 지수: {imbalance_index:.1f})",
                "action": "현재 분포 유지"
            })

        return {
            "summary": {
                "total_samples": total_samples,
                "unique_keywords": len(keyword_counter),
                "avg_prompt_length": round(avg_prompt_length, 2),
                "min_prompt_length": min_prompt_length,
                "max_prompt_length": max_prompt_length,
                "imbalance_index": round(imbalance_index, 2)
            },
            "keywords": {
                "top_50": [{"word": word, "count": count} for word, count in top_keywords],
                "total_unique": len(keyword_counter)
            },
            "categories": {
                "distribution": sorted(category_distribution, key=lambda x: x['percentage'], reverse=True),
                "imbalance_scores": sorted(imbalance_scores, key=lambda x: x['deviation'], reverse=True)
            },
            "recommendations": recommendations,
            "metadata": {
                "csv_path": csv_path,
                "analysis_date": pd.Timestamp.now().isoformat()
            }
        }

    except Exception as e:
        print(f"Error analyzing data distribution: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
