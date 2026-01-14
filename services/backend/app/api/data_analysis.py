"""
데이터 분석 API - 연관규칙, 키워드 패턴, 클러스터링 결과 제공
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from typing import Dict, List, Any

router = APIRouter()

# 데이터 분석 결과 디렉토리
ANALYSIS_DIR = Path(__file__).parent.parent.parent.parent.parent / "data_quality_analysis"

@router.get("/association-rules")
async def get_association_rules() -> Dict[str, Any]:
    """연관규칙 분석 결과 조회"""
    rules_file = ANALYSIS_DIR / "association_rules.json"
    
    if not rules_file.exists():
        raise HTTPException(status_code=404, detail="Association rules data not found")
    
    try:
        with open(rules_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading association rules: {str(e)}")


@router.get("/keyword-patterns")
async def get_keyword_patterns() -> Dict[str, Any]:
    """키워드 패턴 네트워크 데이터 조회"""
    patterns_file = ANALYSIS_DIR / "keyword_patterns.json"
    
    if not patterns_file.exists():
        raise HTTPException(status_code=404, detail="Keyword patterns data not found")
    
    try:
        with open(patterns_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading keyword patterns: {str(e)}")


@router.get("/sampling-results")
async def get_sampling_results() -> Dict[str, Any]:
    """고급 샘플링 결과 조회"""
    sampling_file = ANALYSIS_DIR / "advanced_sampling_results.json"
    
    if not sampling_file.exists():
        raise HTTPException(status_code=404, detail="Sampling results data not found")
    
    try:
        with open(sampling_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading sampling results: {str(e)}")


@router.get("/summary")
async def get_analysis_summary() -> Dict[str, Any]:
    """전체 분석 결과 요약"""
    try:
        # 연관규칙 요약
        rules_file = ANALYSIS_DIR / "association_rules.json"
        rules_summary = {"total_rules": 0, "timestamp": None}
        if rules_file.exists():
            with open(rules_file, 'r', encoding='utf-8') as f:
                rules_data = json.load(f)
                rules_summary = {
                    "total_rules": rules_data.get("total_rules", 0),
                    "total_transactions": rules_data.get("total_transactions", 0),
                    "timestamp": rules_data.get("timestamp")
                }
        
        # 키워드 패턴 요약
        patterns_file = ANALYSIS_DIR / "keyword_patterns.json"
        patterns_summary = {"nodes": 0, "edges": 0}
        if patterns_file.exists():
            with open(patterns_file, 'r', encoding='utf-8') as f:
                patterns_data = json.load(f)
                patterns_summary = {
                    "nodes": len(patterns_data.get("nodes", [])),
                    "edges": len(patterns_data.get("edges", []))
                }
        
        # 샘플링 결과 요약
        sampling_file = ANALYSIS_DIR / "advanced_sampling_results.json"
        sampling_summary = {"total_samples": 0, "clusters": 0}
        if sampling_file.exists():
            with open(sampling_file, 'r', encoding='utf-8') as f:
                sampling_data = json.load(f)
                sampling_summary = {
                    "total_samples": sampling_data.get("total_samples", 0),
                    "n_clusters": sampling_data.get("n_clusters", 0),
                    "method": sampling_data.get("method", "unknown")
                }
        
        return {
            "association_rules": rules_summary,
            "keyword_patterns": patterns_summary,
            "sampling": sampling_summary
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
