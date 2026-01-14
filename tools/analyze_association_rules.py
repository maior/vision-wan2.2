#!/usr/bin/env python3
"""
연관규칙 분석을 통한 데이터셋 패턴 발견 및 고급 샘플링
메모리 효율적 버전
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
import sys

# Association rules
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# Clustering for diversity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics.pairwise import cosine_distances

# 경로 설정
INPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_DIR = Path('/home/maiordba/projects/vision/Wan2.2/data_quality_analysis')
OUTPUT_DIR.mkdir(exist_ok=True)

# 분석 결과 저장 경로
RULES_JSON = OUTPUT_DIR / 'association_rules.json'
PATTERNS_JSON = OUTPUT_DIR / 'keyword_patterns.json'
SAMPLING_JSON = OUTPUT_DIR / 'advanced_sampling_results.json'

# 메모리 절약을 위한 샘플링
SAMPLE_SIZE_FOR_RULES = 50000  # 연관규칙 분석용 샘플 크기

print("=" * 80)
print("연관규칙 기반 데이터셋 분석 및 고급 샘플링 (메모리 효율화 버전)")
print("=" * 80)

# 1. 데이터 로드 (필요한 컬럼만)
print(f"\n📂 데이터 로딩 중...")
df = pd.read_csv(INPUT_CSV, usecols=['clip_id', 'file_path', 'caption'])
print(f"✓ 총 {len(df):,}개 샘플 로드")

# 2. 키워드 추출 함수
def extract_keywords(text, min_length=2, max_keywords=20):
    """텍스트에서 의미있는 키워드 추출 (메모리 효율화)"""
    if pd.isna(text):
        return []
    
    # 한글만 추출 (영문 제외로 메모리 절약)
    words = re.findall(r'[가-힣]{2,}', str(text))
    
    # 불용어 제거
    stopwords = {'있는', '있다', '되는', '되다', '하는', '하다', '이다', '그', '저', '것', 
                 '있습니다', '됩니다', '합니다', '에서', '에게', '으로', '를', '을', '가', '이'}
    keywords = [w for w in words if w not in stopwords]
    
    # 상위 N개만 반환
    return list(set(keywords))[:max_keywords]

# 3. 연관규칙 분석용 샘플링
print(f"\n🎲 연관규칙 분석용 {SAMPLE_SIZE_FOR_RULES:,}개 샘플링...")
if len(df) > SAMPLE_SIZE_FOR_RULES:
    rules_df = df.sample(n=SAMPLE_SIZE_FOR_RULES, random_state=42)
else:
    rules_df = df.copy()

print(f"✓ 샘플링 완료: {len(rules_df):,}개")

# 4. 키워드 추출
print(f"\n🔍 키워드 추출 중...")
rules_df['keywords'] = rules_df['caption'].apply(extract_keywords)

# 전체 키워드 빈도 계산
all_keywords = []
for i, kws in enumerate(rules_df['keywords']):
    all_keywords.extend(kws)
    if (i + 1) % 10000 == 0:
        print(f"  진행: {i+1:,}/{len(rules_df):,}")

keyword_freq = Counter(all_keywords)

# 상위 50개 키워드만 사용
top_keywords = set([k for k, _ in keyword_freq.most_common(50)])

print(f"✓ 전체 고유 키워드: {len(keyword_freq):,}개")
print(f"✓ 분석 대상 키워드: {len(top_keywords)}개")

# 상위 20개 키워드 출력
print(f"\n📊 가장 빈번한 키워드 Top 20:")
for i, (keyword, count) in enumerate(keyword_freq.most_common(20), 1):
    pct = (count / len(rules_df)) * 100
    print(f"  {i:2d}. {keyword:15} {count:6,}개 ({pct:5.1f}%)")

# 5. 트랜잭션 생성
print(f"\n📦 트랜잭션 생성 중...")
transactions = []
for kws in rules_df['keywords']:
    transaction = [k for k in kws if k in top_keywords]
    if transaction:
        transactions.append(list(set(transaction)))

print(f"✓ 생성된 트랜잭션: {len(transactions):,}개")

# 6. Apriori 알고리즘 실행
print(f"\n⚙️  Apriori 알고리즘 실행 중...")

te = TransactionEncoder()
te_ary = te.fit(transactions).transform(transactions)
trans_df = pd.DataFrame(te_ary, columns=te.columns_)

print(f"✓ 트랜잭션 매트릭스 생성: {trans_df.shape}")

# Apriori로 빈번한 아이템셋 찾기
min_support = 0.02  # 2% 지지도
frequent_itemsets = apriori(trans_df, min_support=min_support, use_colnames=True, max_len=3)

print(f"✓ 발견된 빈번한 패턴: {len(frequent_itemsets)}개")

# 7. 연관규칙 생성
rules_data = []
if len(frequent_itemsets) > 0:
    print(f"\n🔗 연관규칙 생성 중...")
    
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.4, num_itemsets=len(frequent_itemsets))
    
    if len(rules) > 0:
        rules = rules.sort_values('lift', ascending=False)
        print(f"✓ 발견된 연관규칙: {len(rules)}개")
        
        # 상위 15개 규칙 출력
        print(f"\n🏆 강력한 연관규칙 Top 15 (Lift 기준):")
        for idx, row in rules.head(15).iterrows():
            antecedents = ', '.join(list(row['antecedents']))
            consequents = ', '.join(list(row['consequents']))
            print(f"  {antecedents:20} => {consequents:20}")
            print(f"    Sup: {row['support']:.3f} | Conf: {row['confidence']:.3f} | Lift: {row['lift']:.2f}")
        
        # JSON 저장용 데이터
        for idx, row in rules.iterrows():
            rules_data.append({
                'antecedents': list(row['antecedents']),
                'consequents': list(row['consequents']),
                'support': float(row['support']),
                'confidence': float(row['confidence']),
                'lift': float(row['lift'])
            })
        
        # 저장
        with open(RULES_JSON, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_transactions': len(transactions),
                'total_rules': len(rules),
                'rules': rules_data[:50]  # 상위 50개
            }, f, indent=2, ensure_ascii=False)
        
        print(f"✓ 연관규칙 저장: {RULES_JSON}")

# 8. 키워드 패턴 네트워크
print(f"\n📈 키워드 네트워크 생성 중...")

keyword_cooccurrence = defaultdict(lambda: defaultdict(int))

for transaction in transactions:
    for i, kw1 in enumerate(transaction):
        for kw2 in transaction[i+1:]:
            keyword_cooccurrence[kw1][kw2] += 1
            keyword_cooccurrence[kw2][kw1] += 1

# 엣지 생성
edges = []
for kw1, connections in keyword_cooccurrence.items():
    for kw2, count in connections.items():
        if count > len(transactions) * 0.01:  # 1% 이상
            edges.append({
                'source': kw1,
                'target': kw2,
                'weight': count,
                'support': count / len(transactions)
            })

edges = sorted(edges, key=lambda x: x['weight'], reverse=True)[:30]

# 노드 생성
nodes = [{'id': k, 'count': c, 'frequency': c / len(rules_df)} 
         for k, c in keyword_freq.most_common(30)]

with open(PATTERNS_JSON, 'w', encoding='utf-8') as f:
    json.dump({
        'timestamp': datetime.now().isoformat(),
        'nodes': nodes,
        'edges': edges
    }, f, indent=2, ensure_ascii=False)

print(f"✓ 키워드 패턴 저장: {PATTERNS_JSON}")

# 9. 고급 샘플링: MiniBatchKMeans로 메모리 절약
print(f"\n🎯 고급 샘플링 (전체 데이터셋)...")

print(f"  1) TF-IDF 벡터화...")
vectorizer = TfidfVectorizer(max_features=100, min_df=10, max_df=0.5)
tfidf_matrix = vectorizer.fit_transform(df['caption'].fillna(''))

print(f"  2) MiniBatch K-Means 클러스터링 (K=15)...")
n_clusters = 15
kmeans = MiniBatchKMeans(n_clusters=n_clusters, random_state=42, batch_size=1000, n_init=3)
df['cluster'] = kmeans.fit_predict(tfidf_matrix)

print(f"✓ 클러스터링 완료")

# 클러스터 분포
cluster_dist = df['cluster'].value_counts().sort_index()
print(f"\n📊 클러스터 분포:")
for cid, count in cluster_dist.items():
    pct = count / len(df) * 100
    print(f"  클러스터 {cid:2d}: {count:6,}개 ({pct:5.1f}%)")

# 10. 다양성 기반 샘플링
print(f"\n  3) 다양성 기반 샘플링 (50K)...")

TARGET_SAMPLES = 50000
samples_per_cluster = TARGET_SAMPLES // n_clusters

selected_indices = []

for cluster_id in range(n_clusters):
    cluster_df = df[df['cluster'] == cluster_id]
    n_select = min(samples_per_cluster, len(cluster_df))
    
    if n_select > 0:
        # 랜덤 샘플링 (메모리 절약)
        sampled = cluster_df.sample(n=n_select, random_state=42)
        selected_indices.extend(sampled.index.tolist())

# 부족분 채우기
if len(selected_indices) < TARGET_SAMPLES:
    remaining = TARGET_SAMPLES - len(selected_indices)
    remaining_indices = list(set(range(len(df))) - set(selected_indices))
    additional = np.random.choice(remaining_indices, size=min(remaining, len(remaining_indices)), replace=False)
    selected_indices.extend(additional)

print(f"✓ 선택된 샘플: {len(selected_indices):,}개")

# 11. 결과 저장
selected_df = df.loc[selected_indices]

output_df = pd.DataFrame({
    'video': selected_df['file_path'],
    'prompt': selected_df['caption']
})

advanced_csv = OUTPUT_DIR / 'train_metadata_50k_advanced.csv'
output_df.to_csv(advanced_csv, index=False)

# 샘플링 결과 저장
selected_cluster_dist = selected_df['cluster'].value_counts().sort_index()

sampling_results = {
    'timestamp': datetime.now().isoformat(),
    'method': 'diversity_based_clustering',
    'total_samples': len(selected_df),
    'n_clusters': n_clusters,
    'cluster_distribution': [
        {
            'cluster_id': int(cid),
            'count': int(count),
            'percentage': float(count / len(selected_df) * 100)
        }
        for cid, count in selected_cluster_dist.items()
    ]
}

with open(SAMPLING_JSON, 'w', encoding='utf-8') as f:
    json.dump(sampling_results, f, indent=2, ensure_ascii=False)

print(f"✓ 고급 샘플링 CSV: {advanced_csv}")
print(f"✓ 샘플링 결과 JSON: {SAMPLING_JSON}")

print(f"\n✅ 분석 완료!")
print(f"\n📋 요약:")
print(f"  - 연관규칙: {len(rules_data)}개")
print(f"  - 키워드 엣지: {len(edges)}개")
print(f"  - 클러스터: {n_clusters}개")
print(f"  - 선택된 샘플: {len(selected_df):,}개")
