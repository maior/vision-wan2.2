#!/usr/bin/env python3
"""
개선된 연관규칙 분석 - 명사 기반 + 클러스터 대표 키워드
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from collections import Counter, defaultdict
from datetime import datetime

# Korean NLP
from kiwipiepy import Kiwi

# Association rules
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# Clustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans

# 경로 설정
INPUT_CSV = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'
OUTPUT_DIR = Path('/home/maiordba/projects/vision/Wan2.2/data_quality_analysis')
OUTPUT_DIR.mkdir(exist_ok=True)

RULES_JSON = OUTPUT_DIR / 'association_rules.json'
PATTERNS_JSON = OUTPUT_DIR / 'keyword_patterns.json'
SAMPLING_JSON = OUTPUT_DIR / 'advanced_sampling_results.json'

SAMPLE_SIZE_FOR_RULES = 50000

print("=" * 80)
print("개선된 연관규칙 분석 (명사 기반 + 클러스터 설명)")
print("=" * 80)

# 1. Kiwi 형태소 분석기 초기화
print(f"\n🔧 Kiwi 형태소 분석기 초기화 중...")
kiwi = Kiwi()
print(f"✓ 초기화 완료")

# 2. 데이터 로드
print(f"\n📂 데이터 로딩 중...")
df = pd.read_csv(INPUT_CSV, usecols=['clip_id', 'file_path', 'caption'])
print(f"✓ 총 {len(df):,}개 샘플 로드")

# 3. 명사 추출 함수
def extract_nouns(text, min_length=2, max_nouns=20):
    """Kiwi를 사용하여 명사만 추출"""
    if pd.isna(text):
        return []
    
    try:
        result = kiwi.analyze(str(text))
        if not result:
            return []
        
        # 명사(NNG, NNP) 추출
        nouns = []
        for token, pos, _, _ in result[0][0]:
            if pos in ('NNG', 'NNP') and len(token) >= min_length:
                # 숫자로만 이루어진 단어 제외
                if not token.isdigit():
                    nouns.append(token)
        
        # 중복 제거 및 상위 N개만
        return list(set(nouns))[:max_nouns]
    except:
        return []

# 4. 연관규칙 분석용 샘플링
print(f"\n🎲 연관규칙 분석용 {SAMPLE_SIZE_FOR_RULES:,}개 샘플링...")
if len(df) > SAMPLE_SIZE_FOR_RULES:
    rules_df = df.sample(n=SAMPLE_SIZE_FOR_RULES, random_state=42)
else:
    rules_df = df.copy()

print(f"✓ 샘플링 완료: {len(rules_df):,}개")

# 5. 명사 추출 (배치 처리)
print(f"\n🔍 명사 추출 중 (Kiwi 사용)...")
nouns_list = []
for i, caption in enumerate(rules_df['caption']):
    nouns = extract_nouns(caption)
    nouns_list.append(nouns)
    
    if (i + 1) % 5000 == 0:
        print(f"  진행: {i+1:,}/{len(rules_df):,}")

rules_df['nouns'] = nouns_list

# 6. 전체 명사 빈도 계산
all_nouns = []
for nouns in rules_df['nouns']:
    all_nouns.extend(nouns)

noun_freq = Counter(all_nouns)

# 상위 50개 명사만 사용
top_nouns = set([n for n, _ in noun_freq.most_common(50)])

print(f"✓ 전체 고유 명사: {len(noun_freq):,}개")
print(f"✓ 분석 대상 명사: {len(top_nouns)}개")

# 상위 30개 명사 출력
print(f"\n📊 가장 빈번한 명사 Top 30:")
for i, (noun, count) in enumerate(noun_freq.most_common(30), 1):
    pct = (count / len(rules_df)) * 100
    print(f"  {i:2d}. {noun:15} {count:6,}개 ({pct:5.1f}%)")

# 7. 트랜잭션 생성
print(f"\n📦 트랜잭션 생성 중...")
transactions = []
for nouns in rules_df['nouns']:
    transaction = [n for n in nouns if n in top_nouns]
    if transaction:
        transactions.append(list(set(transaction)))

print(f"✓ 생성된 트랜잭션: {len(transactions):,}개")

# 8. Apriori 알고리즘 실행
print(f"\n⚙️  Apriori 알고리즘 실행 중...")

te = TransactionEncoder()
te_ary = te.fit(transactions).transform(transactions)
trans_df = pd.DataFrame(te_ary, columns=te.columns_)

print(f"✓ 트랜잭션 매트릭스 생성: {trans_df.shape}")

min_support = 0.02
frequent_itemsets = apriori(trans_df, min_support=min_support, use_colnames=True, max_len=3)

print(f"✓ 발견된 빈번한 패턴: {len(frequent_itemsets)}개")

# 9. 연관규칙 생성
rules_data = []
if len(frequent_itemsets) > 0:
    print(f"\n🔗 연관규칙 생성 중...")
    
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.4, num_itemsets=len(frequent_itemsets))
    
    if len(rules) > 0:
        rules = rules.sort_values('lift', ascending=False)
        print(f"✓ 발견된 연관규칙: {len(rules)}개")
        
        print(f"\n🏆 강력한 연관규칙 Top 15 (Lift 기준):")
        for idx, row in rules.head(15).iterrows():
            antecedents = ', '.join(list(row['antecedents']))
            consequents = ', '.join(list(row['consequents']))
            print(f"  {antecedents:20} => {consequents:20}")
            print(f"    Sup: {row['support']:.3f} | Conf: {row['confidence']:.3f} | Lift: {row['lift']:.2f}")
        
        for idx, row in rules.iterrows():
            rules_data.append({
                'antecedents': list(row['antecedents']),
                'consequents': list(row['consequents']),
                'support': float(row['support']),
                'confidence': float(row['confidence']),
                'lift': float(row['lift'])
            })
        
        with open(RULES_JSON, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_transactions': len(transactions),
                'total_rules': len(rules),
                'rules': rules_data[:50]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"✓ 연관규칙 저장: {RULES_JSON}")

# 10. 키워드 네트워크
print(f"\n📈 키워드 네트워크 생성 중...")

keyword_cooccurrence = defaultdict(lambda: defaultdict(int))

for transaction in transactions:
    for i, kw1 in enumerate(transaction):
        for kw2 in transaction[i+1:]:
            keyword_cooccurrence[kw1][kw2] += 1
            keyword_cooccurrence[kw2][kw1] += 1

edges = []
for kw1, connections in keyword_cooccurrence.items():
    for kw2, count in connections.items():
        if count > len(transactions) * 0.01:
            edges.append({
                'source': kw1,
                'target': kw2,
                'weight': count,
                'support': count / len(transactions)
            })

edges = sorted(edges, key=lambda x: x['weight'], reverse=True)[:30]

nodes = [{'id': n, 'count': c, 'frequency': c / len(rules_df)} 
         for n, c in noun_freq.most_common(30)]

with open(PATTERNS_JSON, 'w', encoding='utf-8') as f:
    json.dump({
        'timestamp': datetime.now().isoformat(),
        'nodes': nodes,
        'edges': edges
    }, f, indent=2, ensure_ascii=False)

print(f"✓ 키워드 패턴 저장: {PATTERNS_JSON}")

# 11. 클러스터링 (전체 데이터)
print(f"\n🎯 클러스터링 (전체 데이터셋)...")

print(f"  1) TF-IDF 벡터화...")
vectorizer = TfidfVectorizer(max_features=100, min_df=10, max_df=0.5)
tfidf_matrix = vectorizer.fit_transform(df['caption'].fillna(''))

print(f"  2) MiniBatch K-Means 클러스터링 (K=15)...")
n_clusters = 15
kmeans = MiniBatchKMeans(n_clusters=n_clusters, random_state=42, batch_size=1000, n_init=3)
df['cluster'] = kmeans.fit_predict(tfidf_matrix)

print(f"✓ 클러스터링 완료")

# 12. 각 클러스터의 대표 명사 추출
print(f"\n  3) 클러스터별 대표 키워드 추출...")

# 전체 데이터에서 명사 추출 (샘플링)
print(f"     전체 데이터에서 명사 추출 중 (10K 샘플)...")
sample_for_nouns = df.sample(n=min(10000, len(df)), random_state=42)
sample_nouns = []
for i, caption in enumerate(sample_for_nouns['caption']):
    nouns = extract_nouns(caption, min_length=2)
    sample_nouns.append(nouns)
    if (i + 1) % 2000 == 0:
        print(f"       {i+1:,}/10,000")

sample_for_nouns['nouns'] = sample_nouns

# 클러스터별 대표 명사
cluster_info = []
for cluster_id in range(n_clusters):
    cluster_samples = sample_for_nouns[sample_for_nouns['cluster'] == cluster_id]
    total_in_cluster = len(df[df['cluster'] == cluster_id])
    
    # 클러스터 내 명사 빈도
    cluster_nouns = []
    for nouns in cluster_samples['nouns']:
        cluster_nouns.extend(nouns)
    
    top_cluster_nouns = Counter(cluster_nouns).most_common(5)
    
    cluster_info.append({
        'cluster_id': cluster_id,
        'size': total_in_cluster,
        'percentage': total_in_cluster / len(df) * 100,
        'top_keywords': [{'keyword': n, 'count': c} for n, c in top_cluster_nouns],
        'description': ', '.join([n for n, _ in top_cluster_nouns[:3]])  # 상위 3개로 설명
    })

print(f"✓ 클러스터 대표 키워드 생성 완료")

# 13. 클러스터 분포 출력
print(f"\n📊 클러스터 분포 (대표 키워드 포함):")
for info in sorted(cluster_info, key=lambda x: x['size'], reverse=True):
    print(f"  클러스터 {info['cluster_id']:2d}: {info['size']:6,}개 ({info['percentage']:5.1f}%)")
    print(f"    대표 키워드: {info['description']}")

# 14. 다양성 기반 샘플링
print(f"\n  4) 다양성 기반 샘플링 (50K)...")

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

print(f"✓ 선택된 샘플: {len(selected_indices):,}개")

# 15. 결과 저장
selected_df = df.loc[selected_indices]

output_df = pd.DataFrame({
    'video': selected_df['file_path'],
    'prompt': selected_df['caption']
})

advanced_csv = OUTPUT_DIR / 'train_metadata_50k_advanced.csv'
output_df.to_csv(advanced_csv, index=False)

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
            'percentage': float(count / len(selected_df) * 100),
            'description': cluster_info[cid]['description'],
            'top_keywords': cluster_info[cid]['top_keywords']
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
print(f"  - 연관규칙: {len(rules_data)}개 (명사 기반)")
print(f"  - 키워드 엣지: {len(edges)}개")
print(f"  - 클러스터: {n_clusters}개 (대표 키워드 포함)")
print(f"  - 선택된 샘플: {len(selected_df):,}개")
