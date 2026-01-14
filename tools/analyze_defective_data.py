#!/usr/bin/env python3
"""
클러스터별 고유 키워드 분석 (TF-IDF 기반)
각 클러스터를 하나의 문서로 보고, 클러스터 간 차별화되는 키워드 추출
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from collections import Counter
from datetime import datetime
from kiwipiepy import Kiwi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans

INPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_DIR = Path('/home/maiordba/projects/vision/Wan2.2/data_quality_analysis')
SAMPLING_JSON = OUTPUT_DIR / 'advanced_sampling_results.json'

print("=" * 80)
print("클러스터별 고유/특징 키워드 추출")
print("=" * 80)

# Kiwi 초기화
print(f"\n🔧 Kiwi 초기화...")
kiwi = Kiwi()

# 데이터 로드
print(f"\n📂 데이터 로딩...")
df = pd.read_csv(INPUT_CSV, usecols=['clip_id', 'file_path', 'caption'])
print(f"✓ {len(df):,}개 샘플")

# 명사 추출
def extract_nouns(text):
    if pd.isna(text):
        return []
    try:
        result = kiwi.analyze(str(text))
        if not result:
            return []
        nouns = []
        for token, pos, _, _ in result[0][0]:
            if pos in ('NNG', 'NNP') and len(token) >= 2 and not token.isdigit():
                nouns.append(token)
        return nouns
    except:
        return []

# 클러스터링
print(f"\n🎯 클러스터링...")
vectorizer = TfidfVectorizer(max_features=100, min_df=10, max_df=0.5)
tfidf_matrix = vectorizer.fit_transform(df['caption'].fillna(''))

n_clusters = 15
kmeans = MiniBatchKMeans(n_clusters=n_clusters, random_state=42, batch_size=1000, n_init=3)
df['cluster'] = kmeans.fit_predict(tfidf_matrix)

print(f"✓ 완료")

# 샘플링하여 명사 추출 (전체는 너무 느림)
print(f"\n🔍 클러스터별 명사 추출 (20K 샘플)...")
sample_df = df.sample(n=min(20000, len(df)), random_state=42)
sample_df['nouns'] = sample_df['caption'].apply(extract_nouns)

# 각 클러스터를 하나의 "문서"로 만들기
print(f"\n📄 클러스터별 문서 생성...")
cluster_documents = []
for cluster_id in range(n_clusters):
    cluster_samples = sample_df[sample_df['cluster'] == cluster_id]
    # 모든 명사를 하나의 문자열로
    all_nouns = []
    for nouns_list in cluster_samples['nouns']:
        all_nouns.extend(nouns_list)
    cluster_doc = ' '.join(all_nouns)
    cluster_documents.append(cluster_doc)

# 클러스터 간 TF-IDF로 고유 키워드 찾기
print(f"\n🔬 클러스터별 특징 키워드 추출 (TF-IDF)...")
cluster_vectorizer = TfidfVectorizer(max_features=10)
cluster_tfidf = cluster_vectorizer.fit_transform(cluster_documents)

# 각 클러스터의 상위 TF-IDF 키워드
cluster_info = []
feature_names = cluster_vectorizer.get_feature_names_out()

for cluster_id in range(n_clusters):
    # 이 클러스터의 TF-IDF 벡터
    tfidf_scores = cluster_tfidf[cluster_id].toarray()[0]
    
    # 상위 5개 키워드 (TF-IDF 점수 기준)
    top_indices = tfidf_scores.argsort()[-5:][::-1]
    distinctive_keywords = [(feature_names[idx], tfidf_scores[idx]) for idx in top_indices if tfidf_scores[idx] > 0]
    
    total_in_cluster = len(df[df['cluster'] == cluster_id])
    
    # 의미있는 설명 생성
    if distinctive_keywords:
        top_words = [kw for kw, score in distinctive_keywords[:3]]
        description = ', '.join(top_words)
        
        # 클러스터 주제 레이블링 (휴리스틱)
        theme = "일반"
        if any(w in top_words for w in ['건물', '도시', '건축', '거리', '도로']):
            theme = "도시/건축"
        elif any(w in top_words for w in ['자연', '풍경', '산', '바다', '하늘']):
            theme = "자연/풍경"
        elif any(w in top_words for w in ['전통', '문화', '역사', '유적']):
            theme = "전통/문화"
        elif any(w in top_words for w in ['산업', '공장', '현장', '건설']):
            theme = "산업/현장"
        elif any(w in top_words for w in ['교통', '차량', '도로', '이동']):
            theme = "교통/이동"
        elif any(w in top_words for w in ['교육', '학교', '학생', '수업']):
            theme = "교육"
        elif any(w in top_words for w in ['실내', '내부', '방', '공간']):
            theme = "실내공간"
    else:
        description = "기타"
        theme = "일반"
        distinctive_keywords = []
    
    cluster_info.append({
        'cluster_id': cluster_id,
        'size': total_in_cluster,
        'percentage': total_in_cluster / len(df) * 100,
        'theme': theme,
        'description': description,
        'top_keywords': [{'keyword': kw, 'score': float(score)} for kw, score in distinctive_keywords[:5]]
    })

# 결과 출력
print(f"\n📊 클러스터별 고유 특징:")
for info in sorted(cluster_info, key=lambda x: x['size'], reverse=True):
    print(f"  클러스터 {info['cluster_id']:2d} [{info['theme']:12}]: {info['size']:6,}개 ({info['percentage']:5.1f}%)")
    print(f"    특징 키워드: {info['description']}")

# 다양성 샘플링
print(f"\n🎲 다양성 기반 샘플링 (50K)...")
TARGET_SAMPLES = 50000
samples_per_cluster = TARGET_SAMPLES // n_clusters
selected_indices = []

for cluster_id in range(n_clusters):
    cluster_df = df[df['cluster'] == cluster_id]
    n_select = min(samples_per_cluster, len(cluster_df))
    if n_select > 0:
        sampled = cluster_df.sample(n=n_select, random_state=42)
        selected_indices.extend(sampled.index.tolist())

if len(selected_indices) < TARGET_SAMPLES:
    remaining = TARGET_SAMPLES - len(selected_indices)
    remaining_indices = list(set(range(len(df))) - set(selected_indices))
    additional = np.random.choice(remaining_indices, size=min(remaining, len(remaining_indices)), replace=False)
    selected_indices.extend(additional)

selected_df = df.loc[selected_indices]
selected_cluster_dist = selected_df['cluster'].value_counts().sort_index()

# 저장
sampling_results = {
    'timestamp': datetime.now().isoformat(),
    'method': 'diversity_based_clustering_with_distinctive_keywords',
    'total_samples': len(selected_df),
    'n_clusters': n_clusters,
    'cluster_distribution': [
        {
            'cluster_id': int(cid),
            'count': int(count),
            'percentage': float(count / len(selected_df) * 100),
            'theme': cluster_info[cid]['theme'],
            'description': cluster_info[cid]['description'],
            'top_keywords': cluster_info[cid]['top_keywords']
        }
        for cid, count in selected_cluster_dist.items()
    ]
}

with open(SAMPLING_JSON, 'w', encoding='utf-8') as f:
    json.dump(sampling_results, f, indent=2, ensure_ascii=False)

print(f"✓ 저장: {SAMPLING_JSON}")
print(f"\n✅ 완료! 각 클러스터가 고유한 특징을 가지게 되었습니다.")
